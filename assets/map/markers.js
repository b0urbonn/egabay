// POI markers and the transport filter chips (Jeepney / Tricycle / Terminal).
// Marker data lives in data.js; the chips just show/hide marker groups —
// only the Terminal group has verified points today.

const terminalMarkers = [];
const otherMarkers = [];
if (map) {
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
}

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
