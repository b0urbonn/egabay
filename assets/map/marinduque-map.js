(function () {
'use strict';

// The map engine is vendored under assets/map/vendor/ and inlined into the
// bundled page. If it somehow isn't there, fail visibly instead of showing
// a bare sea-coloured box.
if (typeof maplibregl === 'undefined') {
  const box = document.getElementById('map-error');
  if (box) {
    box.textContent = 'Map engine failed to load — MapLibre GL is unavailable.';
    box.style.display = 'flex';
  }
  return;
}

// Compact UI when loaded with #embed (app card). #full or no hash = full UI.
const EMBEDDED = /#embed/.test(location.hash);
if (EMBEDDED) document.body.classList.add('embedded');

// ---------- Coverage area (Marinduque island province, PH) ----------
// MapLibre uses [lng, lat] ordering everywhere.
const ISLAND_VIEW = [[121.74, 13.15], [122.22, 13.63]]; // initial frame
const HARD_BOUNDS = [[121.62, 13.05], [122.32, 13.72]];   // panning limit

// Sea cover: world polygon; island ring is punched in once the boundary loads.
const WORLD_RING = [[-180, -89], [180, -89], [180, 89], [-180, 89], [-180, -89]];
let seaData = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [WORLD_RING] },
};

// ---------- Base layers (free, no API keys, CORS-enabled), each with its
// water color. MapLibre fetches raster tiles via fetch(), so every host here
// must return Access-Control-Allow-Origin — verified: OSM, CARTO, Esri,
// osm.fr (CyclOSM). Do NOT add tile.memomaps.de: no CORS header, silently
// renders nothing.
const baseStyles = {
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
let activeBase = 'Transport';
let showRoutes = true;

// Raster paint values approximate the old tile filter
// (saturate 1.4, contrast 1.07, hue -8deg, brightness 0.98).
function makeStyle(cfg) {
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
      sea: { type: 'geojson', data: seaData },
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
      {
        id: 'sea',
        type: 'fill',
        source: 'sea',
        paint: { 'fill-color': cfg.sea, 'fill-opacity': 1 },
      },
      {
        // Hairline highlight hides sub-pixel seams between mask and tiles.
        id: 'coastline',
        type: 'line',
        source: 'sea',
        paint: { 'line-color': 'rgba(255,255,255,0.55)', 'line-width': 1 },
      },
    ],
  };
}

const map = new maplibregl.Map({
  container: 'map',
  style: makeStyle(baseStyles[activeBase]),
  bounds: ISLAND_VIEW,
  doubleClickZoom: false, // double-click/tap resets the view instead
  pitchWithRotate: false,
  minZoom: 10,
  maxZoom: 18,
  maxBounds: HARD_BOUNDS,
  attributionControl: { compact: true },
});
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
if (EMBEDDED) map.scrollZoom.disable(); // don't trap page scroll when embedded

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

// ---------- Basemap picker + route toggle ----------
class BasemapControl {
  onAdd() {
    const box = document.createElement('div');
    box.className = 'maplibregl-ctrl basemap-ctrl';
    const btn = document.createElement('button');
    btn.className = 'basemap-btn';
    btn.textContent = '⧉';
    btn.title = 'Map layers';
    const menu = document.createElement('div');
    menu.className = 'basemap-menu';
    for (const name of Object.keys(baseStyles)) {
      const opt = document.createElement('button');
      opt.textContent = name;
      if (name === activeBase) opt.classList.add('active');
      opt.addEventListener('click', () => {
        activeBase = name;
        map.setStyle(makeStyle(baseStyles[name]));
        document.getElementById('map').style.background = baseStyles[name].sea;
        menu.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.textContent === name));
        menu.classList.remove('open');
      });
      menu.appendChild(opt);
    }
    const hr = document.createElement('hr');
    menu.appendChild(hr);
    const routeRow = document.createElement('button');
    routeRow.className = 'toggle-row';
    routeRow.textContent = 'Commute routes';
    routeRow.addEventListener('click', () => {
      showRoutes = !showRoutes;
      applyRouteVisibility();
      routeRow.classList.toggle('active', showRoutes);
    });
    routeRow.classList.toggle('active', showRoutes);
    menu.appendChild(routeRow);
    btn.addEventListener('click', () => menu.classList.toggle('open'));
    box.appendChild(btn);
    box.appendChild(menu);
    this._box = box;
    return box;
  }
  onRemove() { this._box.remove(); }
}
map.addControl(new BasemapControl(), 'top-right');

