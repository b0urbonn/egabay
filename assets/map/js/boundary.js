// Province boundary + sea mask via the free Nominatim API (OpenStreetMap
// data). Everything that is not Marinduque renders as open sea so the island
// reads like land on a game chart, with nothing else on the map.

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

    // Tighten the panning limit and re-frame to the real coastline with the
    // same margin, so the island sits inside the frame at a decent size.
    map.setMaxBounds(padBounds(provinceBounds, 0.12));
    map.fitBounds(provinceBounds, { padding: homePadding() });
  } catch (err) {
    console.warn('Province boundary could not be loaded; using preset bounds.', err);
    revealBasemap();
  }
}

if (map) loadBoundary();
