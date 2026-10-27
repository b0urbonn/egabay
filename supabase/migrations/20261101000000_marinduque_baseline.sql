-- Sample map coverage for the six Marinduque municipalities.
-- No operator has confirmed these group names, terminal pins, route paths,
-- fares, or hours. Keep every record marked is_sample until verified locally.
-- This migration is additive and idempotent; it never removes operator data.

-- Municipal transport cooperatives that own each town's single public terminal.
insert into public.groups(id, name, kind, municipality, is_sample) values
  ('a0000000-0000-4000-8000-000000000001', 'Sample Boac Transport Group', 'jeepney', 'Boac', true),
  ('a0000000-0000-4000-8000-000000000002', 'Sample Mogpog Transport Group', 'jeepney', 'Mogpog', true),
  ('a0000000-0000-4000-8000-000000000003', 'Sample Gasan Transport Group', 'jeepney', 'Gasan', true),
  ('a0000000-0000-4000-8000-000000000004', 'Sample Buenavista Transport Group', 'jeepney', 'Buenavista', true),
  ('a0000000-0000-4000-8000-000000000005', 'Sample Torrijos Transport Group', 'jeepney', 'Torrijos', true),
  ('a0000000-0000-4000-8000-000000000006', 'Sample Santa Cruz Transport Group', 'jeepney', 'Santa Cruz', true)
on conflict do nothing;

insert into public.terminals(id, group_id, name, municipality, barangay, address, latitude, longitude, is_sample) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Boac Public Terminal (Sample)', 'Boac', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.4463, 121.8406, true),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Mogpog Public Terminal (Sample)', 'Mogpog', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.4745, 121.8610, true),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'Gasan Public Terminal (Sample)', 'Gasan', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.3224, 121.8465, true),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'Buenavista Public Terminal (Sample)', 'Buenavista', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.2413, 121.9366, true),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 'Torrijos Public Terminal (Sample)', 'Torrijos', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.3197, 122.0849, true),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', 'Santa Cruz Public Terminal (Sample)', 'Santa Cruz', 'Poblacion', 'Approximate town center; confirm with the local chairperson', 13.4749, 122.0508, true)
on conflict (id) do nothing;

-- Jeepney services along the provincial loop plus the Balanacan port run.
insert into public.routes(id, code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample) values
  ('c0000000-0000-4000-8000-000000000001', 'SAMPLE-JEP-BOAC-MOGPOG', 'Sample: Boac – Mogpog', 'Boac', 'Mogpog', 'jeepney', 20, 30, 30, true),
  ('c0000000-0000-4000-8000-000000000002', 'SAMPLE-JEP-MOGPOG-STACRUZ', 'Sample: Mogpog – Santa Cruz', 'Mogpog', 'Santa Cruz', 'jeepney', 40, 55, 45, true),
  ('c0000000-0000-4000-8000-000000000003', 'SAMPLE-JEP-STACRUZ-TORRIJOS', 'Sample: Santa Cruz – Torrijos', 'Santa Cruz', 'Torrijos', 'jeepney', 45, 60, 60, true),
  ('c0000000-0000-4000-8000-000000000004', 'SAMPLE-JEP-TORRIJOS-BUENAVISTA', 'Sample: Torrijos – Buenavista', 'Torrijos', 'Buenavista', 'jeepney', 40, 55, 55, true),
  ('c0000000-0000-4000-8000-000000000005', 'SAMPLE-JEP-BUENAVISTA-GASAN', 'Sample: Buenavista – Gasan', 'Buenavista', 'Gasan', 'jeepney', 35, 45, 45, true),
  ('c0000000-0000-4000-8000-000000000006', 'SAMPLE-JEP-GASAN-BOAC', 'Sample: Gasan – Boac', 'Gasan', 'Boac', 'jeepney', 30, 40, 40, true),
  ('c0000000-0000-4000-8000-000000000007', 'SAMPLE-JEP-BOAC-STACRUZ', 'Sample: Boac – Santa Cruz via Mogpog', 'Boac', 'Santa Cruz', 'jeepney', 60, 80, 75, true),
  ('c0000000-0000-4000-8000-000000000008', 'SAMPLE-JEP-BOAC-BALANACAN', 'Sample: Boac – Balanacan Port', 'Boac', 'Balanacan Port, Mogpog', 'jeepney', 25, 35, 35, true)