function applyRouteVisibility() {
  const v = showRoutes ? 'visible' : 'none';
  for (const id of ['routes-casing', 'routes-core']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
  }
}

// ---------- Towns & points of interest ----------
const TOWNS = [
  { name: 'Boac',       lat: 13.4463, lng: 121.8406, note: 'Provincial capital' },
  { name: 'Mogpog',     lat: 13.4745, lng: 121.8610, note: 'Northern gateway' },
  { name: 'Gasan',      lat: 13.3224, lng: 121.8465, note: 'West coast' },
  { name: 'Buenavista', lat: 13.2407, lng: 121.9377, note: 'Southern coast' },
  { name: 'Torrijos',   lat: 13.3197, lng: 122.0849, note: 'East coast' },
  { name: 'Santa Cruz', lat: 13.4756, lng: 122.0525, note: 'Northeast' },
];

const POIS = [
  { name: 'Balanacan Port Terminal', lat: 13.5334, lng: 121.8673, note: 'Main ferry gateway · Mogpog', category: 'terminal' },
  { name: 'Cawit Port Terminal',     lat: 13.4316, lng: 121.8326, note: 'RoRo/ferry pier · Boac', category: 'terminal' },
  { name: 'Marinduque Airport',      lat: 13.3607, lng: 121.8257, note: 'Masiga · Gasan', category: 'place' },
  { name: 'Buyabod Port Terminal',   lat: 13.4412, lng: 122.0443, note: 'Ferry pier · Santa Cruz', category: 'terminal' },
  { name: 'Poctoy White Beach',      lat: 13.3033, lng: 122.0938, note: 'Beach · Torrijos', category: 'place' },
];

const terminalMarkers = [];
const otherMarkers = [];
for (const p of POIS) {
  const el = document.createElement('div');
  el.className = 'poi-dot';
  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([p.lng, p.lat])
    .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(
      '<p class="popup-title">' + p.name + '</p><p class="popup-sub">' + p.note + '</p>'))
    .addTo(map);
  (p.category === 'terminal' ? terminalMarkers : otherMarkers).push(marker);
}

// ---------- Commute routes (OSRM road geometry, straight-line fallback) ----------
const ROUTES = [
  { name: 'Boac → Gasan',       from: [121.8406, 13.4463], to: [121.8465, 13.3224], meta: 'via Tugos · Laylay · Bunganay — 48 min · ₱60–₱75' },
  { name: 'Boac → Santa Cruz',  from: [121.8406, 13.4463], to: [122.0525, 13.4756], meta: 'via Capayang · Bangcuangan — 55 min · ₱70–₱90' },
  { name: 'Boac → Mogpog',      from: [121.8406, 13.4463], to: [121.8610, 13.4745], meta: 'via Isok · Bintakay — 35 min · ₱40–₱55' },
  { name: 'Gasan → Buenavista', from: [121.8465, 13.3224], to: [121.9377, 13.2407], meta: 'via Bahi · Tapuyan — 40 min · ₱50–₱65' },
  { name: 'Boac → Torrijos',    from: [121.8406, 13.4463], to: [122.0849, 13.3197], meta: 'via Cawit · Malbog · Maranlig — 1 hr 30 min · ₱110–₱140' },
];
let routesFC = null;

function drawRoutes() {
  if (!routesFC || map.getSource('routes')) return;
  map.addSource('routes', { type: 'geojson', data: routesFC });
  map.addLayer({
    id: 'routes-casing',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#10543A', 'line-width': 6.5, 'line-opacity': 0.85 },
  });
  map.addLayer({
    id: 'routes-core',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#C6F06A', 'line-width': 3.5, 'line-opacity': 0.95 },
  });
  applyRouteVisibility();
}

