// Commute routes and the selected road route.
// Geometry comes from OSRM (OpenStreetMap road data) with a straight-line
// fallback for the commute routes; the selected route uses OSRM steps for
// turn-by-turn in the route-details panel.

// ---------- Commute routes ----------
let routesFC = null;

function applyRouteVisibility() {
  const v = showRoutes ? 'visible' : 'none';
  for (const id of ['routes-casing', 'routes-core']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
  }
}

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

// ---------- Selected road route (route-details panel) ----------
const routeDetails = document.getElementById('route-details');
const routeTitle = document.getElementById('route-title');
const routeMetrics = document.getElementById('route-metrics');
const routeState = document.getElementById('route-state');
const routeInstructions = document.getElementById('route-instructions');
let routeRequestId = 0;
let selectedRouteFC = null;
let routeEndMarkers = [];

// (Re)create the selected-route source/layers; also called on style.load.
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

// ---------- Wiring (needs the map) ----------
if (map) {
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
}
