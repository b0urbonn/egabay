alter table public.groups
  add column is_sample boolean not null default false;
alter table public.terminals
  add column is_sample boolean not null default false;
alter table public.routes
  add column is_sample boolean not null default false;

create table public.terminal_schedules (
  terminal_id uuid not null references public.terminals(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  status text not null check (status in ('open', 'closed', 'unpublished')),
  opens_at time,
  closes_at time,
  is_sample boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (terminal_id, day_of_week),
  check (
    (status = 'open' and opens_at is not null and closes_at is not null and opens_at < closes_at)
    or (status in ('closed', 'unpublished') and opens_at is null and closes_at is null)
  )
);

create index terminal_schedules_day_idx on public.terminal_schedules(day_of_week, terminal_id);
alter table public.terminal_schedules enable row level security;

revoke all on public.terminal_schedules from public, anon, authenticated;
grant select on public.terminal_schedules to anon, authenticated;

create policy terminal_schedules_public on public.terminal_schedules
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.terminals t
      join public.groups g on g.id = t.group_id
      where t.id = terminal_id and t.is_active and g.is_active
    )
  );

create function public.save_terminal_schedule(target_terminal uuid, schedule_entries jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  terminal_group uuid;
  day_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select t.group_id into terminal_group
  from public.terminals t
  where t.id = target_terminal and t.is_active
  for update;
  if not found then
    raise exception 'Active terminal not found.';
  end if;
  if not coalesce(public.is_super_admin() or terminal_group = public.chaired_group_id(), false) then
    raise exception 'Only the super admin or the assigned group chairperson can edit terminal hours.' using errcode = '42501';
  end if;
  if jsonb_typeof(schedule_entries) <> 'array' or jsonb_array_length(schedule_entries) <> 7 then
    raise exception 'Provide one schedule entry for every day of the week.';
  end if;

  select count(distinct entry.day_of_week) into day_count
  from jsonb_to_recordset(schedule_entries) as entry(
    day_of_week integer, status text, opens_at time, closes_at time
  );
  if day_count <> 7 then
    raise exception 'Each day of the week must appear exactly once.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(schedule_entries) as entry(
      day_of_week integer, status text, opens_at time, closes_at time
    )
    where entry.day_of_week not between 0 and 6
      or entry.status is null
      or entry.status not in ('open', 'closed', 'unpublished')
      or (entry.status = 'open' and (entry.opens_at is null or entry.closes_at is null or entry.opens_at >= entry.closes_at))
      or (entry.status in ('closed', 'unpublished') and (entry.opens_at is not null or entry.closes_at is not null))
  ) then
    raise exception 'Open hours need a valid start and end time; closed or unpublished days cannot include times.';
  end if;

  insert into public.terminal_schedules(terminal_id, day_of_week, status, opens_at, closes_at, is_sample, updated_at)
  select target_terminal, entry.day_of_week, entry.status, entry.opens_at, entry.closes_at, false, now()
  from jsonb_to_recordset(schedule_entries) as entry(
    day_of_week integer, status text, opens_at time, closes_at time
  )
  on conflict (terminal_id, day_of_week) do update set
    status = excluded.status,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    is_sample = false,
    updated_at = now();
end;
$$;

revoke all on function public.save_terminal_schedule(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_terminal_schedule(uuid, jsonb) to authenticated;

create trigger audit_privileged_write
  after insert or update or delete on public.terminal_schedules
  for each row execute function public.audit_privileged_write();

comment on table public.terminal_schedules is
  'One weekly opening status per terminal and weekday. Day 0 is Sunday. Sample entries must be confirmed by the responsible chairperson.';