async function fetchRouteCoords(r) {
  try {
    const res = await fetch(
      'https://router.project-osrm.org/route/v1/driving/'
      + r.from.join(',') + ';' + r.to.join(',')
      + '?overview=full&geometries=geojson',
      { signal: AbortSignal.timeout(8000) });
    const d = await res.json();
    if (d.routes && d.routes[0] && d.routes[0].geometry) {
      return d.routes[0].geometry.coordinates;
    }
  } catch { /* fall back to the straight line */ }
  return [r.from, r.to];
}

async function loadRoutes() {
  const feats = await Promise.all(ROUTES.map(async (r) => ({
    type: 'Feature',
    properties: { name: r.name, meta: r.meta },
    geometry: { type: 'LineString', coordinates: await fetchRouteCoords(r) },
  })));
  routesFC = { type: 'FeatureCollection', features: feats };
  drawRoutes();
}

// ---------- Transport filters + selected road route ----------
const routeDetails = document.getElementById('route-details');
const routeTitle = document.getElementById('route-title');
const routeMetrics = document.getElementById('route-metrics');
const routeState = document.getElementById('route-state');
const routeInstructions = document.getElementById('route-instructions');
const selectedOrigin = TOWNS.find((town) => town.name === 'Boac');
let routeRequestId = 0;
let selectedRouteFC = null;
let routeEndMarkers = [];
let activeTransportFilter = null;

document.querySelectorAll('.filter-chip').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    activeTransportFilter = activeTransportFilter === filter ? null : filter;
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      const selected = chip.dataset.filter === activeTransportFilter;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });

    const showAll = !activeTransportFilter;
    for (const m of terminalMarkers) (showAll || activeTransportFilter === 'Terminal') ? m.addTo(map) : m.remove();
    for (const m of otherMarkers) showAll ? m.addTo(map) : m.remove();
    if (showAll) return;

    clearSelectedRoute();
    if (activeTransportFilter !== 'Terminal') {
      showToast('No verified ' + activeTransportFilter + ' routes are mapped yet.');
    }
  });
});

function updateRouteInstructions(steps, destinationName) {
  routeInstructions.replaceChildren();
  steps.forEach((step, index) => {
    const maneuver = step.maneuver || {};
    const roadName = step.name || step.ref || '';
    let instruction;
    if (maneuver.type === 'depart') instruction = 'Start' + (roadName ? ' on ' + roadName : ' on the nearest road');
    else if (maneuver.type === 'arrive') instruction = 'Arrive at ' + destinationName;
    else if (maneuver.type === 'turn') instruction = 'Turn ' + (maneuver.modifier || '') + (roadName ? ' onto ' + roadName : '');
    else if (maneuver.type === 'fork') instruction = 'Keep ' + (maneuver.modifier || 'straight') + (roadName ? ' onto ' + roadName : ' at the fork');
    else if (maneuver.type === 'merge') instruction = 'Merge ' + (maneuver.modifier || '') + (roadName ? ' onto ' + roadName : '');
    else if (maneuver.type === 'roundabout' || maneuver.type === 'rotary') instruction = 'Enter the roundabout' + (roadName ? ' toward ' + roadName : '');
    else if (maneuver.type === 'exit roundabout' || maneuver.type === 'exit rotary') instruction = 'Take the roundabout exit' + (roadName ? ' onto ' + roadName : '');
    else if (maneuver.type === 'new name') instruction = 'Continue' + (roadName ? ' onto ' + roadName : ' on the road');
    else instruction = 'Continue' + (roadName ? ' on ' + roadName : ' on the road');

    const row = document.createElement('div');
    row.className = 'route-step';
    const number = document.createElement('span');
    number.className = 'route-step-index';
    number.textContent = String(index + 1);
    const detail = document.createElement('span');
    detail.className = 'route-step-detail';
    detail.textContent = instruction.trim();
    const distance = document.createElement('span');
    distance.className = 'route-step-distance';
    distance.textContent = step.distance > 0 ? formatRouteDistance(step.distance) : '';
    row.append(number, detail, distance);
    routeInstructions.appendChild(row);
  });
}

