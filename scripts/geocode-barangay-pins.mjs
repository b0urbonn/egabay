// Geocodes every official PSGC barangay through OpenStreetMap Nominatim and
// writes supabase/migrations/20261106000000_barangay_terminal_pins.sql with the
// results baked in, so applying the seed never needs network access.
// Results cache to scripts/generated/barangay-pins.json — re-runs only query
// uncached barangays. Barangays absent from OSM fall back to a deterministic
// offset around the municipal hub (marked approximate in the migration).
// Run: node scripts/geocode-barangay-pins.mjs  (respects the 1 req/s usage policy)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const MUNICIPALITIES = [
  ['Boac', 'Agot,Agumaymayan,Amoingon,Apitong,Balagasan,Balaring,Balimbing,Balogo,Bangbangalon,Bamban,Bantad,Bantay,Bayuti,Binunga,Boi,Boton,Buliasnin,Bunganay,Maligaya,Caganhao,Canat,Catubugan,Cawit,Daig,Daypay,Duyay,Ihatub,Isok II Pob.,Hinapulan,Laylay,Lupac,Mahinhin,Mainit,Malbog,Malusak,Mansiwat,Mataas Na Bayan,Maybo,Mercado,Murallon,Ogbac,Pawa,Pili,Poctoy,Poras,Puting Buhangin,Puyog,Sabong,San Miguel,Santol,Sawi,Tabi,Tabigue,Tagwak,Tambunan,Tampus,Tanza,Tugos,Tumagabok,Tumapon,Isok I'],
  ['Buenavista', 'Bagacay,Bagtingon,Bicas-bicas,Caigangan,Daykitin,Libas,Malbog,Sihi,Timbo,Tungib-Lipata,Yook,Barangay I,Barangay II,Barangay III,Barangay IV'],
  ['Gasan', 'Antipolo,Bachao Ibaba,Bachao Ilaya,Bacongbacong,Bahi,Bangbang,Banot,Banuyo,Bognuyan,Cabugao,Dawis,Dili,Libtangin,Mahunig,Mangiliol,Masiga,Matandang Gasan,Pangi,Pinggan,Tabionan,Tapuyan,Tiguion,Barangay I,Barangay II,Barangay III'],
  ['Mogpog', 'Anapog-Sibucao,Argao,Balanacan,Banto,Bintakay,Bocboc,Butansapa,Candahon,Capayang,Danao,Dulong Bayan,Gitnang Bayan,Guisian,Hinadharan,Hinanggayon,Ino,Janagdong,Lamesa,Laon,Magapua,Malayak,Malusak,Mampaitan,Mangyan-Mababad,Market Site,Mataas Na Bayan,Mendez,Nangka I,Nangka II,Paye,Pili,Puting Buhangin,Sayao,Silangan,Sumangga,Tarug,Villa Mendez'],
  ['Santa Cruz', 'Alobo,Angas,Aturan,Bagong Silang Pob.,Baguidbirin,Baliis,Balogo,Banahaw Pob.,Bangcuangan,Banogbog,Biga,Botilao,Buyabod,Dating Bayan,Devilla,Dolores,Haguimit,Hupi,Ipil,Jolo,Kaganhao,Kalangkang,Kamandugan,Kasily,Kilo-kilo,Kinyaman,Labo,Lamesa,Landy,Lapu-lapu Pob.,Libjo,Lipa,Lusok,Maharlika Pob.,Makulapnit,Maniwaya,Manlibunan,Masaguisi,Masalukot,Matalaba,Mongpong,Morales,Napo,Pag-Asa Pob.,Pantayin,Polo,Pulong-Parang,Punong,San Antonio,San Isidro,Tagum,Tamayo,Tambangan,Tawiran,Taytay'],
  ['Torrijos', 'Bangwayin,Bayakbakin,Bolo,Bonliw,Buangan,Cabuyo,Cagpo,Dampulan,Kay Duke,Mabuhay,Makawayan,Malibago,Malinao,Maranlig,Marlangga,Matuyatuya,Nangka,Pakaskasan,Payanas,Poblacion,Poctoy,Sibuyao,Suha,Talawan,Tigwi'],
];

// Municipal public-transport hubs (same coordinates as the seeded terminals).
const HUBS = {
  Boac: [13.447, 121.8403],
  Buenavista: [13.2567, 121.944],
  Gasan: [13.3228, 121.846],
  Mogpog: [13.4739, 121.8607],
  'Santa Cruz': [13.4749, 122.0508],
  Torrijos: [13.3197, 122.0849],
};

const CACHE_PATH = 'scripts/generated/barangay-pins.json';
const FRAME = { west: 121.62, south: 13.05, east: 122.32, north: 13.72 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'egabay-sample-seed/1.0 (contact: local dev)' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [hit] = await res.json();
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < FRAME.south || lat > FRAME.north || lng < FRAME.west || lng > FRAME.east) return null;
  return { lat: lat.toFixed(5), lng: lng.toFixed(5), label: hit.display_name };
}

