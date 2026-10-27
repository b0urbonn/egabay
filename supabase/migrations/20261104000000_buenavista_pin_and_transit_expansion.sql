-- Move the Buenavista sample pin out of the water onto the town proper
-- (C. Nepomuceno St, Poblacion per OpenStreetMap), add a second TODA pickup
-- point per barangay, and expand inter-municipal jeepney services.
-- Everything below stays is_sample until an operator confirms it locally.

update public.terminals
set latitude = 13.2567,
    longitude = 121.9440
where is_sample
  and municipality = 'Buenavista'
  and latitude = 13.2413
  and longitude = 121.9366;

update public.route_stops
set latitude = 13.2567,
    longitude = 121.9440
where latitude = 13.2413
  and longitude = 121.9366;

-- Official barangay list, identical to the barangay transit samples.
create temp table expanded_barangays(municipality text, barangay text) on commit drop;
insert into expanded_barangays(municipality, barangay)
select source.municipality, trim(barangay)
from (values
  ('Boac', 'Agot,Agumaymayan,Amoingon,Apitong,Balagasan,Balaring,Balimbing,Balogo,Bangbangalon,Bamban,Bantad,Bantay,Bayuti,Binunga,Boi,Boton,Buliasnin,Bunganay,Maligaya,Caganhao,Canat,Catubugan,Cawit,Daig,Daypay,Duyay,Ihatub,Isok II Pob.,Hinapulan,Laylay,Lupac,Mahinhin,Mainit,Malbog,Malusak,Mansiwat,Mataas Na Bayan,Maybo,Mercado,Murallon,Ogbac,Pawa,Pili,Poctoy,Poras,Puting Buhangin,Puyog,Sabong,San Miguel,Santol,Sawi,Tabi,Tabigue,Tagwak,Tambunan,Tampus,Tanza,Tugos,Tumagabok,Tumapon,Isok I'),
  ('Buenavista', 'Bagacay,Bagtingon,Bicas-bicas,Caigangan,Daykitin,Libas,Malbog,Sihi,Timbo,Tungib-Lipata,Yook,Barangay I,Barangay II,Barangay III,Barangay IV'),
  ('Gasan', 'Antipolo,Bachao Ibaba,Bachao Ilaya,Bacongbacong,Bahi,Bangbang,Banot,Banuyo,Bognuyan,Cabugao,Dawis,Dili,Libtangin,Mahunig,Mangiliol,Masiga,Matandang Gasan,Pangi,Pinggan,Tabionan,Tapuyan,Tiguion,Barangay I,Barangay II,Barangay III'),
  ('Mogpog', 'Anapog-Sibucao,Argao,Balanacan,Banto,Bintakay,Bocboc,Butansapa,Candahon,Capayang,Danao,Dulong Bayan,Gitnang Bayan,Guisian,Hinadharan,Hinanggayon,Ino,Janagdong,Lamesa,Laon,Magapua,Malayak,Malusak,Mampaitan,Mangyan-Mababad,Market Site,Mataas Na Bayan,Mendez,Nangka I,Nangka II,Paye,Pili,Puting Buhangin,Sayao,Silangan,Sumangga,Tarug,Villa Mendez'),
  ('Santa Cruz', 'Alobo,Angas,Aturan,Bagong Silang Pob.,Baguidbirin,Baliis,Balogo,Banahaw Pob.,Bangcuangan,Banogbog,Biga,Botilao,Buyabod,Dating Bayan,Devilla,Dolores,Haguimit,Hupi,Ipil,Jolo,Kaganhao,Kalangkang,Kamandugan,Kasily,Kilo-kilo,Kinyaman,Labo,Lamesa,Landy,Lapu-lapu Pob.,Libjo,Lipa,Lusok,Maharlika Pob.,Makulapnit,Maniwaya,Manlibunan,Masaguisi,Masalukot,Matalaba,Mongpong,Morales,Napo,Pag-Asa Pob.,Pantayin,Polo,Pulong-Parang,Punong,San Antonio,San Isidro,Tagum,Tamayo,Tambangan,Tawiran,Taytay'),
  ('Torrijos', 'Bangwayin,Bayakbakin,Bolo,Bonliw,Buangan,Cabuyo,Cagpo,Dampulan,Kay Duke,Mabuhay,Makawayan,Malibago,Malinao,Maranlig,Marlangga,Matuyatuya,Nangka,Pakaskasan,Payanas,Poblacion,Poctoy,Sibuyao,Suha,Talawan,Tigwi')
) as source(municipality, barangays)
cross join lateral string_to_table(source.barangays, ',') as barangay;

