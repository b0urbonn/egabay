-- Upgrade the initial catalog to the four-role, group-scoped access model.
-- Apply after 20261024000000_initial_schema.sql. This project is currently empty.

-- Remove the legacy global operator policies before introducing scoped access.
do $$
declare entry record;
begin
  for entry in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename = any(array[
      'profiles', 'routes', 'route_stops', 'vehicles', 'vehicle_driver_assignments',
      'vehicle_positions', 'service_alerts'
    ])
  loop
    execute format('drop policy %I on public.%I', entry.policyname, entry.tablename);
  end loop;
end;
$$;

alter table public.profiles drop constraint profiles_role_check;
update public.profiles set role = case role when 'admin' then 'super_admin' when 'operator' then 'chairperson' else role end;
alter table public.profiles add constraint profiles_role_check check (role in ('commuter', 'driver', 'chairperson', 'super_admin'));
alter table public.profiles add column photo_url text;
alter table public.profiles add column updated_at timestamptz not null default now();

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  kind text not null check (kind in ('toda', 'jeepney')),
  municipality text not null check (municipality in ('Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz')),
  is_active boolean not null default true,
  chairperson_id uuid unique references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.terminals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  name text not null check (length(btrim(name)) > 0),
  municipality text not null check (municipality in ('Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz')),
  barangay text not null,
  address text,
  contact_phone text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create table public.drivers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id),
  license_number text not null check (length(btrim(license_number)) > 0),
  contact_number text not null check (length(btrim(contact_number)) > 0),
  membership_status text not null default 'pending' check (membership_status in ('pending', 'approved', 'rejected')),
  availability text not null default 'offline' check (availability in ('available', 'on_trip', 'offline')),
  created_at timestamptz not null default now()
);

alter table public.vehicles rename column public_label to body_number;
alter table public.vehicles add column terminal_id uuid references public.terminals(id);
alter table public.vehicles add column plate_number text unique;
alter table public.vehicles add column vehicle_type text not null default 'jeepney' check (vehicle_type in ('jeepney', 'tricycle'));
alter table public.vehicles add column assigned_driver_id uuid unique references public.drivers(profile_id) on delete set null;
-- Deliberately fails for an older, populated deployment until its vehicles have
-- real terminal assignments. Never assign existing vehicles to invented hubs.
alter table public.vehicles alter column terminal_id set not null;
create unique index vehicles_terminal_body_number_idx on public.vehicles(terminal_id, body_number);
create index terminals_group_idx on public.terminals(group_id);
create index drivers_group_idx on public.drivers(group_id);

create table public.terminal_routes (
  terminal_id uuid references public.terminals(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  primary key (terminal_id, route_id)
);

alter table public.service_alerts add column group_id uuid references public.groups(id);
alter table public.service_alerts alter column created_by set default auth.uid();
create index service_alerts_group_idx on public.service_alerts(group_id);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(profile_id) on delete set null,
  kind text not null check (kind in ('rating', 'complaint', 'feedback')),
  rating smallint check (rating between 1 and 5),
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  check (kind <> 'rating' or rating is not null)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  detail jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;
create or replace function public.chaired_group_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select g.id from public.groups g join public.profiles p on p.id = g.chairperson_id
  where p.id = auth.uid() and p.role = 'chairperson' and g.is_active;
$$;
create or replace function public.driver_group_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select d.group_id from public.drivers d join public.groups g on g.id = d.group_id
  where d.profile_id = auth.uid() and d.membership_status = 'approved' and g.is_active;
$$;
-- Legacy name retained for the initial catalog; global edits are admin-only.
create or replace function public.is_transport_operator()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin();
$$;
create or replace function public.is_assigned_driver(target_vehicle_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vehicles v
    join public.terminals t on t.id = v.terminal_id
    join public.groups g on g.id = t.group_id
    join public.drivers d on d.profile_id = v.assigned_driver_id
    where v.id = target_vehicle_id and d.profile_id = auth.uid()
      and d.group_id = g.id and d.membership_status = 'approved'
      and d.availability = 'on_trip' and v.status in ('on_route', 'delayed')
      and t.is_active and g.is_active);
$$;
create function public.is_public_vehicle(target_vehicle_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vehicles v
    join public.terminals t on t.id = v.terminal_id join public.groups g on g.id = t.group_id
    join public.drivers d on d.profile_id = v.assigned_driver_id
    where v.id = target_vehicle_id and v.status in ('on_route', 'delayed') and t.is_active and g.is_active
      and d.group_id = g.id and d.membership_status = 'approved' and d.availability = 'on_trip');
$$;

-- Metadata supplies display fields only. A caller-supplied role is ignored.
create or replace function public.create_commuter_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, photo_url, role)
  values(new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', '')),
    nullif(new.raw_user_meta_data->>'avatar_url', ''), 'commuter') on conflict(id) do nothing;
  return new;