// Deterministic 0.3–1.3 km scatter around the town center for unmapped barangays.
function hubFallback(municipality, barangay) {
  const hash = createHash('md5').update(`${municipality}|${barangay}`).digest();
  const angle = (hash.readUInt16BE(0) % 360) * (Math.PI / 180);
  const radius = 0.003 + (hash.readUInt16BE(2) % 100) / 10000;
  const [lat, lng] = HUBS[municipality];
  return {
    lat: (lat + radius * Math.cos(angle)).toFixed(5),
    lng: (lng + (radius * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180)).toFixed(5),
  };
}

const rows = [];
let apiCalls = 0;
for (const [municipality, csv] of MUNICIPALITIES) {
  for (const barangay of csv.split(',')) {
    const name = barangay.trim();
    const key = `${municipality}|${name}`;
    let hit = cache[key];
    if (hit === undefined) {
      const attempts = [
        `${name}, ${municipality}, Marinduque`,
        `${name.replace(/ Pob\.?$/i, '')}, ${municipality}, Marinduque`,
        `Barangay ${name}, ${municipality}, Marinduque`,
      ];
      hit = null;
      for (const attempt of attempts) {
        try { hit = await geocode(attempt); apiCalls += 1; } catch (error) { console.warn(`query failed ${name}: ${error.message}`); }
        await sleep(1100);
        if (hit) break;
      }
      cache[key] = hit ? { lat: hit.lat, lng: hit.lng, source: 'osm' } : null;
    }
    if (hit) {
      rows.push({ municipality, barangay: name, lat: hit.lat, lng: hit.lng, approx: false });
      console.log(`OSM  ${name}, ${municipality} -> ${hit.lat},${hit.lng}`);
    } else {
      const fb = hubFallback(municipality, name);
      rows.push({ municipality, barangay: name, lat: fb.lat, lng: fb.lng, approx: true });
      console.log(`HUB  ${name}, ${municipality} -> ${fb.lat},${fb.lng} (town-center fallback)`);
    }
  }
}
mkdirSync('scripts/generated', { recursive: true });
writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

const approxCount = rows.filter((r) => r.approx).length;
const esc = (v) => v.replaceAll("'", "''");
const values = rows.map((r) => `  ('${esc(r.municipality)}', '${esc(r.barangay)}', ${r.lat}, ${r.lng}, ${r.approx})`).join(',\n');
const sql = `-- Approximate positions for the sample barangay terminals.
-- Generated by scripts/geocode-barangay-pins.mjs: ${rows.length - approxCount}/218
-- barangays mapped via OpenStreetMap Nominatim; ${approxCount} unmapped barangays
-- use a deterministic town-center fallback marked approximate. Positions mark
-- the barangay service AREA, not a surveyed boarding point — records stay
-- is_sample and unverified.

create temp table barangay_pins(municipality text, barangay text, latitude double precision, longitude double precision, approximate boolean) on commit drop;
insert into barangay_pins values
${values};

-- The generated per-barangay TODA terminals get the mapped point; the second
-- pickup point is nudged slightly so both markers can be told apart.
update public.terminals terminal
set latitude = pin.latitude,
    longitude = pin.longitude,
    address = case
      when pin.approximate then 'Approximate town-center position; confirm the exact boarding point'
      else 'OpenStreetMap mapped area; confirm the exact boarding point'
    end
from barangay_pins pin
where terminal.is_sample
  and terminal.municipality = pin.municipality
  and terminal.barangay = pin.barangay
  and terminal.name like 'Sample TODA service point:%';

update public.terminals terminal
set latitude = pin.latitude + 0.0007,
    longitude = pin.longitude + 0.0007,
    address = case
      when pin.approximate then 'Approximate town-center position; confirm the exact boarding point'
      else 'OpenStreetMap mapped area; confirm the exact boarding point'
    end
from barangay_pins pin
where terminal.is_sample
  and terminal.municipality = pin.municipality
  and terminal.barangay = pin.barangay
  and terminal.name like 'Sample TODA pickup point:%';

-- Barangay stops on the sample tricycle routes get the same mapped point so
-- trip previews can place the destination on the island.
update public.route_stops stop
set latitude = pin.latitude,
    longitude = pin.longitude
from barangay_pins pin, public.routes route
where route.id = stop.route_id
  and route.is_sample and route.mode = 'tricycle'
  and stop.locality = pin.barangay || ', ' || pin.municipality
  and stop.latitude is null;
`;

writeFileSync('supabase/migrations/20261106000000_barangay_terminal_pins.sql', sql);
console.log(`\nWrote migration: ${rows.length} pins (${rows.length - approxCount} OSM, ${approxCount} town-center fallback), ${apiCalls} API calls.`);
