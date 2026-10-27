-- Sample barangay-to-barangay tricycle links inside each municipality.
-- Service model: jeepneys only connect municipality terminals; tricycle (TODA)
-- service moves commuters between neighbouring barangays of one municipality.
-- Links chain each official PSGC barangay to the next listed barangay in the
-- same municipality. Pairings follow the published list order, not surveyed
-- road adjacency — every record stays is_sample and unverified until a local
-- chairperson confirms real stop pairs.
-- https://psa.gov.ph/classification/psgc/citimuni/1704000000

create temp table link_barangays(municipality text, barangay text, idx bigint) on commit drop;
insert into link_barangays(municipality, barangay, idx)
select source.municipality, trim(barangay.value), barangay.idx
from (values
  ('Boac', 'Agot,Agumaymayan,Amoingon,Apitong,Balagasan,Balaring,Balimbing,Balogo,Bangbangalon,Bamban,Bantad,Bantay,Bayuti,Binunga,Boi,Boton,Buliasnin,Bunganay,Maligaya,Caganhao,Canat,Catubugan,Cawit,Daig,Daypay,Duyay,Ihatub,Isok II Pob.,Hinapulan,Laylay,Lupac,Mahinhin,Mainit,Malbog,Malusak,Mansiwat,Mataas Na Bayan,Maybo,Mercado,Murallon,Ogbac,Pawa,Pili,Poctoy,Poras,Puting Buhangin,Puyog,Sabong,San Miguel,Santol,Sawi,Tabi,Tabigue,Tagwak,Tambunan,Tampus,Tanza,Tugos,Tumagabok,Tumapon,Isok I'),
  ('Buenavista', 'Bagacay,Bagtingon,Bicas-bicas,Caigangan,Daykitin,Libas,Malbog,Sihi,Timbo,Tungib-Lipata,Yook,Barangay I,Barangay II,Barangay III,Barangay IV'),
  ('Gasan', 'Antipolo,Bachao Ibaba,Bachao Ilaya,Bacongbacong,Bahi,Bangbang,Banot,Banuyo,Bognuyan,Cabugao,Dawis,Dili,Libtangin,Mahunig,Mangiliol,Masiga,Matandang Gasan,Pangi,Pinggan,Tabionan,Tapuyan,Tiguion,Barangay I,Barangay II,Barangay III'),
  ('Mogpog', 'Anapog-Sibucao,Argao,Balanacan,Banto,Bintakay,Bocboc,Butansapa,Candahon,Capayang,Danao,Dulong Bayan,Gitnang Bayan,Guisian,Hinadharan,Hinanggayon,Ino,Janagdong,Lamesa,Laon,Magapua,Malayak,Malusak,Mampaitan,Mangyan-Mababad,Market Site,Mataas Na Bayan,Mendez,Nangka I,Nangka II,Paye,Pili,Puting Buhangin,Sayao,Silangan,Sumangga,Tarug,Villa Mendez'),
  ('Santa Cruz', 'Alobo,Angas,Aturan,Bagong Silang Pob.,Baguidbirin,Baliis,Balogo,Banahaw Pob.,Bangcuangan,Banogbog,Biga,Botilao,Buyabod,Dating Bayan,Devilla,Dolores,Haguimit,Hupi,Ipil,Jolo,Kaganhao,Kalangkang,Kamandugan,Kasily,Kilo-kilo,Kinyaman,Labo,Lamesa,Landy,Lapu-lapu Pob.,Libjo,Lipa,Lusok,Maharlika Pob.,Makulapnit,Maniwaya,Manlibunan,Masaguisi,Masalukot,Matalaba,Mongpong,Morales,Napo,Pag-Asa Pob.,Pantayin,Polo,Pulong-Parang,Punong,San Antonio,San Isidro,Tagum,Tamayo,Tambangan,Tawiran,Taytay'),
  ('Torrijos', 'Bangwayin,Bayakbakin,Bolo,Bonliw,Buangan,Cabuyo,Cagpo,Dampulan,Kay Duke,Mabuhay,Makawayan,Malibago,Malinao,Maranlig,Marlangga,Matuyatuya,Nangka,Pakaskasan,Payanas,Poblacion,Poctoy,Sibuyao,Suha,Talawan,Tigwi')
) as source(municipality, barangays)
cross join lateral string_to_table(source.barangays, ',') with ordinality as barangay(value, idx);

create temp table link_pairs(municipality text, from_barangay text, to_barangay text, idx bigint) on commit drop;
insert into link_pairs(municipality, from_barangay, to_barangay, idx)
select origin.municipality, origin.barangay, destination.barangay, origin.idx
from link_barangays origin
join link_barangays destination
  on destination.municipality = origin.municipality
 and destination.idx = origin.idx + 1;