end;
$$;
-- Backfill people who signed in before running this migration.
insert into public.profiles(id, display_name, photo_url)
select id, coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'), raw_user_meta_data->>'avatar_url'
from auth.users on conflict(id) do nothing;

create function public.validate_group_assignments()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'groups' then
    if new.chairperson_id is not null and not exists(select 1 from public.profiles p where p.id = new.chairperson_id and p.role = 'chairperson') then
      raise exception 'Assign the chairperson role before assigning this group.';
    end if;
  elsif tg_table_name = 'terminals' then
    if tg_op = 'UPDATE' and new.group_id <> old.group_id and exists(select 1 from public.vehicles where terminal_id = old.id) then
      raise exception 'Move the terminal vehicles before changing its group.';
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
    if new.assigned_driver_id is not null and not exists(select 1 from public.drivers d join public.terminals t on t.id = new.terminal_id
      where d.profile_id = new.assigned_driver_id and d.group_id = t.group_id and d.membership_status = 'approved') then
      raise exception 'Assign an approved driver from the terminal group.';
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
create trigger validate_group_chair before insert or update on public.groups for each row execute function public.validate_group_assignments();
create trigger validate_terminal_group before update on public.terminals for each row execute function public.validate_group_assignments();
create trigger validate_driver_group before insert or update on public.drivers for each row execute function public.validate_group_assignments();
create trigger validate_vehicle_group before insert or update on public.vehicles for each row execute function public.validate_group_assignments();
create trigger validate_profile_role before update on public.profiles for each row execute function public.validate_group_assignments();

-- Roles are updated through a checked RPC, never by writing profile.role in UI.
create function public.set_user_role(target_user uuid, next_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('egabay.role_changes'));
  if not public.is_super_admin() then raise exception 'Super admin access required.' using errcode = '42501'; end if;
  if next_role not in ('commuter', 'driver', 'chairperson', 'super_admin') then raise exception 'Invalid role.'; end if;
  if exists(select 1 from public.profiles where id = target_user and role = 'super_admin') and next_role <> 'super_admin'
    and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'The last super admin cannot be demoted.';
  end if;
  update public.profiles set role = next_role where id = target_user;
  if not found then raise exception 'Account not found.'; end if;