function formatRouteDistance(meters) {
  return meters < 1000 ? Math.round(meters) + ' m' : (meters / 1000).toFixed(1) + ' km';
}

function formatRouteDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? Math.floor(minutes / 60) + ' hr ' + (minutes % 60) + ' min' : minutes + ' min';
}

// (Re)create the selected-route source/layers. Sources added outside the
// style JSON are dropped by setStyle, so this is also called on style.load.
function drawSelectedRoute() {
  if (!selectedRouteFC) return;
  const src = map.getSource('selected-route');
  if (src) { src.setData(selectedRouteFC); return; }
  map.addSource('selected-route', { type: 'geojson', data: selectedRouteFC });
  map.addLayer({
    id: 'selected-route-casing',
    type: 'line',
    source: 'selected-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#FFFFFF', 'line-width': 9, 'line-opacity': 0.95 },
  });
  map.addLayer({
    id: 'selected-route-core',
    type: 'line',
    source: 'selected-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#E9813F', 'line-width': 5, 'line-opacity': 1 },
  });
}

function showRoadRoute(origin, destination) {
  const requestId = ++routeRequestId;
  routeTitle.textContent = origin.name + ' to ' + destination.name;
  routeMetrics.hidden = true;
  routeInstructions.hidden = true;
  routeState.textContent = 'Finding the fastest mapped road route…';
  routeDetails.classList.add('open');

  const coordinates = origin.lng + ',' + origin.lat + ';' + destination.lng + ',' + destination.lat;
  const url = 'https://router.project-osrm.org/route/v1/driving/' + coordinates
    + '?overview=full&geometries=geojson&steps=true&alternatives=false';
  fetch(url, { signal: AbortSignal.timeout(12000) })
    .then((response) => response.json())
    .then((data) => {
      if (requestId !== routeRequestId) return;
      const route = data.routes && data.routes[0];
      if (data.code !== 'Ok' || !route || !route.geometry || !route.geometry.coordinates.length) {
        routeState.textContent = data.code === 'NoRoute'
          ? 'No drivable road route was found between these town centers.'
          : 'Road routing is unavailable right now. Try again when you are online.';
        return;
      }

      selectedRouteFC = { type: 'Feature', properties: {}, geometry: route.geometry };
      drawSelectedRoute();

      for (const m of routeEndMarkers) m.remove();
      routeEndMarkers = [];
      if (data.waypoints && data.waypoints.length >= 2) {
        const ends = [data.waypoints[0], data.waypoints[data.waypoints.length - 1]];
        for (const [i, wp] of ends.entries()) {
          const el = document.createElement('div');
          el.className = 'route-end-dot';
          el.style.background = i === 0 ? '#176B4B' : '#E9813F';
          routeEndMarkers.push(
            new maplibregl.Marker({ element: el, interactive: false })
              .setLngLat(wp.location)
              .addTo(map));
        }
      }

      const bounds = new maplibregl.LngLatBounds();
      for (const c of route.geometry.coordinates) bounds.extend(c);
      map.fitBounds(bounds, {
        maxZoom: 15,
        duration: 800,
        padding: { top: 190, bottom: 72, left: 18, right: 18 },
      });

      routeMetrics.innerHTML = '<div>' + formatRouteDistance(route.distance) + ' <span>road distance</span></div>'
        + '<div>' + formatRouteDuration(route.duration) + ' <span>driving estimate</span></div>';
      routeMetrics.hidden = false;
      updateRouteInstructions(route.legs && route.legs[0] ? route.legs[0].steps || [] : [], destination.name);
      routeInstructions.hidden = false;
      routeState.textContent = 'Route line follows mapped roads between the selected points.';
    })
    .catch(() => {
      if (requestId !== routeRequestId) return;
      routeState.textContent = 'Road routing is unavailable right now. Try again when you are online.';
    });
}

function clearSelectedRoute() {
  routeRequestId += 1;
  selectedRouteFC = null;
  const src = map.getSource('selected-route');
  if (src) src.setData({ type: 'FeatureCollection', features: [] });
  for (const m of routeEndMarkers) m.remove();
  routeEndMarkers = [];
  routeDetails.classList.remove('open');
  routeMetrics.hidden = true;
  routeInstructions.hidden = true;
}