-- One tricycle route per neighbouring barangay pair. Deterministic codes keep
-- the seed idempotent; the router already serves both directions.
insert into public.routes(code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample)
select
  'SAMPLE-TRI-LNK-' || replace(upper(pair.municipality), ' ', '-') || '-' || lpad(pair.idx::text, 2, '0'),
  'Sample TODA link: ' || pair.from_barangay || ' – ' || pair.to_barangay || ', ' || pair.municipality,
  pair.from_barangay || ', ' || pair.municipality,
  pair.to_barangay || ', ' || pair.municipality,
  'tricycle', null, null, null, true
from link_pairs pair
on conflict (code) do update set
  name = excluded.name,
  origin_label = excluded.origin_label,
  destination_label = excluded.destination_label,
  mode = excluded.mode,
  fare_min = null,
  fare_max = null,
  estimated_minutes = null
where public.routes.is_sample;

-- Both endpoints are unverified barangay service areas; no pinned coordinates
-- until a chairperson confirms real pickup points.
insert into public.route_stops(route_id, name, locality, sequence)
select route.id, 'Sample TODA service area: ' || pair.from_barangay,
  pair.from_barangay || ', ' || pair.municipality, 1
from link_pairs pair
join public.routes route on route.code = 'SAMPLE-TRI-LNK-'
  || replace(upper(pair.municipality), ' ', '-') || '-' || lpad(pair.idx::text, 2, '0')
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = null, longitude = null;

insert into public.route_stops(route_id, name, locality, sequence)
select route.id, 'Sample TODA service area: ' || pair.to_barangay,
  pair.to_barangay || ', ' || pair.municipality, 2
from link_pairs pair
join public.routes route on route.code = 'SAMPLE-TRI-LNK-'
  || replace(upper(pair.municipality), ' ', '-') || '-' || lpad(pair.idx::text, 2, '0')
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = null, longitude = null;

-- Serve each link from both endpoint barangay terminals (service point and
-- pickup point) plus the municipal TODA hub so commuters can board either way.
create temp table link_terminals(municipality text, barangay text, service_point_id uuid, pickup_point_id uuid) on commit drop;
insert into link_terminals(municipality, barangay, service_point_id, pickup_point_id)
select barangay.municipality, barangay.barangay,
  (substr(service_digest.value, 1, 8) || '-' || substr(service_digest.value, 9, 4) || '-4'
    || substr(service_digest.value, 14, 3) || '-8' || substr(service_digest.value, 18, 3)
    || '-' || substr(service_digest.value, 21, 12))::uuid,
  (substr(pickup_digest.value, 1, 8) || '-' || substr(pickup_digest.value, 9, 4) || '-4'
    || substr(pickup_digest.value, 14, 3) || '-8' || substr(pickup_digest.value, 18, 3)
    || '-' || substr(pickup_digest.value, 21, 12))::uuid
from link_barangays barangay
cross join lateral (select md5('egabay-sample-terminal:toda:' || barangay.municipality || ':' || barangay.barangay) as value) service_digest
cross join lateral (select md5('egabay-sample-terminal:toda-alt:' || barangay.municipality || ':' || barangay.barangay) as value) pickup_digest;

create temp table link_hubs(municipality text, toda_terminal_id uuid) on commit drop;
insert into link_hubs values
  ('Boac', 'b1000000-0000-4000-8000-000000000001'),
  ('Mogpog', 'b1000000-0000-4000-8000-000000000002'),
  ('Gasan', 'b1000000-0000-4000-8000-000000000003'),
  ('Buenavista', 'b1000000-0000-4000-8000-000000000004'),
  ('Torrijos', 'b1000000-0000-4000-8000-000000000005'),
  ('Santa Cruz', 'b1000000-0000-4000-8000-000000000006');

insert into public.terminal_routes(terminal_id, route_id)
select terminal_id, route.id
from link_pairs pair
join public.routes route on route.code = 'SAMPLE-TRI-LNK-'
  || replace(upper(pair.municipality), ' ', '-') || '-' || lpad(pair.idx::text, 2, '0')
  and route.is_sample
cross join lateral (
  select service_point_id as terminal_id from link_terminals
    where municipality = pair.municipality and barangay = pair.from_barangay
  union all
  select pickup_point_id from link_terminals
    where municipality = pair.municipality and barangay = pair.from_barangay
  union all
  select service_point_id from link_terminals
    where municipality = pair.municipality and barangay = pair.to_barangay
  union all
  select pickup_point_id from link_terminals
    where municipality = pair.municipality and barangay = pair.to_barangay
  union all
  select toda_terminal_id from link_hubs where municipality = pair.municipality
) terminal
join public.terminals served on served.id = terminal.terminal_id and served.is_sample
on conflict do nothing;
