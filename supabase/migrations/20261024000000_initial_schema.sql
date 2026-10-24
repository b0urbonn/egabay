-- eGABAY public route data and operator-maintained service information.
-- Confirm route, fare, and service records before production use.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'commuter'
    check (role in ('commuter', 'driver', 'operator', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  origin_label text not null,
  destination_label text not null,
  mode text not null default 'jeepney'
    check (mode in ('jeepney', 'minibus', 'tricycle', 'ferry', 'other')),
  fare_min numeric(8, 2),
  fare_max numeric(8, 2),
  estimated_minutes integer,
  service_days text[] not null default array['daily']::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fare_min is null or fare_min >= 0),
  check (fare_max is null or fare_max >= 0),
  check (fare_min is null or fare_max is null or fare_max >= fare_min),
  check (estimated_minutes is null or estimated_minutes > 0)
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  name text not null,
  locality text not null,
  sequence integer not null check (sequence > 0),
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (route_id, sequence),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  public_label text not null,
  route_id uuid references public.routes(id) on delete set null,
  status text not null default 'idle'
    check (status in ('idle', 'on_route', 'delayed', 'offline', 'maintenance')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_driver_assignments (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  driver_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (driver_user_id)
);

create table if not exists public.vehicle_positions (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  heading smallint check (heading is null or heading between 0 and 359),
  recorded_at timestamptz not null default now()
);

create table if not exists public.service_alerts (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.routes(id) on delete set null,
  title text not null,
  body text not null,
  locality text,
  severity text not null default 'info' check (severity in ('info', 'notice', 'urgent')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists route_stops_route_sequence_idx
  on public.route_stops (route_id, sequence);
create index if not exists vehicles_route_status_idx
  on public.vehicles (route_id, status);
create index if not exists service_alerts_active_idx
  on public.service_alerts (published, starts_at, ends_at);

create or replace function public.is_transport_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('operator', 'admin')
  );
$$;

create or replace function public.is_assigned_driver(target_vehicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.vehicle_driver_assignments as assignment
      on assignment.driver_user_id = profile.id
    join public.vehicles as vehicle
      on vehicle.id = assignment.vehicle_id
    where profile.id = (select auth.uid())
      and profile.role = 'driver'
      and assignment.vehicle_id = target_vehicle_id
      and vehicle.status in ('on_route', 'delayed')
  );
$$;

create or replace function public.create_commuter_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_commuter_profile();

alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_driver_assignments enable row level security;
alter table public.vehicle_positions enable row level security;
alter table public.service_alerts enable row level security;

create policy "users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "public can read active routes"
  on public.routes for select to anon, authenticated
  using (is_active);
create policy "operators can manage routes"
  on public.routes for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());

create policy "public can read stops on active routes"
  on public.route_stops for select to anon, authenticated
  using (exists (
    select 1 from public.routes
    where routes.id = route_stops.route_id and routes.is_active
  ));
create policy "operators can manage route stops"
  on public.route_stops for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());

create policy "public can read vehicle summaries"
  on public.vehicles for select to anon, authenticated
  using (status <> 'maintenance');
create policy "operators can manage vehicles"
  on public.vehicles for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());

create policy "operators can manage vehicle assignments"
  on public.vehicle_driver_assignments for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());

create policy "public can read current vehicle positions"
  on public.vehicle_positions for select to anon, authenticated
  using (exists (
    select 1 from public.vehicles
    where vehicles.id = vehicle_positions.vehicle_id
      and vehicles.status in ('idle', 'on_route', 'delayed')
  ));
create policy "operators can manage vehicle positions"
  on public.vehicle_positions for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());
create policy "assigned drivers can manage their position"
  on public.vehicle_positions for all to authenticated
  using (public.is_assigned_driver(vehicle_id))
  with check (public.is_assigned_driver(vehicle_id));

create policy "public can read current published alerts"
  on public.service_alerts for select to anon, authenticated
  using (
    published
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );
create policy "operators can manage alerts"
  on public.service_alerts for all to authenticated
  using (public.is_transport_operator())
  with check (public.is_transport_operator());

grant select on public.routes, public.route_stops, public.vehicles,
  public.vehicle_positions, public.service_alerts to anon, authenticated;
grant insert, update, delete on public.routes, public.route_stops, public.vehicles,
  public.vehicle_driver_assignments, public.service_alerts to authenticated;
grant select, insert, update, delete on public.vehicle_driver_assignments to authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.vehicle_positions to authenticated;

-- Enable Realtime for live position and service updates after project setup.
alter publication supabase_realtime add table public.vehicle_positions;
alter publication supabase_realtime add table public.service_alerts;