document.getElementById('clear-route').addEventListener('click', clearSelectedRoute);

// Sources/layers defined outside the style JSON are dropped by setStyle;
// re-add them whenever a style finishes loading.
map.on('style.load', () => {
  const sea = map.getSource('sea');
  if (sea) sea.setData(seaData);
  drawRoutes();
  drawSelectedRoute();
});
loadRoutes();

map.on('click', 'routes-core', (e) => {
  const f = e.features && e.features[0];
  if (!f) return;
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML('<p class="popup-title">' + f.properties.name + '</p><p class="popup-sub">' + f.properties.meta + '</p>')
    .addTo(map);
});
map.on('mouseenter', 'routes-core', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'routes-core', () => { map.getCanvas().style.cursor = ''; });

// ---------- Province boundary + sea mask via free Nominatim API ----------
// Everything that is not Marinduque renders as open sea so the island reads
// like land on a game chart, with nothing else on the map.
let provinceBounds = HARD_BOUNDS;

function boundsFromRings(rings) {
  const b = new maplibregl.LngLatBounds();
  for (const ring of rings) for (const c of ring) b.extend(c);
  return b;
}

// MapLibre's LngLatBounds has no pad() (that was the Leaflet API); grow a
// copy by `ratio` of each axis on every side instead. Accepts LngLatBounds
// or a bounds-like array (provinceBounds falls back to HARD_BOUNDS).
function padBounds(b, ratio) {
  b = maplibregl.LngLatBounds.convert(b);
  const dLng = (b.getEast() - b.getWest()) * ratio;
  const dLat = (b.getNorth() - b.getSouth()) * ratio;
  return new maplibregl.LngLatBounds(
    [b.getWest() - dLng, b.getSouth() - dLat],
    [b.getEast() + dLng, b.getNorth() + dLat],
  );
}

// Reveal the basemap without the mask rather than leaving the sea cover up.
function revealBasemap() {
  seaData = { type: 'FeatureCollection', features: [] };
  const sea = map.getSource('sea');
  if (sea) sea.setData(seaData);
}

async function loadBoundary() {
  const url = 'https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q='
    + encodeURIComponent('Marinduque, Mimaropa, Philippines');
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
    const gj = await res.json();
    const feat = (gj.features || []).find((f) => f.geometry && /Polygon/.test(f.geometry.type));
    if (!feat) { revealBasemap(); return; }

    const geom = feat.geometry;
    const outerRings = geom.type === 'Polygon'
      ? [geom.coordinates[0]]
      : geom.coordinates.map((poly) => poly[0]);

    // Swap the temp cover for a sea sheet with a Marinduque-shaped opening:
    // only the province renders, the rest is water.
    seaData = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...outerRings] },
    };
    const sea = map.getSource('sea');
    if (sea) sea.setData(seaData);

    // "MARINDUQUE" center label.
    provinceBounds = boundsFromRings(outerRings);
    const label = document.createElement('div');
    label.className = 'island-label';
    label.textContent = 'MARINDUQUE';
    new maplibregl.Marker({ element: label, interactive: false })
      .setLngLat(provinceBounds.getCenter())
      .addTo(map);

    map.setMaxBounds(padBounds(provinceBounds, 0.12));
    map.fitBounds(provinceBounds);
  } catch (err) {
    console.warn('Province boundary could not be loaded; using preset bounds.', err);
    revealBasemap();
  }
}
loadBoundary();

// ---------- Expand-to-fullscreen bridge (embedded mode) ----------
function notifyHost(msg) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  else if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
}
if (EMBEDDED) {
  class ExpandControl {
    onAdd() {
      const btn = document.createElement('button');
      btn.className = 'maplibregl-ctrl expand-btn';
      btn.textContent = '⛶';
      btn.title = 'Open fullscreen map';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifyHost('egabay:expand');
      });
      this._btn = btn;
      return btn;
    }
    onRemove() { this._btn.remove(); }
  }
  map.addControl(new ExpandControl(), 'top-right');
}

