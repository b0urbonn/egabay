-- Seed data for the public terminal directory rendered on the map.
-- `supabase db reset` applies this automatically; to load it into the hosted
-- project, run it in the SQL editor or `supabase db push --include-seed`.
--
-- Group/terminal rows flagged "OSM" use coordinates from OpenStreetMap
-- features (bus_station/bus_stop/amenity=taxi). The remaining town-center
-- rows are APPROXIMATE placeholders — replace their pins with
-- chairperson-verified locations when available.
-- Every record is is_sample: names, stands, and operating hours are
-- unverified placeholders until a local chairperson confirms them.

insert into public.groups (id, name, kind, municipality, is_sample) values
  ('f0000000-0000-4000-8000-000000000001', 'Sample Boac Jeepney Operators',       'jeepney', 'Boac',        true),
  ('f0000000-0000-4000-8000-000000000002', 'Sample Mogpog Jeepney Operators',     'jeepney', 'Mogpog',      true),
  ('f0000000-0000-4000-8000-000000000003', 'Sample Gasan Tricycle Operators',     'toda',    'Gasan',       true),
  ('f0000000-0000-4000-8000-000000000004', 'Sample Buenavista Tricycle Operators','toda',    'Buenavista',  true),
  ('f0000000-0000-4000-8000-000000000005', 'Sample Torrijos Tricycle Operators',  'toda',    'Torrijos',    true),
  ('f0000000-0000-4000-8000-000000000006', 'Sample Santa Cruz Tricycle Operators','toda',    'Santa Cruz',  true),
  ('f0000000-0000-4000-8000-000000000007', 'Sample Boac Tricycle Operators',      'toda',    'Boac',        true),
  ('f0000000-0000-4000-8000-000000000008', 'Sample Gasan Jeepney Operators',      'jeepney', 'Gasan',       true)
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  municipality = excluded.municipality,
  is_sample = excluded.is_sample;

insert into public.terminals (id, group_id, name, municipality, barangay, address, latitude, longitude, is_sample) values
  -- OSM bus_station node 4258037365
  ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
   'Boac Jeepney Terminal (Sample)', 'Boac', 'Tabi', 'OpenStreetMap mapped point; confirm pickup location', 13.4489754, 121.8394186, true),
  -- OSM bus_stop node 5159982022
  ('f1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001',
   'Boac–Balanacan Jeepney Stop (Sample)', 'Boac', 'Tabi', 'OpenStreetMap mapped stop; confirm boarding point', 13.4468627, 121.8388047, true),
  -- Town-center placeholder, verify locally.
  ('f1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000007',
   'Boac Central TODA Stand (Sample)', 'Boac', 'Poblacion', 'Approximate town-center pin; verify with chairperson', 13.4463, 121.8406, true),
  -- OSM bus_station node 1769483762 (named "Mogpog - Boac")
  ('f1000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000002',
   'Mogpog–Boac Terminal (Sample)', 'Mogpog', 'Poblacion', 'OpenStreetMap mapped point; confirm pickup location', 13.4732093, 121.8603931, true),
  -- Town-center placeholders, verify locally.
  ('f1000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000008',
   'Gasan Jeepney Stop (Sample)', 'Gasan', 'Poblacion', 'Approximate town-center pin; verify with chairperson', 13.3224, 121.8465, true),
  ('f1000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000003',
   'Gasan Public Tricycle Stand (Sample)', 'Gasan', 'Poblacion', 'Approximate town-center pin; verify with chairperson', 13.3231, 121.8456, true),
  ('f1000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000004',
   'Buenavista Public Tricycle Stand (Sample)', 'Buenavista', 'Poblacion', 'Approximate town-center pin; verify with chairperson', 13.2567, 121.9440, true),
  -- OSM amenity=taxi way 420305960
  ('f1000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000005',
   'Torrijos Tricycle Terminal (Sample)', 'Torrijos', 'Poblacion', 'OpenStreetMap mapped point; confirm pickup location', 13.2705682, 122.0417180, true),
  -- Town-center placeholder, verify locally.
  ('f1000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000006',
   'Santa Cruz Public Tricycle Stand (Sample)', 'Santa Cruz', 'Poblacion', 'Approximate town-center pin; verify with chairperson', 13.4749, 122.0508, true)