create temp table municipal_groups(municipality text, jeepney_terminal_id uuid, toda_group_id uuid) on commit drop;
insert into municipal_groups values
  ('Boac', 'b0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('Mogpog', 'b0000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('Gasan', 'b0000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('Buenavista', 'b0000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('Torrijos', 'b0000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005'),
  ('Santa Cruz', 'b0000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000006');

-- Second TODA pickup point per barangay. Exact stand locations stay null until
-- verified; deterministic ids keep the seed idempotent.
create temp table extra_toda_terminals(municipality text, barangay text, terminal_id uuid) on commit drop;
insert into extra_toda_terminals(municipality, barangay, terminal_id)
select barangay.municipality, barangay.barangay,
  (substr(digest.value, 1, 8) || '-' || substr(digest.value, 9, 4) || '-4'
    || substr(digest.value, 14, 3) || '-8' || substr(digest.value, 18, 3)
    || '-' || substr(digest.value, 21, 12))::uuid
from expanded_barangays barangay
cross join lateral (select md5('egabay-sample-terminal:toda-alt:' || barangay.municipality || ':' || barangay.barangay) as value) digest;

insert into public.terminals(id, group_id, name, municipality, barangay, address, latitude, longitude, is_sample)
select terminal.terminal_id, hub_group.id,
  'Sample TODA pickup point: ' || terminal.barangay,
  terminal.municipality, terminal.barangay,
  'Sample service area only; exact boarding point is unverified', null, null, true
from extra_toda_terminals terminal
join municipal_groups groups using (municipality)
join public.groups hub_group on hub_group.id = groups.toda_group_id and hub_group.is_sample
on conflict (id) do nothing;

insert into public.terminal_routes(terminal_id, route_id)
select terminal.terminal_id, route.id
from extra_toda_terminals terminal
join public.routes route on route.code = 'SAMPLE-TRI-'
  || replace(upper(terminal.municipality), ' ', '-') || '-'
  || upper(regexp_replace(terminal.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict do nothing;

-- More inter-municipal jeepney services. Stops sit at the municipal hubs in
-- road order; the router already serves both directions between towns.
insert into public.routes(id, code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample) values
  ('c0000000-0000-4000-8000-000000000009', 'SAMPLE-JEP-BOAC-BUENAVISTA', 'Sample: Boac – Buenavista via Gasan', 'Boac', 'Buenavista', 'jeepney', 60, 80, 80, true),
  ('c0000000-0000-4000-8000-00000000000a', 'SAMPLE-JEP-BOAC-TORRIJOS', 'Sample: Boac – Torrijos via Gasan and Buenavista', 'Boac', 'Torrijos', 'jeepney', 90, 120, 110, true),
  ('c0000000-0000-4000-8000-00000000000b', 'SAMPLE-JEP-GASAN-TORRIJOS', 'Sample: Gasan – Torrijos via Buenavista', 'Gasan', 'Torrijos', 'jeepney', 70, 90, 90, true),
  ('c0000000-0000-4000-8000-00000000000c', 'SAMPLE-JEP-GASAN-STACRUZ', 'Sample: Gasan – Santa Cruz via Boac and Mogpog', 'Gasan', 'Santa Cruz', 'jeepney', 70, 95, 100, true),
  ('c0000000-0000-4000-8000-00000000000d', 'SAMPLE-JEP-MOGPOG-TORRIJOS', 'Sample: Mogpog – Torrijos via Santa Cruz', 'Mogpog', 'Torrijos', 'jeepney', 60, 85, 85, true),
  ('c0000000-0000-4000-8000-00000000000e', 'SAMPLE-JEP-MOGPOG-BUENAVISTA', 'Sample: Mogpog – Buenavista via Boac and Gasan', 'Mogpog', 'Buenavista', 'jeepney', 90, 115, 110, true),
  ('c0000000-0000-4000-8000-00000000000f', 'SAMPLE-JEP-STACRUZ-BUENAVISTA', 'Sample: Santa Cruz – Buenavista via Torrijos', 'Santa Cruz', 'Buenavista', 'jeepney', 75, 95, 100, true),
  ('c0000000-0000-4000-8000-000000000010', 'SAMPLE-JEP-BALANACAN-STACRUZ', 'Sample: Balanacan Port – Santa Cruz via Mogpog', 'Balanacan Port, Mogpog', 'Santa Cruz', 'jeepney', 45, 60, 55, true)
on conflict (id) do nothing;

insert into public.route_stops(route_id, name, locality, sequence, latitude, longitude) values
  ('c0000000-0000-4000-8000-000000000009', 'Boac Public Terminal', 'Boac', 1, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-000000000009', 'Gasan Public Terminal', 'Gasan', 2, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-000000000009', 'Buenavista Public Terminal', 'Buenavista', 3, 13.2567, 121.9440),
  ('c0000000-0000-4000-8000-00000000000a', 'Boac Public Terminal', 'Boac', 1, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-00000000000a', 'Gasan Public Terminal', 'Gasan', 2, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-00000000000a', 'Buenavista Public Terminal', 'Buenavista', 3, 13.2567, 121.9440),
  ('c0000000-0000-4000-8000-00000000000a', 'Torrijos Public Terminal', 'Torrijos', 4, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-00000000000b', 'Gasan Public Terminal', 'Gasan', 1, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-00000000000b', 'Buenavista Public Terminal', 'Buenavista', 2, 13.2567, 121.9440),
  ('c0000000-0000-4000-8000-00000000000b', 'Torrijos Public Terminal', 'Torrijos', 3, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-00000000000c', 'Gasan Public Terminal', 'Gasan', 1, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-00000000000c', 'Boac Public Terminal', 'Boac', 2, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-00000000000c', 'Mogpog Public Terminal', 'Mogpog', 3, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-00000000000c', 'Santa Cruz Public Terminal', 'Santa Cruz', 4, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-00000000000d', 'Mogpog Public Terminal', 'Mogpog', 1, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-00000000000d', 'Santa Cruz Public Terminal', 'Santa Cruz', 2, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-00000000000d', 'Torrijos Public Terminal', 'Torrijos', 3, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-00000000000e', 'Mogpog Public Terminal', 'Mogpog', 1, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-00000000000e', 'Boac Public Terminal', 'Boac', 2, 13.4463, 121.8406),
  ('c0000000-0000-4000-8000-00000000000e', 'Gasan Public Terminal', 'Gasan', 3, 13.3224, 121.8465),
  ('c0000000-0000-4000-8000-00000000000e', 'Buenavista Public Terminal', 'Buenavista', 4, 13.2567, 121.9440),
  ('c0000000-0000-4000-8000-00000000000f', 'Santa Cruz Public Terminal', 'Santa Cruz', 1, 13.4749, 122.0508),
  ('c0000000-0000-4000-8000-00000000000f', 'Torrijos Public Terminal', 'Torrijos', 2, 13.3197, 122.0849),
  ('c0000000-0000-4000-8000-00000000000f', 'Buenavista Public Terminal', 'Buenavista', 3, 13.2567, 121.9440),
  ('c0000000-0000-4000-8000-000000000010', 'Balanacan Port', 'Balanacan Port, Mogpog', 1, 13.5302, 121.8746),
  ('c0000000-0000-4000-8000-000000000010', 'Mogpog Public Terminal', 'Mogpog', 2, 13.4745, 121.8610),
  ('c0000000-0000-4000-8000-000000000010', 'Santa Cruz Public Terminal', 'Santa Cruz', 3, 13.4749, 122.0508)
on conflict (route_id, sequence) do nothing;

insert into public.terminal_routes(terminal_id, route_id) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000009'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000009'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000009'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-00000000000a'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-00000000000a'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-00000000000a'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-00000000000a'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-00000000000b'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-00000000000b'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-00000000000b'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-00000000000c'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-00000000000c'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-00000000000c'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-00000000000c'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-00000000000d'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-00000000000d'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-00000000000d'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-00000000000e'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-00000000000e'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-00000000000e'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-00000000000e'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-00000000000f'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-00000000000f'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-00000000000f'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000010'),
  ('b0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000010')
on conflict do nothing;