on conflict (id) do nothing;

insert into public.route_stops(route_id, name, locality, sequence, latitude, longitude) values
  ('c0000000-0000-4000-8000-000000000001', 'Boac Public Terminal', 'Boac', 1, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-000000000001', 'Mogpog Public Terminal', 'Mogpog', 2, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-000000000002', 'Mogpog Public Terminal', 'Mogpog', 1, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-000000000002', 'Santa Cruz Public Terminal', 'Santa Cruz', 2, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-000000000003', 'Santa Cruz Public Terminal', 'Santa Cruz', 1, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-000000000003', 'Torrijos Public Terminal', 'Torrijos', 2, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-000000000004', 'Torrijos Public Terminal', 'Torrijos', 1, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-000000000004', 'Buenavista Public Terminal', 'Buenavista', 2, 13.2413, 121.9366),
  ('c0000000-0000-4000-8000-000000000005', 'Buenavista Public Terminal', 'Buenavista', 1, 13.2413, 121.9366),
  ('c0000000-0000-4000-8000-000000000005', 'Gasan Public Terminal', 'Gasan', 2, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-000000000006', 'Gasan Public Terminal', 'Gasan', 1, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-000000000006', 'Boac Public Terminal', 'Boac', 2, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-000000000007', 'Boac Public Terminal', 'Boac', 1, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-000000000007', 'Mogpog Public Terminal', 'Mogpog', 2, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-000000000007', 'Santa Cruz Public Terminal', 'Santa Cruz', 3, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-000000000008', 'Boac Public Terminal', 'Boac', 1, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-000000000008', 'Balanacan Port, Mogpog', 'Mogpog', 2, 13.5302, 121.8746)
on conflict (route_id, sequence) do nothing;

insert into public.terminal_routes(terminal_id, route_id) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000008'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008')
on conflict do nothing;

-- Tricycle service routes from each town center to its barangays.
create temp table baseline_barangays(municipality text, barangay text) on commit drop;
insert into baseline_barangays(municipality, barangay)
select source.municipality, trim(barangay)
from (values
  ('Boac', 'Agot,Agumaymayan,Amoingon,Apitong,Balagasan,Balaring,Balimbing,Baliogo,Bamban,Bangbangalon,Bantad,Bantay,Bayuti,Binunga,Boi,Boton,Buliasnin,Bunganay,Caganhao,Canat,Catubugan,Cawit,Daig,Daypay,Duyay,Hinapulan,Ihatub,Isok I,Isok II,Laylay,Lupac,Mahinhin,Mainit,Malbog,Maligaya,Malusak,Mansiwat,Mataas na Bayan,Maybo,Mercado,Murallon,Ogbac,Pawa,Pili,Poctoy,Poras,Puting Buhangin,Puyog,Sabong,San Miguel,Santol,Sawi,Tabi,Tabigue,Tagwak,Tambunan,Tampus,Tanza,Tugos,Tumagabok,Tumapon'),
  ('Mogpog', 'Anapog-Sibucao,Argao,Balanacan,Banto,Bintakay,Bocboc,Butansapa,Candahon,Capayang,Danao,Dulong Bayan,Gitnang Bayan,Guisian,Hinadharan,Hinanggayon,Ino,Janagdong,Lamesa,Laon,Magapua,Malayak,Malusak,Mampaitan,Mangyan-Mababad,Market Site,Mataas na Bayan,Mendez,Nangka I,Nangka II,Paye,Pili,Puting Buhangin,Sayao,Silangan,Sumangga,Tarug,Villa Mendez'),
  ('Gasan', 'Antipolo,Bachao Ibaba,Bachao Ilaya,Bacong-Bacong,Bahi,Bangbang,Banot,Banuyo,Barangay I,Barangay II,Barangay III,Bognuyan,Cabugao,Dawis,Dili,Libtangin,Mahunig,Mangiliol,Masiga,Matandang Gasan,Pangi,Pinggan,Tabionan,Tapuyan,Tiguion,Valenzuela,Yusay'),
  ('Buenavista', 'Bagacay,Bagtingon,Barangay I,Barangay II,Barangay III,Barangay IV,Bicas-bicas,Caigangan,Daykitin,Libas,Malbog,Sihi,Timbo,Tungib-Lipata,Yook'),
  ('Santa Cruz', 'Alobo,Angas,Baguidbirin,Baliis,Bantad,Biga,Bitin,Botilao,Buyabod,Dating Bayan,Devilla,Dolores,Haguimit,Hupi,Ipil,Jolo,Kaganhao,Kalangkang,Kamandugan,Kasily,Kilo-Kilo,Kinaman,Labo,Lamesa,Landy,Lapu-Lapu,Libjo,Lipa,Lobong,Mahinhin,Makulapnit,Maniwaya,Masaduk,Matalaba,Mongpong,Morales,Napo,Pag-Asa,Pantayin,Polo,Punong,San Antonio,San Isidro,Tagum,Tamayo,Tambangan,Tawiran,Taytay,Tumalab,Tumapon'),
  ('Torrijos', 'Bangwayin,Bayakbakin,Bolo,Bonliw,Buangan,Cabuyo,Cagpo,Dampulan,Kay Duke,Mabuhay,Makawayan,Malibago,Malinao,Maranlig,Matalaba,Mongpong,Morales,Pakaskasan,Payanas,Poblacion,Poctoy,Sibuyao,Suha,Talawan,Tigwi')
) as source(municipality, csv)
cross join lateral string_to_table(source.csv, ',') as barangay;

insert into public.routes(code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample)
select
  'SAMPLE-TRI-' || replace(upper(b.municipality), ' ', '-') || '-' || upper(regexp_replace(b.barangay, '[^A-Za-z0-9]+', '-', 'g')),
  'Sample service: Poblacion – ' || b.barangay,
  b.municipality || ' Poblacion',
  b.barangay || ', ' || b.municipality,
  'tricycle',
  20,
  80,
  null,
  true
from baseline_barangays b
on conflict (code) do nothing;

insert into public.route_stops(route_id, name, locality, sequence, latitude, longitude)
select r.id, b.municipality || ' Public Terminal', b.municipality, 1, t.latitude, t.longitude
from baseline_barangays b
join public.terminals t on t.municipality = b.municipality and t.id::text like 'b0000000-%'
join public.routes r on r.code = 'SAMPLE-TRI-' || replace(upper(b.municipality), ' ', '-') || '-' || upper(regexp_replace(b.barangay, '[^A-Za-z0-9]+', '-', 'g'))
on conflict (route_id, sequence) do nothing;

insert into public.route_stops(route_id, name, locality, sequence)
select r.id, b.barangay, b.municipality, 2
from baseline_barangays b
join public.routes r on r.code = 'SAMPLE-TRI-' || replace(upper(b.municipality), ' ', '-') || '-' || upper(regexp_replace(b.barangay, '[^A-Za-z0-9]+', '-', 'g'))
on conflict (route_id, sequence) do nothing;

insert into public.terminal_routes(terminal_id, route_id)
select t.id, r.id
from baseline_barangays b
join public.terminals t on t.municipality = b.municipality and t.id::text like 'b0000000-%'
join public.routes r on r.code = 'SAMPLE-TRI-' || replace(upper(b.municipality), ' ', '-') || '-' || upper(regexp_replace(b.barangay, '[^A-Za-z0-9]+', '-', 'g'))
on conflict do nothing;

-- Sample weekly hours. Existing schedule rows are kept and never overwritten.
insert into public.terminal_schedules(terminal_id, day_of_week, status, opens_at, closes_at, is_sample)
select t.id, week.day_of_week, 'open',
  case when week.day_of_week = 0 then time '06:00' else time '05:00' end,
  case when week.day_of_week = 0 then time '16:00' else time '18:00' end,
  true
from public.terminals t
cross join generate_series(0, 6) as week(day_of_week)
where t.is_sample
on conflict (terminal_id, day_of_week) do nothing;