end;
$$;
create function public.admin_user_directory()
returns table(id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then raise exception 'Super admin access required.' using errcode = '42501'; end if;
  return query select p.id, p.display_name, u.email::text, p.role, p.created_at
    from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc;
end;
$$;
create function public.apply_to_group(target_group uuid, license text, contact text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = auth.uid() and role in ('commuter', 'driver') for update;
  if not found then raise exception 'This account cannot apply as a driver.'; end if;
  if not exists(select 1 from public.groups where id = target_group and is_active) then raise exception 'Choose an active group.'; end if;
  if exists(select 1 from public.drivers where profile_id = auth.uid() and membership_status in ('approved', 'pending')) then
    raise exception 'Your current membership or application must be resolved first.';
  end if;
  update public.profiles set role = 'driver' where id = auth.uid();
  insert into public.drivers(profile_id, group_id, license_number, contact_number)
    values(auth.uid(), target_group, btrim(license), btrim(contact))
    on conflict(profile_id) do update set group_id = excluded.group_id, license_number = excluded.license_number,
      contact_number = excluded.contact_number, membership_status = 'pending', availability = 'offline';
end;
$$;
create function public.review_driver_application(target_driver uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_group uuid;
begin
  select group_id into target_group from public.drivers where profile_id = target_driver for update;
  if not found then raise exception 'Driver not found.'; end if;
  if not coalesce(public.is_super_admin() or target_group = public.chaired_group_id(), false) then raise exception 'Group access required.' using errcode = '42501'; end if;
  if decision not in ('approved', 'rejected') then raise exception 'Choose approved or rejected.'; end if;
  if decision = 'rejected' then update public.vehicles set assigned_driver_id = null where assigned_driver_id = target_driver; end if;
  update public.drivers set membership_status = decision, availability = 'offline' where profile_id = target_driver;
end;
$$;

create function public.stamp_alert_author()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and auth.uid() is not null then new.created_by = auth.uid();
  elsif tg_op = 'UPDATE' then new.created_by = old.created_by;
  end if;
  return new;
end;
$$;
create trigger stamp_alert_author before insert or update on public.service_alerts for each row execute function public.stamp_alert_author();

create function public.audit_privileged_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare before_row jsonb; after_row jsonb;
begin
  if auth.uid() is null or exists(select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'chairperson')) then
    if tg_op <> 'INSERT' then before_row = to_jsonb(old); end if;
    if tg_op <> 'DELETE' then after_row = to_jsonb(new); end if;
    insert into public.audit_log(actor_id, action, table_name, record_id, detail)
      values(auth.uid(), tg_op, tg_table_name,
        coalesce(after_row->>'id', before_row->>'id', after_row->>'profile_id', before_row->>'profile_id', after_row->>'terminal_id', before_row->>'terminal_id'),
        jsonb_build_object('before', before_row, 'after', after_row));
  end if;
  return null;
end;
$$;
do $$
declare target text;
begin
  foreach target in array array['profiles','groups','terminals','drivers','vehicles','routes','route_stops','terminal_routes','service_alerts'] loop
    execute format('create trigger audit_privileged_write after insert or update or delete on public.%I for each row execute function public.audit_privileged_write()', target);
  end loop;
end;
$$;

alter table public.groups enable row level security;
alter table public.terminals enable row level security;
alter table public.drivers enable row level security;
alter table public.terminal_routes enable row level security;
alter table public.feedback enable row level security;
alter table public.audit_log enable row level security;

-- Explicit grants: public clients never receive full vehicle/driver records.
revoke all on public.profiles, public.groups, public.terminals, public.drivers, public.vehicles,
  public.vehicle_driver_assignments, public.routes, public.route_stops, public.terminal_routes,
  public.vehicle_positions, public.service_alerts, public.feedback, public.audit_log from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.groups, public.terminals, public.routes, public.route_stops,
  public.terminal_routes, public.vehicle_positions, public.service_alerts to anon, authenticated;
grant select on public.profiles, public.drivers, public.vehicles, public.feedback, public.audit_log to authenticated;
grant update(display_name, photo_url) on public.profiles to authenticated;
grant update(license_number, contact_number, availability) on public.drivers to authenticated;
grant insert, update, delete on public.groups, public.terminals, public.vehicles, public.routes,
  public.route_stops, public.terminal_routes, public.service_alerts to authenticated;
grant insert, update on public.vehicle_positions to authenticated;
grant insert on public.feedback to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_super_admin() or exists(select 1 from public.drivers d where d.profile_id = profiles.id and d.group_id = public.chaired_group_id())
);
create policy profiles_edit_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy groups_public on public.groups for select to anon, authenticated using (is_active);
create policy groups_admin on public.groups for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy groups_own on public.groups for select to authenticated using (chairperson_id = auth.uid() or id = public.driver_group_id());
create policy terminals_public on public.terminals for select to anon, authenticated using (is_active and exists(select 1 from public.groups g where g.id = group_id and g.is_active));
create policy terminals_staff on public.terminals for all to authenticated using (public.is_super_admin() or group_id = public.chaired_group_id()) with check (public.is_super_admin() or group_id = public.chaired_group_id());
create policy drivers_read on public.drivers for select to authenticated using (profile_id = auth.uid() or public.is_super_admin() or group_id = public.chaired_group_id());
create policy drivers_edit_own on public.drivers for update to authenticated using (profile_id = auth.uid() and membership_status = 'approved') with check (profile_id = auth.uid() and membership_status = 'approved');
create policy vehicles_staff on public.vehicles for all to authenticated using (public.is_super_admin() or exists(select 1 from public.terminals t where t.id = terminal_id and t.group_id = public.chaired_group_id())) with check (public.is_super_admin() or exists(select 1 from public.terminals t where t.id = terminal_id and t.group_id = public.chaired_group_id()));
create policy routes_public on public.routes for select to anon, authenticated using (is_active);
create policy routes_admin on public.routes for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy stops_public on public.route_stops for select to anon, authenticated using (exists(select 1 from public.routes r where r.id = route_id and r.is_active));
create policy stops_admin on public.route_stops for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy terminal_routes_public on public.terminal_routes for select to anon, authenticated using (exists(select 1 from public.terminals t where t.id = terminal_id and t.is_active) and exists(select 1 from public.routes r where r.id = route_id and r.is_active));
create policy terminal_routes_staff on public.terminal_routes for all to authenticated using (public.is_super_admin() or exists(select 1 from public.terminals t where t.id = terminal_id and t.group_id = public.chaired_group_id())) with check (public.is_super_admin() or exists(select 1 from public.terminals t where t.id = terminal_id and t.group_id = public.chaired_group_id()));
create policy positions_public on public.vehicle_positions for select to anon, authenticated using (public.is_public_vehicle(vehicle_id));
create policy positions_staff on public.vehicle_positions for all to authenticated using (public.is_super_admin() or public.is_assigned_driver(vehicle_id)) with check (public.is_super_admin() or public.is_assigned_driver(vehicle_id));
create policy alerts_public on public.service_alerts for select to anon, authenticated using (group_id is null and published and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy alerts_group_read on public.service_alerts for select to authenticated using (public.is_super_admin() or group_id = public.chaired_group_id() or (group_id = public.driver_group_id() and published and starts_at <= now() and (ends_at is null or ends_at > now())));
create policy alerts_staff on public.service_alerts for all to authenticated using (public.is_super_admin() or group_id = public.chaired_group_id()) with check (public.is_super_admin() or group_id = public.chaired_group_id());
create policy feedback_submit on public.feedback for insert to authenticated with check (author_id = auth.uid() and (vehicle_id is not null or driver_id is not null));
create policy feedback_read on public.feedback for select to authenticated using (author_id = auth.uid() or public.is_super_admin() or exists(select 1 from public.vehicles v join public.terminals t on t.id = v.terminal_id where v.id = vehicle_id and t.group_id = public.chaired_group_id()) or exists(select 1 from public.drivers d where d.profile_id = driver_id and d.group_id = public.chaired_group_id()));
create policy audit_admin on public.audit_log for select to authenticated using (public.is_super_admin());

-- A narrow, definer-owned view intentionally bypasses table RLS, but only
-- returns the approved public columns for active groups and terminals.
create view public.public_vehicle_directory with (security_barrier = true) as
select v.id, v.terminal_id, v.body_number, v.vehicle_type, v.status,
  p.display_name as driver_name, p.photo_url as driver_photo_url
from public.vehicles v join public.terminals t on t.id = v.terminal_id
join public.groups g on g.id = t.group_id
left join public.drivers d on d.profile_id = v.assigned_driver_id and d.membership_status = 'approved'
left join public.profiles p on p.id = d.profile_id
where t.is_active and g.is_active and v.status <> 'maintenance';
revoke all on public.public_vehicle_directory from public, anon, authenticated;
grant select on public.public_vehicle_directory to anon, authenticated;

revoke all on function public.is_super_admin(), public.chaired_group_id(), public.driver_group_id(),
  public.is_transport_operator(), public.is_assigned_driver(uuid), public.is_public_vehicle(uuid),
  public.create_commuter_profile(), public.validate_group_assignments(), public.audit_privileged_write(), public.stamp_alert_author(),
  public.set_user_role(uuid,text), public.admin_user_directory(), public.apply_to_group(uuid,text,text),
  public.review_driver_application(uuid,text) from public, anon, authenticated;
grant execute on function public.is_super_admin(), public.chaired_group_id(), public.driver_group_id(),
  public.is_transport_operator(), public.is_assigned_driver(uuid), public.set_user_role(uuid,text),
  public.admin_user_directory(), public.apply_to_group(uuid,text,text), public.review_driver_application(uuid,text) to authenticated;
grant execute on function public.is_public_vehicle(uuid) to anon, authenticated;
