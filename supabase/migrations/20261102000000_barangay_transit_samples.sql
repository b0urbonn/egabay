-- Adds sample jeepney and TODA service coverage for Marinduque barangays.
-- Barangay names follow PSA PSGC pages; transport service, fares, hours, and
-- barangay pickup points below are examples only and need local verification.
-- https://psa.gov.ph/classification/psgc/citimuni/1704000000

create temp table sample_barangays(municipality text, barangay text) on commit drop;
insert into sample_barangays(municipality, barangay)
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

create temp table sample_municipal_hubs(
  municipality text,
  latitude double precision,
  longitude double precision,
  jeepney_terminal_id uuid,
  toda_terminal_id uuid,
  jeepney_group_id uuid,
  toda_group_id uuid
) on commit drop;
insert into sample_municipal_hubs values
  ('Boac', 13.4463, 121.8406, 'b0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('Mogpog', 13.4745, 121.8610, 'b0000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('Gasan', 13.3224, 121.8465, 'b0000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('Buenavista', 13.2413, 121.9366, 'b0000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('Torrijos', 13.3197, 122.0849, 'b0000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005'),
  ('Santa Cruz', 13.4749, 122.0508, 'b0000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000006');

insert into public.groups(id, name, kind, municipality, is_sample) values
  ('a1000000-0000-4000-8000-000000000001', 'Sample Boac TODA Group', 'toda', 'Boac', true),
  ('a1000000-0000-4000-8000-000000000002', 'Sample Mogpog TODA Group', 'toda', 'Mogpog', true),
  ('a1000000-0000-4000-8000-000000000003', 'Sample Gasan TODA Group', 'toda', 'Gasan', true),
  ('a1000000-0000-4000-8000-000000000004', 'Sample Buenavista TODA Group', 'toda', 'Buenavista', true),
  ('a1000000-0000-4000-8000-000000000005', 'Sample Torrijos TODA Group', 'toda', 'Torrijos', true),
  ('a1000000-0000-4000-8000-000000000006', 'Sample Santa Cruz TODA Group', 'toda', 'Santa Cruz', true)
on conflict (id) do nothing;

insert into public.terminals(id, group_id, name, municipality, barangay, address, latitude, longitude, is_sample)
select hubs.toda_terminal_id, groups.id, hubs.municipality || ' TODA Service Hub (Sample)',
  hubs.municipality, 'Unverified town center', 'Approximate town-center service area; exact TODA stand is unverified', null, null, true
from sample_municipal_hubs hubs
join public.groups groups on groups.id = hubs.toda_group_id and groups.is_sample
on conflict (id) do nothing;

create temp table sample_barangay_terminals(kind text, municipality text, barangay text, terminal_id uuid) on commit drop;
insert into sample_barangay_terminals(kind, municipality, barangay, terminal_id)
select item.kind, item.municipality, item.barangay,
  (substr(digest.value, 1, 8) || '-' || substr(digest.value, 9, 4) || '-4'
    || substr(digest.value, 14, 3) || '-8' || substr(digest.value, 18, 3)
    || '-' || substr(digest.value, 21, 12))::uuid
from (
  select 'jeepney'::text as kind, barangay.municipality, barangay.barangay
  from sample_barangays barangay
  union all
  select 'toda'::text as kind, barangay.municipality, barangay.barangay
  from sample_barangays barangay
) item
cross join lateral (select md5('egabay-sample-terminal:' || item.kind || ':' || item.municipality || ':' || item.barangay) as value) digest;

insert into public.terminals(id, group_id, name, municipality, barangay, address, latitude, longitude, is_sample)
select terminal.terminal_id,
  case terminal.kind when 'jeepney' then hubs.jeepney_group_id else hubs.toda_group_id end,
  'Sample ' || terminal.kind || ' service point: ' || terminal.barangay,
  terminal.municipality, terminal.barangay,
  'Sample service area only; exact boarding point is unverified', null, null, true
from sample_barangay_terminals terminal
join sample_municipal_hubs hubs using (municipality)
on conflict (id) do nothing;

-- Hide only obsolete sample TODA rows from the earlier barangay list.
update public.routes route
set is_active = false
where route.is_sample
  and route.code like 'SAMPLE-TRI-%'
  and not exists (
    select 1 from sample_barangays barangay
    where route.code = 'SAMPLE-TRI-' || replace(upper(barangay.municipality), ' ', '-')
      || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  );

-- Each official barangay gets a separately labelled sample TODA route.
insert into public.routes(code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample)
select
  'SAMPLE-TRI-' || replace(upper(barangay.municipality), ' ', '-') || '-'
    || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g')),
  'Sample TODA route: ' || barangay.municipality || ' Poblacion – ' || barangay.barangay,
  barangay.municipality || ' Poblacion',
  barangay.barangay || ', ' || barangay.municipality,
  'tricycle', null, null, null, true
from sample_barangays barangay
on conflict (code) do update set
  name = excluded.name,
  origin_label = excluded.origin_label,
  destination_label = excluded.destination_label,
  mode = excluded.mode,
  fare_min = null,
  fare_max = null,
  estimated_minutes = null
where public.routes.is_sample;

-- Each official barangay also gets a separately labelled sample jeepney route.
insert into public.routes(code, name, origin_label, destination_label, mode, fare_min, fare_max, estimated_minutes, is_sample)
select
  'SAMPLE-JEP-BRG-' || replace(upper(barangay.municipality), ' ', '-') || '-'
    || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g')),
  'Sample jeepney route: ' || barangay.municipality || ' Poblacion – ' || barangay.barangay,
  barangay.municipality || ' Poblacion',
  barangay.barangay || ', ' || barangay.municipality,
  'jeepney', null, null, null, true
from sample_barangays barangay
on conflict (code) do update set
  name = excluded.name,
  origin_label = excluded.origin_label,
  destination_label = excluded.destination_label,
  mode = excluded.mode,
  fare_min = null,
  fare_max = null,
  estimated_minutes = null
where public.routes.is_sample;

-- Route stops use the municipality name for the boarding node and the full
-- barangay name for the destination. Only approximate town-center pins exist.
insert into public.route_stops(route_id, name, locality, sequence, latitude, longitude)
select route.id, hubs.municipality || ' TODA hub (sample)', hubs.municipality, 1, hubs.latitude, hubs.longitude
from sample_barangays barangay
join sample_municipal_hubs hubs using (municipality)
join public.routes route on route.code = 'SAMPLE-TRI-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = excluded.latitude, longitude = excluded.longitude;

insert into public.route_stops(route_id, name, locality, sequence)
select route.id, 'Sample TODA service area: ' || barangay.barangay,
  barangay.barangay || ', ' || barangay.municipality, 2
from sample_barangays barangay
join public.routes route on route.code = 'SAMPLE-TRI-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = null, longitude = null;

insert into public.route_stops(route_id, name, locality, sequence, latitude, longitude)
select route.id, hubs.municipality || ' jeepney hub (sample)', hubs.municipality, 1, hubs.latitude, hubs.longitude
from sample_barangays barangay
join sample_municipal_hubs hubs using (municipality)
join public.routes route on route.code = 'SAMPLE-JEP-BRG-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = excluded.latitude, longitude = excluded.longitude;

insert into public.route_stops(route_id, name, locality, sequence)
select route.id, 'Sample jeepney stop: ' || barangay.barangay,
  barangay.barangay || ', ' || barangay.municipality, 2
from sample_barangays barangay
join public.routes route on route.code = 'SAMPLE-JEP-BRG-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict (route_id, sequence) do update set
  name = excluded.name, locality = excluded.locality,
  latitude = null, longitude = null;

insert into public.terminal_routes(terminal_id, route_id)
select hubs.toda_terminal_id, route.id
from sample_barangays barangay
join sample_municipal_hubs hubs using (municipality)
join public.routes route on route.code = 'SAMPLE-TRI-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict do nothing;

insert into public.terminal_routes(terminal_id, route_id)
select hubs.jeepney_terminal_id, route.id
from sample_barangays barangay
join sample_municipal_hubs hubs using (municipality)
join public.routes route on route.code = 'SAMPLE-JEP-BRG-' || replace(upper(barangay.municipality), ' ', '-')
  || '-' || upper(regexp_replace(barangay.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  and route.is_sample
on conflict do nothing;

insert into public.terminal_routes(terminal_id, route_id)
select terminal.terminal_id, route.id
from sample_barangay_terminals terminal
join public.routes route on route.code = case terminal.kind
  when 'toda' then 'SAMPLE-TRI-'
    || replace(upper(terminal.municipality), ' ', '-') || '-'
    || upper(regexp_replace(terminal.barangay, '[^A-Za-z0-9]+', '-', 'g'))
  else 'SAMPLE-JEP-BRG-'
    || replace(upper(terminal.municipality), ' ', '-') || '-'
    || upper(regexp_replace(terminal.barangay, '[^A-Za-z0-9]+', '-', 'g'))
end and route.is_sample
on conflict do nothing;
