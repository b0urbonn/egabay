// Live terminal markers fed by the host app over postMessage.
// The app reads public.terminals through Supabase and posts
// { type: 'egabay:terminals', terminals: [{ id, name, municipality,
//   barangay, address, latitude, longitude }] }.
// When directory rows arrive they replace the sample transport hubs so the
// map only shows operator-backed terminal locations.

const dbTerminalMarkers = [];

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function terminalNote(t) {
  const where = [t.barangay ? 'Brgy. ' + t.barangay : null, t.municipality, t.address]
    .filter(Boolean).join(' · ');
  return (where || 'Marinduque') + ' · from the eGABAY directory';
}

function applyDbTerminals(terminals) {
  if (!map) return;
  const valid = terminals.filter(
    (t) => typeof t.latitude === 'number' && typeof t.longitude === 'number' && t.name,
  );
  if (!valid.length) return; // keep the sample hubs when the directory is empty

  // Drop sample/directory terminal markers and their POIS entries, then rebuild.
  for (const m of dbTerminalMarkers) m.remove();
  dbTerminalMarkers.length = 0;
  for (let i = terminalMarkers.length - 1; i >= 0; i--) terminalMarkers[i].remove();
  terminalMarkers.length = 0;
  for (let i = POIS.length - 1; i >= 0; i--) {
    if (POIS[i].category === 'terminal') POIS.splice(i, 1);
  }

  for (const t of valid) {
    const poi = {
      name: t.name,
      lat: t.latitude,
      lng: t.longitude,
      note: terminalNote(t),
      category: 'terminal',
    };
    POIS.push(poi);
    const el = document.createElement('div');
    el.className = 'poi-dot terminal-dot';
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([t.longitude, t.latitude])
      .setPopup(new maplibregl.Popup({ offset: 11 }).setHTML(
        '<p class="popup-title">' + esc(t.name) + '</p>'
        + '<p class="popup-sub">' + esc(terminalNote(t)) + '</p>'
        + '<div class="popup-actions">'
        + '<button class="popup-btn" data-route-to="' + esc(t.name) + '">Directions</button>'
        + '<button class="popup-btn popup-btn-quiet" data-route-from="' + esc(t.name) + '">Set as start</button>'
        + '</div>'))
      .addTo(map);
    dbTerminalMarkers.push(marker);
    terminalMarkers.push(marker);
  }
  showToast(valid.length + ' terminal' + (valid.length === 1 ? '' : 's') + ' loaded from the eGABAY directory.');
}

function onHostMessage(event) {
  let msg = event.data;
  if (typeof msg === 'string') {
    try { msg = JSON.parse(msg); } catch { return; }
  }
  if (msg && msg.type === 'egabay:terminals' && Array.isArray(msg.terminals)) {
    applyDbTerminals(msg.terminals);
  }
}

// Android WebViews deliver host messages on `document`, iOS/web on `window`.
window.addEventListener('message', onHostMessage);
document.addEventListener('message', onHostMessage);

// Tell the host the page is ready to receive terminal data.
window.addEventListener('load', () => notifyHost('egabay:ready'));
