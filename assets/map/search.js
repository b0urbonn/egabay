// Place search (Nominatim / OpenStreetMap data) restricted to Marinduque,
// plus the locate-me FAB behaviour.

// ---------- Search ----------
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
let locateMarker = null;
let locateCircleFeat = null;

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
