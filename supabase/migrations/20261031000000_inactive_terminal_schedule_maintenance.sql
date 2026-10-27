alter table public.vehicles
  add column is_sample boolean not null default false;

create policy terminal_schedules_admin_read on public.terminal_schedules
  for select to authenticated using (public.is_super_admin());

create or replace view public.public_vehicle_directory with (security_barrier = true) as
select v.id, v.terminal_id, v.body_number, v.vehicle_type, v.status,
  p.display_name as driver_name, p.photo_url as driver_photo_url
from public.vehicles v
join public.terminals t on t.id = v.terminal_id
join public.groups g on g.id = t.group_id
left join public.drivers d on d.profile_id = v.assigned_driver_id and d.membership_status = 'approved'
left join public.profiles p on p.id = d.profile_id
where t.is_active and g.is_active and v.status <> 'maintenance' and not v.is_sample;

create or replace function public.save_terminal_schedule(target_terminal uuid, schedule_entries jsonb)
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
  where t.id = target_terminal
  for update;
  if not found then
    raise exception 'Terminal not found.';
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

comment on function public.save_terminal_schedule(uuid, jsonb) is
  'Allows the super admin to maintain archived terminal hours; chairpersons remain scoped to their active group.';
