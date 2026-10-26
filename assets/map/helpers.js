// Small shared utilities. Top-level declarations are visible to the other
// plain scripts loaded after this file.

// ---------- Toast ----------
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---------- Host bridge (React Native WebView / parent iframe) ----------
function notifyHost(msg) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  else if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
}

// ---------- Geometry helpers ----------
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
