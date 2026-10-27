// POI markers and the Terminal filter pill (All / Jeepney / Tricycle menu).
// Marker data lives in data.js; directory-fed terminals arrive via terminals.js.
// The pill filters terminal markers by transport kind — it never draws routes.

// Each entry: { marker: maplibregl.Marker, kind: 'jeepney' | 'tricycle' | 'both' | null }.
const terminalMarkers = [];
const otherMarkers = [];
if (map) {
  for (const p of POIS) {
    const el = document.createElement('div');
    el.className = 'poi-dot';
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(
        '<p class="popup-title">' + p.name + '</p><p class="popup-sub">' + p.note + '</p>'
        + '<div class="popup-actions">'
        + '<button class="popup-btn" data-route-to="' + p.name + '">Directions</button>'
        + '<button class="popup-btn popup-btn-quiet" data-route-from="' + p.name + '">Set as start</button>'
        + '</div>'))
      .addTo(map);
    if (p.category === 'terminal') terminalMarkers.push({ marker, kind: p.kind ?? null });
    else otherMarkers.push(marker);
  }
}

// Popup actions: "Directions" routes from the current origin to the tapped
// place; "Set as start" makes the tapped place the new routing origin.
document.addEventListener('click', (e) => {
  const toBtn = e.target.closest('[data-route-to]');
  const fromBtn = e.target.closest('[data-route-from]');
  if (!toBtn && !fromBtn) return;
  const poi = POIS.find((p) => p.name === (toBtn || fromBtn).dataset[toBtn ? 'routeTo' : 'routeFrom']);
  if (!poi) return;
  if (toBtn) showRoadRoute(selectedOrigin, poi);
  else {
    selectedOrigin = poi;
    showToast('Routes will now start from ' + poi.name + '.');
  }
});

// ---------- Terminal-type filter pill ----------
// The "Terminal" pill drops a menu: All (default) shows every marker,
// jeepney/tricycle show only that kind of terminal.
const filterBtn = document.getElementById('terminal-filter-btn');
const filterMenu = document.getElementById('terminal-filter-menu');
const filterLabel = document.getElementById('terminal-filter-label');
const filterOptions = filterMenu ? filterMenu.querySelectorAll('.filter-option') : [];
let activeTransportFilter = 'all';
const filterLabels = { jeepney: 'jeepney terminals', tricycle: 'tricycle terminals' };

function terminalKindMatches(kind, filter) {
  if (filter === 'jeepney') return kind === 'jeepney' || kind === 'both';
  if (filter === 'tricycle') return kind === 'tricycle' || kind === 'both';
  return true;
}

function setFilterMenuOpen(open) {
  if (!filterBtn || !filterMenu) return;
  filterMenu.hidden = !open;
  filterBtn.setAttribute('aria-expanded', String(open));
  filterBtn.classList.toggle('open', open);
}

function applyTransportFilter() {
  if (!map) return;
  const showAll = activeTransportFilter === 'all';
  let shown = 0;
  for (const entry of terminalMarkers) {
    const visible = showAll || terminalKindMatches(entry.kind, activeTransportFilter);
    if (visible) { entry.marker.addTo(map); shown += 1; }
    else entry.marker.remove();
  }
  for (const m of otherMarkers) showAll ? m.addTo(map) : m.remove();
  if (showAll) return;

  clearSelectedRoute();
  const label = filterLabels[activeTransportFilter] ?? 'terminals';
  showToast(shown
    ? 'Showing ' + shown + ' ' + label + '.'
    : 'No ' + label + ' are mapped yet.');
}

if (filterBtn && filterMenu) {
  filterBtn.addEventListener('click', () => {
    setFilterMenuOpen(filterMenu.hidden);
  });
  filterOptions.forEach((option) => {
    option.addEventListener('click', () => {
      activeTransportFilter = option.dataset.filter;
      filterOptions.forEach((o) => o.setAttribute('aria-selected', String(o === option)));
      filterLabel.textContent = activeTransportFilter === 'all' ? 'Terminal' : 'Terminal · ' + option.textContent;
      filterBtn.classList.toggle('active', activeTransportFilter !== 'all');
      setFilterMenuOpen(false);
      applyTransportFilter();
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown')) setFilterMenuOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setFilterMenuOpen(false);
  });
}
