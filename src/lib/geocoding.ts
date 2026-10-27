export type TerminalGeocodeInput = {
  name: string;
  address: string;
  barangay: string;
  municipality: string;
};

export type GeocodedTerminal = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MARINDUQUE_VIEWBOX = '121.62,13.72,122.32,13.05';
const MARINDUQUE_BOUNDS = { west: 121.62, east: 122.32, south: 13.05, north: 13.72 };
let requestQueue = Promise.resolve();
let lastRequestStartedAt = 0;

function fetchNominatim(url: string): Promise<Response> {
  const request = requestQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastRequestStartedAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestStartedAt = Date.now();
    return fetch(url, {
      headers: { Accept: 'application/json' },
      referrerPolicy: 'origin',
    });
  });
  requestQueue = request.then(() => undefined, () => undefined);
  return request;
}

export async function geocodeTerminalAddress(input: TerminalGeocodeInput): Promise<GeocodedTerminal> {
  const query = [input.name, input.address, input.barangay, input.municipality, 'Marinduque', 'Philippines']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ph',
    viewbox: MARINDUQUE_VIEWBOX,
    bounded: '1',
    q: query,
  });

  let response: Response;
  try {
    response = await fetchNominatim(`${NOMINATIM_URL}?${params.toString()}`);
  } catch {
    throw new Error('Address lookup is unavailable. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'Address lookup is busy. Wait a moment and try again.'
      : 'Address lookup failed. Please try again.');
  }

  let results: { lat?: string; lon?: string; display_name?: string }[];
  try {
    results = await response.json() as { lat?: string; lon?: string; display_name?: string }[];
  } catch {
    throw new Error('Address lookup returned an invalid response. Please try again.');
  }
  const result = results[0];
  if (!result) throw new Error('No Marinduque location matched this address. Add a clearer street address or landmark and try again.');

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const bounds = MARINDUQUE_BOUNDS;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < bounds.south || latitude > bounds.north
    || longitude < bounds.west || longitude > bounds.east) {
    throw new Error('The address result is outside the Marinduque coverage area. Refine the address and try again.');
  }

  return { latitude, longitude, displayName: result.display_name ?? query };
}
