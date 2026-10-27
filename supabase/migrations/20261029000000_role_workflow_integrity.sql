-- Keep driver trip state consistent with an active, serviceable vehicle.
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
    join public.groups g on g.id = t.group_id
    where v.assigned_driver_id = auth.uid()
      and t.group_id = driver_group
      and t.is_active
      and g.is_active
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

-- Clients may change driver details directly, but trip state must go through
-- the checked RPC so the vehicle and driver cannot drift out of sync.
revoke update (availability) on public.drivers from authenticated;
revoke all on function public.set_driver_availability(text) from public, anon, authenticated;
grant execute on function public.set_driver_availability(text) to authenticated;

-- Rejected applications can be cleared as part of a super-admin role change.
-- Active or pending memberships must be resolved through the driver review flow.
create or replace function public.set_user_role(target_user uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership text;
begin
  perform pg_advisory_xact_lock(hashtext('egabay.role_changes'));
  if not public.is_super_admin() then
    raise exception 'Super admin access required.' using errcode = '42501';
  end if;
  if next_role is null or next_role not in ('commuter', 'driver', 'chairperson', 'super_admin') then
    raise exception 'Invalid role.';
  end if;
  if exists (
    select 1 from public.profiles
    where id = target_user and role = 'super_admin'
  ) and next_role <> 'super_admin'
    and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'The last super admin cannot be demoted.';
  end if;

  if next_role <> 'driver' then
    select d.membership_status into membership
    from public.drivers d
    where d.profile_id = target_user
    for update;
    if found then
      if membership <> 'rejected' then
        raise exception 'Resolve the pending or approved driver membership before changing this role.';
      end if;
      if exists (select 1 from public.vehicles v where v.assigned_driver_id = target_user) then
        raise exception 'Unassign the driver from their vehicle before changing this role.';
      end if;
      delete from public.drivers where profile_id = target_user;
    end if;
  end if;

  update public.profiles set role = next_role where id = target_user;
  if not found then
    raise exception 'Account not found.';
  end if;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon, authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
