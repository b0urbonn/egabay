-- Terminals become many-to-many with transport groups, scoped by type.
-- A terminal carries its own kind ('toda' | 'jeepney'); terminal_groups links
-- it to one or more groups, and links are only allowed between matching kinds.

alter table public.terminals add column kind text;
update public.terminals terminal
set kind = transport_group.kind
from public.groups transport_group
where transport_group.id = terminal.group_id;
alter table public.terminals alter column kind set not null;
alter table public.terminals add constraint terminals_kind_check check (kind in ('toda', 'jeepney'));

create table public.terminal_groups (
  terminal_id uuid not null references public.terminals(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  primary key (terminal_id, group_id)
);
create index terminal_groups_group_idx on public.terminal_groups(group_id);

insert into public.terminal_groups(terminal_id, group_id)
select id, group_id from public.terminals;

create or replace function public.validate_group_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'groups' then
    if new.chairperson_id is not null and not exists(select 1 from public.profiles p where p.id = new.chairperson_id and p.role = 'chairperson') then
      raise exception 'Assign the chairperson role before assigning this group.';
    end if;
    if tg_op = 'UPDATE' and new.kind <> old.kind
      and exists(select 1 from public.terminal_groups where group_id = old.id) then
      raise exception 'Unlink the group terminals before changing its transport type.';
    end if;
  elsif tg_table_name = 'terminals' then
    if tg_op = 'UPDATE' and new.kind <> old.kind
      and exists(select 1 from public.terminal_groups where terminal_id = old.id) then
      raise exception 'Unlink the terminal groups before changing its transport type.';
    end if;
  elsif tg_table_name = 'terminal_groups' then
    if tg_op = 'DELETE' then
      if exists(select 1 from public.vehicles v join public.drivers d on d.profile_id = v.assigned_driver_id
        where v.terminal_id = old.terminal_id and d.group_id = old.group_id) then
        raise exception 'Move the terminal vehicles before unlinking this group.';
      end if;
      return old;
    end if;
    if not exists(select 1 from public.terminals t join public.groups g on g.id = new.group_id
      where t.id = new.terminal_id and t.kind = g.kind) then
      raise exception 'Terminals and groups can only link within the same transport type.';
    end if;
  elsif tg_table_name = 'drivers' then
    if not exists(select 1 from public.profiles p where p.id = new.profile_id and p.role = 'driver') then
      raise exception 'A driver membership requires a driver profile.';
    end if;
    if tg_op = 'UPDATE' and (new.group_id <> old.group_id or new.membership_status <> 'approved')
      and exists(select 1 from public.vehicles where assigned_driver_id = old.profile_id) then
      raise exception 'Unassign the driver from their vehicle first.';
    end if;
  elsif tg_table_name = 'vehicles' then
    if new.assigned_driver_id is not null and not exists(
      select 1 from public.drivers d
      join public.terminal_groups tg on tg.group_id = d.group_id and tg.terminal_id = new.terminal_id
      where d.profile_id = new.assigned_driver_id and d.membership_status = 'approved') then
      raise exception 'Assign an approved driver from one of the terminal groups.';
    end if;
  elsif tg_table_name = 'profiles' then
    if new.role <> old.role then
      if new.role <> 'chairperson' and exists(select 1 from public.groups where chairperson_id = old.id) then
        raise exception 'Reassign the chaired group before changing this role.';
      end if;
      if new.role <> 'driver' and exists(select 1 from public.drivers where profile_id = old.id) then
        raise exception 'Remove the driver membership before changing this role.';
      end if;
    end if;
    new.updated_at = now();
  end if;
  return new;
end;
$$;
create trigger validate_terminal_group_link before insert or update or delete on public.terminal_groups for each row execute function public.validate_group_assignments();

create or replace function public.is_assigned_driver(target_vehicle_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vehicles v
    join public.terminals t on t.id = v.terminal_id
    join public.drivers d on d.profile_id = v.assigned_driver_id
    join public.groups g on g.id = d.group_id
    join public.terminal_groups tg on tg.group_id = g.id and tg.terminal_id = t.id
    where v.id = target_vehicle_id and d.profile_id = auth.uid()
      and d.membership_status = 'approved'
      and d.availability = 'on_trip' and v.status in ('on_route', 'delayed')
      and t.is_active and g.is_active);
$$;
create or replace function public.is_public_vehicle(target_vehicle_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vehicles v
    join public.terminals t on t.id = v.terminal_id
    join public.drivers d on d.profile_id = v.assigned_driver_id
    join public.groups g on g.id = d.group_id
    join public.terminal_groups tg on tg.group_id = g.id and tg.terminal_id = t.id
    where v.id = target_vehicle_id and v.status in ('on_route', 'delayed') and t.is_active and g.is_active
      and d.membership_status = 'approved' and d.availability = 'on_trip');
$$;

create or replace view public.public_vehicle_directory with (security_barrier = true) as
select v.id, v.terminal_id, v.body_number, v.vehicle_type, v.status,
  p.display_name as driver_name, p.photo_url as driver_photo_url
from public.vehicles v
join public.terminals t on t.id = v.terminal_id
left join public.drivers d on d.profile_id = v.assigned_driver_id and d.membership_status = 'approved'
left join public.profiles p on p.id = d.profile_id
where t.is_active and v.status <> 'maintenance' and not v.is_sample
  and exists(select 1 from public.terminal_groups tg join public.groups g on g.id = tg.group_id
    where tg.terminal_id = t.id and g.is_active);

create or replace function public.save_terminal_schedule(target_terminal uuid, schedule_entries jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  perform 1 from public.terminals t where t.id = target_terminal for update;
  if not found then
    raise exception 'Terminal not found.';
  end if;
  if not coalesce(public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = target_terminal and tg.group_id = public.chaired_group_id()
  ), false) then
    raise exception 'Only the super admin or an assigned group chairperson can edit terminal hours.' using errcode = '42501';
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

create or replace function public.set_driver_availability(next_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  driver_group uuid;
  assigned_vehicle uuid;
  vehicle_status text;
  current_availability text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if next_status is null or next_status not in ('available', 'on_trip', 'offline') then
    raise exception 'Invalid availability status.';
  end if;

  select d.group_id, d.availability into driver_group, current_availability
  from public.drivers d
  join public.groups g on g.id = d.group_id
  where d.profile_id = auth.uid()
    and d.membership_status = 'approved'
    and g.is_active
  for update of d;
  if not found then
    raise exception 'An approved driver membership in an active group is required.' using errcode = '42501';
  end if;

  if current_availability = 'on_trip' and next_status = 'offline' then
    raise exception 'End the active trip before going offline.';
  end if;

  if next_status = 'on_trip' then
    select v.id, v.status into assigned_vehicle, vehicle_status
    from public.vehicles v
    join public.terminals t on t.id = v.terminal_id
    where v.assigned_driver_id = auth.uid()
      and t.is_active
      and exists(select 1 from public.terminal_groups tg
        join public.groups g on g.id = tg.group_id
        where tg.terminal_id = t.id and tg.group_id = driver_group and g.is_active)
    for update of v;
    if not found then
      raise exception 'An active vehicle assignment is required to start a trip.';
    end if;
    if vehicle_status not in ('idle', 'on_route', 'delayed') then
      raise exception 'This vehicle is offline or under maintenance and cannot start a trip.';
    end if;
  else
    select v.id, v.status into assigned_vehicle, vehicle_status
    from public.vehicles v
    where v.assigned_driver_id = auth.uid()
    for update of v;
  end if;

  update public.drivers set availability = next_status where profile_id = auth.uid();
  if assigned_vehicle is not null then
    update public.vehicles
    set status = case
      when next_status = 'on_trip' then 'on_route'
      when status in ('on_route', 'delayed') then 'idle'
      else status
    end
    where id = assigned_vehicle;
  end if;
end;
$$;

alter table public.terminal_groups enable row level security;

drop policy terminals_public on public.terminals;
create policy terminals_public on public.terminals for select to anon, authenticated
  using (is_active and exists(
    select 1 from public.terminal_groups tg join public.groups g on g.id = tg.group_id
    where tg.terminal_id = terminals.id and g.is_active));
drop policy terminals_staff on public.terminals;
create policy terminals_staff on public.terminals for all to authenticated
  using (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = terminals.id and tg.group_id = public.chaired_group_id()))
  with check (public.is_super_admin() or public.chaired_group_id() is not null);
create policy terminal_groups_public on public.terminal_groups for select to anon, authenticated using (true);
create policy terminal_groups_staff on public.terminal_groups for all to authenticated
  using (public.is_super_admin() or group_id = public.chaired_group_id())
  with check (public.is_super_admin() or group_id = public.chaired_group_id());
drop policy vehicles_staff on public.vehicles;
create policy vehicles_staff on public.vehicles for all to authenticated
  using (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = vehicles.terminal_id and tg.group_id = public.chaired_group_id()))
  with check (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = vehicles.terminal_id and tg.group_id = public.chaired_group_id()));
