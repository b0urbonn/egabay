// Static datasets for the Marinduque map page.
// Coordinates are OpenStreetMap-derived. Replace with live data when available.

// ---------- Towns ----------
const TOWNS = [
  { name: 'Boac',       lat: 13.4463, lng: 121.8406, note: 'Provincial capital' },
  { name: 'Mogpog',     lat: 13.4745, lng: 121.8610, note: 'Northern gateway' },
  { name: 'Gasan',      lat: 13.3224, lng: 121.8465, note: 'West coast' },
  { name: 'Buenavista', lat: 13.2407, lng: 121.9377, note: 'Southern coast' },
  { name: 'Torrijos',   lat: 13.3197, lng: 122.0849, note: 'East coast' },
  { name: 'Santa Cruz', lat: 13.4756, lng: 122.0525, note: 'Northeast' },
];

// Routing origin defaults to the provincial capital. Locate-me and the
// "Set as start" popup action replace it with the chosen point.
let selectedOrigin = TOWNS.find((town) => town.name === 'Boac');

// ---------- Points of interest ----------
const POIS = [
  // Approximate town-center service areas, not verified street-level terminals.
  // kind 'both' = the hub serves jeepney and tricycle; used by the transport
  // filter dropdown in markers.js.
  { name: 'Boac Transport Hub',      lat: 13.4463, lng: 121.8406, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Mogpog Transport Hub',    lat: 13.4745, lng: 121.8610, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Gasan Transport Hub',     lat: 13.3224, lng: 121.8465, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Buenavista Transport Hub',lat: 13.2407, lng: 121.9377, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Torrijos Transport Hub',  lat: 13.3197, lng: 122.0849, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Santa Cruz Transport Hub',lat: 13.4756, lng: 122.0525, note: 'Sample jeepney / tricycle service area · verify pickup point', category: 'terminal', kind: 'both' },
  { name: 'Marinduque Airport',      lat: 13.3607, lng: 121.8257, note: 'Masiga · Gasan', category: 'place' },
  { name: 'Poctoy White Beach',      lat: 13.3033, lng: 122.0938, note: 'Beach · Torrijos', category: 'place' },
];