// ---------- Bottom-right stack: compass chip + locate FAB ----------
class CompassControl {
  onAdd() {
    const chip = document.createElement('div');
    chip.className = 'maplibregl-ctrl compass';
    chip.innerHTML = '<span class="arrow">▲</span>N';
    this._chip = chip;
    return chip;
  }
  onRemove() { this._chip.remove(); }
}
map.addControl(new CompassControl(), 'bottom-right');

class LocateControl {
  onAdd() {
    const btn = document.createElement('button');
    btn.className = 'maplibregl-ctrl locate-fab';
    btn.textContent = '⌖';
    btn.title = 'Locate me';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.add('busy');
      locateMe();
      setTimeout(() => btn.classList.remove('busy'), 2500);
    });
    this._btn = btn;
    return btn;
  }
  onRemove() { this._btn.remove(); }
}
map.addControl(new LocateControl(), 'bottom-right');

// ---------- Double-click / double-tap resets the view ----------
map.on('dblclick', () => {
  map.fitBounds(provinceBounds === HARD_BOUNDS ? ISLAND_VIEW : provinceBounds, { duration: 800 });
});

// ---------- Panel collapse (embedded mode) ----------
const panel = document.getElementById('panel');
const collapseBtn = document.getElementById('collapse-btn');
if (EMBEDDED) panel.classList.add('collapsed');
collapseBtn.addEventListener('click', () => {
  panel.classList.toggle('collapsed');
  collapseBtn.textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
});

// ---------- Search restricted to Marinduque (Nominatim, free) ----------
const searchInput = document.getElementById('search');
const resultsBox = document.getElementById('results');
let debounceTimer;
let searchMarker = null;
let searchPopup = null;

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (q.length < 3) { closeResults(); return; }
  debounceTimer = setTimeout(() => runSearch(q), 350);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = resultsBox.querySelector('button');
    if (first) first.click();
  }
  if (e.key === 'Escape') closeResults();
});

async function runSearch(q) {
  resultsBox.innerHTML = '<div class="hint">Searching…</div>';
  resultsBox.classList.add('open');
  const b = padBounds(provinceBounds, 0.2);
  const viewbox = b.getWest() + ',' + b.getNorth() + ',' + b.getEast() + ',' + b.getSouth();
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=ph'
    + '&bounded=1&viewbox=' + viewbox + '&q=' + encodeURIComponent(q);
  try {
    const res = await fetch(url);
    const places = await res.json();
    if (!places.length) {
      resultsBox.innerHTML = '<div class="hint">No results inside Marinduque.</div>';
      return;
    }
    resultsBox.innerHTML = '';
    for (const place of places) {
      const btn = document.createElement('button');
      btn.textContent = place.display_name.replace(', Marinduque', '').split(',').slice(0, 3).join(',');
      btn.onclick = () => goToPlace(place);
      resultsBox.appendChild(btn);
    }
  } catch {
    resultsBox.innerHTML = '<div class="hint">Search unavailable right now.</div>';
  }
}

function goToPlace(place) {
  const ll = [Number(place.lon), Number(place.lat)];
  if (searchMarker) searchMarker.remove();
  if (searchPopup) searchPopup.remove();
  const el = document.createElement('div');
  el.className = 'search-dot';
  searchMarker = new maplibregl.Marker({ element: el, interactive: false })
    .setLngLat(ll)
    .addTo(map);
  searchPopup = new maplibregl.Popup({ offset: 14 })
    .setLngLat(ll)
    .setHTML(
      '<p class="popup-title">' + place.display_name.split(',')[0] + '</p>'
      + '<p class="popup-sub">' + place.display_name + '</p>')
    .addTo(map);
  map.flyTo({ center: ll, zoom: 15, duration: 900 });
  closeResults();
  showRoadRoute(selectedOrigin, {
    name: place.display_name.split(',')[0],
    lat: ll[1],
    lng: ll[0],
  });
}

function closeResults() { resultsBox.classList.remove('open'); }
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) closeResults();
});

// ---------- Locate me ----------
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

let locateMarker = null;
let locateCircleFeat = null;

