// Shared configuration for the Marinduque map page.
// Plain scripts share top-level scope: everything declared here is visible
// to the feature modules loaded after this file (see index.html order).

// Compact UI when loaded with #embed (app card). #full or no hash = full UI.
const EMBEDDED = /#embed/.test(location.hash);
if (EMBEDDED) document.body.classList.add('embedded');

// ---------- Coverage area (Marinduque island province, PH) ----------
// MapLibre uses [lng, lat] ordering everywhere.
const ISLAND_BOUNDS = [[121.74, 13.15], [122.22, 13.63]]; // whole island frame
const HOME_PAD = 0.15;                                   // margin around the island (fraction of the smaller screen side)
const HARD_BOUNDS = [[121.62, 13.05], [122.32, 13.72]];  // panning limit
let provinceBounds = HARD_BOUNDS;

// Pixel margin around the island, scaled to the smaller screen side so the
// whole island shows at a decent size without filling the frame edge to edge.
function homePadding() {
  const el = document.getElementById('map');
  return Math.round(Math.min(el.clientWidth, el.clientHeight) * HOME_PAD);
}

// Sea cover: world polygon; island ring is punched in once the boundary loads.
const WORLD_RING = [[-180, -89], [180, -89], [180, 89], [-180, 89], [-180, -89]];
let seaData = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [WORLD_RING] },
};

// ---------- Base layers ----------
// Render: OpenMapTiles vector tiles by default (VersaTiles free host, no key).
// Fallbacks are raster tiles from OpenStreetMap-family servers.
// MapLibre fetches tiles via fetch(), so every host must return
// Access-Control-Allow-Origin — verified for all entries below.
// Do NOT add tile.memomaps.de: no CORS header, silently renders nothing.
const baseStyles = {
  'General': {
    // OpenMapTiles vector render (VersaTiles "colorful" style) — the bright,
    // labelled general/location look, similar to a standard web map.
    // `sea` matches that style's water-ocean fill (rgb 191 217 242) so the
    // sea mask blends seamlessly at the coastline.
    sea: '#bfd9f2',
    styleUrl: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
  },
  'Transport': {
    sea: '#a4c9d8',
    tiles: [
      'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    ],
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Style: <a href="https://www.cyclosm.org">CyclOSM</a>',
  },
  'Standard': {
    sea: '#aad3df',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  'Dark': {
    sea: '#101216',
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    ],
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  'Satellite': {
    sea: '#123b52',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
};
let activeBase = 'General';

// Raster paint values approximate the old tile filter
// (saturate 1.4, contrast 1.07, hue -8deg, brightness 0.98).
// Vector styles are used as-is; raster entries get this light grade.
function makeStyle(cfg) {
  if (cfg.styleUrl) return cfg.styleUrl;
  return {
    version: 8,
    sources: {
      base: {
        type: 'raster',
        tiles: cfg.tiles,
        tileSize: 256,
        maxzoom: cfg.maxZoom,
        attribution: cfg.attribution,
      },
    },
    layers: [
      {
        id: 'base',
        type: 'raster',
        source: 'base',
        paint: {
          'raster-saturation': 0.4,
          'raster-contrast': 0.07,
          'raster-hue-rotate': -8,
          'raster-brightness-max': 0.98,
        },
      },
    ],
  };
}