on conflict (id) do update set
  group_id = excluded.group_id,
  name = excluded.name,
  municipality = excluded.municipality,
  barangay = excluded.barangay,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_sample = excluded.is_sample;

-- Sample routes linking the seeded terminals. Stops reuse the town-center
-- points; real path, fares, and travel times are unverified.
insert into public.routes (id, code, name, origin_label, destination_label, mode, is_sample) values
  ('f2000000-0000-4000-8000-000000000001', 'SAMPLE-BOAC-MOGPOG',    'Sample route: Boac–Mogpog jeepney',   'Boac',                 'Mogpog',                 'jeepney',  true),
  ('f2000000-0000-4000-8000-000000000002', 'SAMPLE-BOAC-GASAN',     'Sample route: Boac–Gasan jeepney',    'Boac',                 'Gasan',                  'jeepney',  true),
  ('f2000000-0000-4000-8000-000000000003', 'SAMPLE-BOAC-TODA',      'Sample service area: Boac TODA',      'Boac town center',     'Boac town center',       'tricycle', true),
  ('f2000000-0000-4000-8000-000000000004', 'SAMPLE-TORRIJOS-TODA',  'Sample service area: Torrijos TODA',  'Torrijos town center', 'Torrijos town center',   'tricycle', true)
on conflict (code) do update set
  name = excluded.name,
  origin_label = excluded.origin_label,
  destination_label = excluded.destination_label,
  mode = excluded.mode
where public.routes.is_sample;

insert into public.route_stops (id, route_id, name, locality, sequence, latitude, longitude) values
  ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Boac Town Center (Sample)',     'Boac',     1, 13.4463, 121.8406),
  ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001', 'Mogpog Town Center (Sample)',   'Mogpog',   2, 13.4745, 121.8610),
  ('f3000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000002', 'Boac Town Center (Sample)',     'Boac',     1, 13.4463, 121.8406),
  ('f3000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000002', 'Gasan Town Center (Sample)',    'Gasan',    2, 13.3224, 121.8465),
  ('f3000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000003', 'Boac Town Center (Sample)',     'Boac',     1, 13.4463, 121.8406),
  ('f3000000-0000-4000-8000-000000000006', 'f2000000-0000-4000-8000-000000000004', 'Torrijos Town Center (Sample)', 'Torrijos', 1, 13.3197, 122.0849)
on conflict (route_id, sequence) do update set
  name = excluded.name,
  locality = excluded.locality,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into public.terminal_routes (terminal_id, route_id) values
  ('f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000002'),
  ('f1000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000003'),
  ('f1000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000002'),
  ('f1000000-0000-4000-8000-000000000008', 'f2000000-0000-4000-8000-000000000004')
on conflict do nothing;

-- Sample weekly hours for the seeded terminals (day 0 is Sunday).
-- Existing schedule rows are kept and never overwritten.
insert into public.terminal_schedules (terminal_id, day_of_week, status, opens_at, closes_at, is_sample)
select t.id, week.day_of_week, 'open',
  case when week.day_of_week = 0 then time '06:00' else time '05:00' end,
  case when week.day_of_week = 0 then time '16:00' else time '18:00' end,
  true
from public.terminals t
cross join generate_series(0, 6) as week(day_of_week)
where t.is_sample and t.id::text like 'f1000000-%'
on conflict (terminal_id, day_of_week) do nothing;

-- Offline sample vehicles parked at the seeded terminals; they never appear in
-- the public vehicle directory (it filters is_sample) until an operator
-- verifies and assigns them.
insert into public.vehicles (id, terminal_id, body_number, vehicle_type, status, is_sample) values
  ('f4000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'SAMPLE-001', 'jeepney',  'offline', true),
  ('f4000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000004', 'SAMPLE-002', 'jeepney',  'offline', true),
  ('f4000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'SAMPLE-003', 'tricycle', 'offline', true),
  ('f4000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000008', 'SAMPLE-004', 'tricycle', 'offline', true)
on conflict (id) do nothing;