function circleRing(lng, lat, radiusMeters) {
  const pts = [];
  const dLng = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const dLat = radiusMeters / 110540;
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    pts.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return pts;
}

function locateMe() {
  if (!navigator.geolocation) {
    showToast('Location unavailable — check browser permission.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const ll = [pos.coords.longitude, pos.coords.latitude];
      if (!padBounds(provinceBounds, 0.2).contains(ll)) {
        showToast('You appear to be outside the Marinduque coverage area.');
        return;
      }
      if (locateMarker) locateMarker.remove();
      const el = document.createElement('div');
      el.className = 'locate-dot';
      locateMarker = new maplibregl.Marker({ element: el, interactive: false })
        .setLngLat(ll)
        .addTo(map);

      locateCircleFeat = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [circleRing(ll[0], ll[1], pos.coords.accuracy || 50)] },
      };
      const src = map.getSource('locate');
      if (src) src.setData(locateCircleFeat);
      else {
        map.addSource('locate', { type: 'geojson', data: locateCircleFeat });
        map.addLayer({
          id: 'locate-accuracy',
          type: 'fill',
          source: 'locate',
          paint: { 'fill-color': '#176B4B', 'fill-opacity': 0.08 },
        });
        map.addLayer({
          id: 'locate-edge',
          type: 'line',
          source: 'locate',
          paint: { 'line-color': '#176B4B', 'line-width': 1 },
        });
      }
      map.flyTo({ center: ll, zoom: 14, duration: 900 });
    },
    () => showToast('Location unavailable — check browser permission.'),
    { enableHighAccuracy: true }
  );
}

// ---------- AI assistant (preview chat, canned replies — no backend) ----------
const assistantButton = document.getElementById('assistant-btn');
const assistantPanel = document.getElementById('assistant-chat-panel');
const assistantClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function openAssistant() {
  assistantPanel.classList.add('open');
  assistantButton.hidden = true;
  assistantButton.setAttribute('aria-expanded', 'true');
  chatInput.focus();
}

function closeAssistant() {
  assistantPanel.classList.remove('open');
  assistantButton.hidden = false;
  assistantButton.setAttribute('aria-expanded', 'false');
  assistantButton.focus();
}

function addChatMessage(text, sender) {
  const row = document.createElement('div');
  row.className = 'chat-row ' + sender;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function getAssistantReply(question) {
  const query = question.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good afternoon)\b/.test(query)) {
    return 'Hello! I can help you think through a Marinduque trip. Ask me about map help, travel tips, or planning a route.';
  }
  if (/trip|route|destination|plan|travel to/.test(query)) {
    return 'Tell me your starting point and destination, and I can help you plan the next step. Map directions are road estimates; they do not include verified jeepney or tricycle schedules.';
  }
  if (/map|search|find|place/.test(query)) {
    return 'Use the search box at the top of the map to find a place in Marinduque. Select a result to see its location and a mapped road route from Boac.';
  }
  if (/tip|safety|prepare|before/.test(query)) {
    return 'Before leaving, confirm current fares and departure times with local operators. Allow extra time for road conditions, and keep a little cash for local rides.';
  }
  if (/terminal|port|ferry/.test(query)) {
    return 'The map includes sample markers for Balanacan, Cawit, and Buyabod port terminals. Please confirm current ferry departures locally before traveling.';
  }
  return 'I’m a preview assistant, so I don’t have live schedules, fares, or vehicle updates yet. Try asking about trip planning, map help, or travel tips.';
}

function sendChatMessage(message) {
  const text = message.trim();
  if (!text) return;
  addChatMessage(text, 'user');
  chatInput.value = '';
  const pendingReply = addChatMessage('One moment…', 'bot');
  setTimeout(() => {
    pendingReply.textContent = getAssistantReply(text);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 320);
}

assistantButton.addEventListener('click', openAssistant);
assistantClose.addEventListener('click', closeAssistant);
chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChatMessage(chatInput.value);
  chatInput.focus();
});
document.querySelectorAll('.quick-reply').forEach((button) => {
  button.addEventListener('click', () => sendChatMessage(button.textContent));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && assistantPanel.classList.contains('open')) closeAssistant();
});
})();
