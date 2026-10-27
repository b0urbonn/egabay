-- Driver self-service reads and trip state.
--
-- Drivers cannot read public.vehicles directly (staff-scoped RLS), and the
-- public_vehicle_directory view deliberately omits assignment links. These
-- definer-owned helpers expose only the caller's own records, so the driver
-- workspace can show real membership, group, vehicle, and terminal data
-- without widening table policies.

create function public.my_driver_workspace()
returns table(
  membership_status text,
  availability text,
  license_number text,
  contact_number text,
  group_id uuid,
  group_name text,
  group_kind text,
  group_municipality text,
  group_is_active boolean,
  vehicle_id uuid,
  body_number text,
  vehicle_type text,
  vehicle_status text,
  terminal_id uuid,
  terminal_name text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  return query
  select
    d.membership_status,
    d.availability,
    d.license_number,
    d.contact_number,
    g.id,
    g.name,
    g.kind,
    g.municipality,
    g.is_active,
    v.id,
    v.body_number,
    v.vehicle_type,
    v.status,
    t.id,
    t.name
  from public.drivers d
  join public.groups g on g.id = d.group_id
  left join public.vehicles v on v.assigned_driver_id = d.profile_id
  left join public.terminals t on t.id = v.terminal_id
  where d.profile_id = auth.uid();
end;
$$;

-- Availability changes flow through one checked path so an approved driver's
-- assigned vehicle mirrors the trip state for the public live directory.
create function public.set_driver_availability(next_status text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  assigned uuid;
begin
  if next_status not in ('available', 'on_trip', 'offline') then
    raise exception 'Invalid availability status.';
  end if;
  perform 1 from public.drivers d
    where d.profile_id = auth.uid() and d.membership_status = 'approved' for update;
  if not found then
    raise exception 'An approved driver membership is required.' using errcode = '42501';
  end if;
  update public.drivers set availability = next_status where profile_id = auth.uid();
  select v.id into assigned from public.vehicles v
    where v.assigned_driver_id = auth.uid() limit 1;
  if assigned is not null then
    update public.vehicles set status = case
      when next_status = 'on_trip' then 'on_route'
      when status in ('on_route', 'delayed') then 'idle'
      else status
    end where id = assigned;
  end if;
end;
$$;

revoke all on function public.my_driver_workspace(), public.set_driver_availability(text)
  from public, anon, authenticated;
grant execute on function public.my_driver_workspace(), public.set_driver_availability(text)
  to authenticated;
