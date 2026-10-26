-- Seed data for the public terminal directory rendered on the map.
-- `supabase db reset` applies this automatically; to load it into the hosted
-- project, run it in the SQL editor or `supabase db push --include-seed`.
--
-- Group/terminal rows flagged "OSM" use coordinates from OpenStreetMap
-- features (bus_station/bus_stop/amenity=taxi). The remaining town-center
-- rows are APPROXIMATE placeholders — replace their pins with
-- chairperson-verified locations when available.

insert into public.groups (id, name, kind, municipality) values
  ('f0000000-0000-4000-8000-000000000001', 'Boac Jeepney Operators',       'jeepney', 'Boac'),
  ('f0000000-0000-4000-8000-000000000002', 'Mogpog Transport Group',       'jeepney', 'Mogpog'),
  ('f0000000-0000-4000-8000-000000000003', 'Gasan Tricycle Operators',     'toda',    'Gasan'),
  ('f0000000-0000-4000-8000-000000000004', 'Buenavista Tricycle Operators','toda',    'Buenavista'),
  ('f0000000-0000-4000-8000-000000000005', 'Torrijos Tricycle Operators',  'toda',    'Torrijos'),
  ('f0000000-0000-4000-8000-000000000006', 'Santa Cruz Transport Group',   'toda',    'Santa Cruz')
on conflict (id) do nothing;

insert into public.terminals (id, group_id, name, municipality, barangay, address, latitude, longitude) values
  -- OSM bus_station node 4258037365
  ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
   'Boac Jeepney Terminal', 'Boac', 'Tabi', 'Marinduque Circumferential Road', 13.4489754, 121.8394186),
  -- OSM bus_stop node 5159982022
  ('f1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001',
   'Boac–Balanacan Jeepney Terminal', 'Boac', 'Tabi', 'Magsaysay Drive', 13.4468627, 121.8388047),
  -- OSM bus_station node 1769483762 (named "Mogpog - Boac")
  ('f1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000002',
   'Mogpog–Boac Terminal', 'Mogpog', 'Poblacion', 'Rizal Street', 13.4732093, 121.8603931),
  -- OSM amenity=taxi way 420305960
  ('f1000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000005',
   'Torrijos Tricycle Terminal', 'Torrijos', 'Poblacion', 'Marinduque Circumferential Road', 13.2705682, 122.0417180),
  -- No mapped terminal in OSM yet: town-center placeholders, verify locally.
  ('f1000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000003',
   'Gasan Public Terminal', 'Gasan', 'Poblacion', 'Town center (approximate — needs verification)', 13.3231, 121.8456),
  ('f1000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000004',
   'Buenavista Public Terminal', 'Buenavista', 'Poblacion', 'Town center (approximate — needs verification)', 13.2413, 121.9366),
  ('f1000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000006',
   'Santa Cruz Public Terminal', 'Santa Cruz', 'Poblacion', 'Town center (approximate — needs verification)', 13.4749, 122.0508)
on conflict (id) do nothing;
