// MapLibre engine bootstrap: creates the map and all custom controls.
// MapLibre GL owns every interaction (pan/zoom/popups/controls); the base
// render is an OpenMapTiles vector style (or a raster fallback) and all data
// comes from OpenStreetMap APIs + the static datasets in data.js.

// The engine is vendored under vendor/ and inlined into the bundled page.
// If it somehow isn't there, fail visibly instead of a bare sea-coloured box.
var map = null;
if (typeof maplibregl === 'undefined') {
  const box = document.getElementById('map-error');
  if (box) {
    box.textContent = 'Map engine failed to load — MapLibre GL is unavailable.';
    box.style.display = 'flex';
  }
} else {
  document.getElementById('map').style.background = baseStyles[activeBase].sea;

  map = new maplibregl.Map({
    container: 'map',
    style: makeStyle(baseStyles[activeBase]),
    bounds: ISLAND_BOUNDS,
    fitBoundsOptions: { padding: homePadding() },
    doubleClickZoom: false, // double-click/tap resets the view instead
    pitchWithRotate: false,
    // The padded island fit can dip below z10 on small screens — keep the
    // floor under it so the whole island always fits the frame.
    minZoom: 8,
    maxZoom: 18,
    maxBounds: HARD_BOUNDS,
    attributionControl: { compact: true },
  });
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  if (EMBEDDED) map.scrollZoom.disable(); // don't trap page scroll when embedded

  // Fold the attribution to just the "i" button. While sources are still
  // loading the control carries no .compact class, so a later _updateCompact
  // would add -compact-show and expand the credit by itself; pinning
  // .maplibregl-compact makes every future check short-circuit, so only the
  // button's own tap handler can open the credit.
  const attribControl = document.querySelector('.maplibregl-ctrl-attrib');
  if (attribControl) {
    attribControl.classList.add('maplibregl-compact');
    attribControl.classList.remove('maplibregl-compact-show');
  }

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
      btn.addEventListener('click', () => menu.classList.toggle('open'));
      box.appendChild(btn);
      box.appendChild(menu);
      this._box = box;
      return box;
    }
    onRemove() { this._box.remove(); }
  }
  map.addControl(new BasemapControl(), 'top-right');

  // ---------- Expand-to-fullscreen bridge (embedded mode) ----------
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

  // ---------- Overlay sync ----------
  // Sources/layers defined outside the style JSON are dropped by setStyle;
  // re-add them whenever a style finishes loading (including the first).
  let overlayReady = false;
  function ensureOverlay() {
    const sea = map.getSource('sea');
    if (sea) {
      sea.setData(seaData);
      map.setPaintProperty('sea', 'fill-color', baseStyles[activeBase].sea);
      map.setPaintProperty('coastline', 'line-color', baseStyles[activeBase].sea);
    } else {
      map.addSource('sea', { type: 'geojson', data: seaData });
      map.addLayer({
        id: 'sea',
        type: 'fill',
        source: 'sea',
        paint: { 'fill-color': baseStyles[activeBase].sea, 'fill-opacity': 1 },
      });
      map.addLayer({
        // Feathered band in the same sea colour blends the mask edge into
        // the rendered sea — the island stays the only land on screen.
        id: 'coastline',
        type: 'line',
        source: 'sea',
        paint: {
          'line-color': baseStyles[activeBase].sea,
          'line-width': 10,
          'line-blur': 8,
          'line-opacity': 0.6,
        },
      });
    }
    drawSelectedRoute();
  }
  map.on('style.load', () => {
    overlayReady = true;
    ensureOverlay();
  });

  // If the initial (remote vector) style never becomes usable, drop to a
  // raster fallback instead of leaving a blank canvas.
  map.on('error', () => {
    if (!overlayReady && activeBase !== 'Standard') {
      activeBase = 'Standard';
      map.setStyle(makeStyle(baseStyles.Standard));
      document.getElementById('map').style.background = baseStyles.Standard.sea;
    }
  });

  // ---------- Double-click / double-tap resets the view ----------
  map.on('dblclick', () => {
    map.fitBounds(provinceBounds === HARD_BOUNDS ? ISLAND_BOUNDS : provinceBounds, {
      padding: homePadding(),
      duration: 800,
    });
  });

}
