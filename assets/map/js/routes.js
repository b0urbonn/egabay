// Selected road route and the route-details panel.
// Geometry and turn-by-turn come from OSRM (OpenStreetMap road data);
// triggered when a search result is picked (see search.js).

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
