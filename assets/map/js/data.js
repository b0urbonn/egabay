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

// Route-details panel always measures from the provincial capital for now.
const selectedOrigin = TOWNS.find((town) => town.name === 'Boac');

// ---------- Points of interest ----------
const POIS = [
  { name: 'Balanacan Port Terminal', lat: 13.5334, lng: 121.8673, note: 'Main ferry gateway · Mogpog', category: 'terminal' },
  { name: 'Cawit Port Terminal',     lat: 13.4316, lng: 121.8326, note: 'RoRo/ferry pier · Boac', category: 'terminal' },
  { name: 'Marinduque Airport',      lat: 13.3607, lng: 121.8257, note: 'Masiga · Gasan', category: 'place' },
  { name: 'Buyabod Port Terminal',   lat: 13.4412, lng: 122.0443, note: 'Ferry pier · Santa Cruz', category: 'terminal' },
  { name: 'Poctoy White Beach',      lat: 13.3033, lng: 122.0938, note: 'Beach · Torrijos', category: 'place' },
];
