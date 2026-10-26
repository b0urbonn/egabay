// Selected road route and the compact route-details card.
// Geometry, distance, and duration come from OSRM (OpenStreetMap road data);
// triggered when a search result or a marker's Directions action is picked.

// ---------- Selected road route (route-details panel) ----------
const routeDetails = document.getElementById('route-details');
const routeTitle = document.getElementById('route-title');
const routeMetrics = document.getElementById('route-metrics');
const routeState = document.getElementById('route-state');
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
    paint: { 'line-color': '#176B4B', 'line-width': 5, 'line-opacity': 1 },
  });
}

function showRoadRoute(origin, destination) {
  const requestId = ++routeRequestId;
  routeTitle.textContent = origin.name + ' to ' + destination.name;
  routeMetrics.hidden = true;
  routeState.textContent = 'Finding the fastest mapped road route…';
  routeDetails.classList.add('open');

  const coordinates = origin.lng + ',' + origin.lat + ';' + destination.lng + ',' + destination.lat;
  const url = 'https://router.project-osrm.org/route/v1/driving/' + coordinates
    + '?overview=full&geometries=geojson&alternatives=false';
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
          el.style.background = i === 0 ? '#C6F06A' : '#176B4B';
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

      routeMetrics.innerHTML = '<div>' + formatRouteDistance(route.distance) + ' <span>road</span></div>'
        + '<div>' + formatRouteDuration(route.duration) + ' <span>drive</span></div>'
        + '<div>' + formatRouteEta(route.duration) + ' <span>ETA</span></div>';
      routeMetrics.hidden = false;
      routeState.textContent = 'Route follows mapped roads; transport service is not verified.';
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
}

document.getElementById('clear-route').addEventListener('click', clearSelectedRoute);

function formatRouteDistance(meters) {
  return meters < 1000 ? Math.round(meters) + ' m' : (meters / 1000).toFixed(1) + ' km';
}

function formatRouteDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? Math.floor(minutes / 60) + ' hr ' + (minutes % 60) + ' min' : minutes + ' min';
}

function formatRouteEta(seconds) {
  return new Date(Date.now() + seconds * 1000)
    .toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}