drop policy terminal_routes_staff on public.terminal_routes;
create policy terminal_routes_staff on public.terminal_routes for all to authenticated
  using (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = terminal_routes.terminal_id and tg.group_id = public.chaired_group_id()))
  with check (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = terminal_routes.terminal_id and tg.group_id = public.chaired_group_id()));
drop policy terminal_schedules_public on public.terminal_schedules;
create policy terminal_schedules_public on public.terminal_schedules
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.terminals t
      join public.terminal_groups tg on tg.terminal_id = t.id
      join public.groups g on g.id = tg.group_id
      where t.id = terminal_schedules.terminal_id and t.is_active and g.is_active
    )
  );
drop policy feedback_read on public.feedback;
create policy feedback_read on public.feedback for select to authenticated using (
  author_id = auth.uid() or public.is_super_admin()
  or exists(select 1 from public.vehicles v join public.terminal_groups tg on tg.terminal_id = v.terminal_id
    where v.id = vehicle_id and tg.group_id = public.chaired_group_id())
  or exists(select 1 from public.drivers d where d.profile_id = driver_id and d.group_id = public.chaired_group_id()));

revoke all on public.terminal_groups from anon, authenticated;
grant select on public.terminal_groups to anon, authenticated;
grant insert, update, delete on public.terminal_groups to authenticated;

create trigger audit_privileged_write after insert or update or delete on public.terminal_groups for each row execute function public.audit_privileged_write();

alter table public.terminals drop column group_id;
