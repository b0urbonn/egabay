import barangayPins from '../../scripts/generated/barangay-pins.json';

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
  // True when the pin is a centroid (barangay/municipality or local directory
  // pin) rather than a street-level address match.
  approximate: boolean;
  matchedLevel: 'address' | 'barangay' | 'municipality' | 'directory';
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

type NominatimHit = { lat?: string; lon?: string; display_name?: string };

// One bounded Nominatim lookup; returns null when nothing inside Marinduque
// matches. Throws only when the service itself is unreachable or rate-limited.
async function searchNominatim(parts: string[]): Promise<NominatimHit | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ph',
    viewbox: MARINDUQUE_VIEWBOX,
    bounded: '1',
    q: parts.map((part) => part.trim()).filter(Boolean).join(', '),
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

  let results: NominatimHit[];
  try {
    results = await response.json() as NominatimHit[];
  } catch {
    throw new Error('Address lookup returned an invalid response. Please try again.');
  }
  const hit = results[0];
  if (!hit) return null;
  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  const bounds = MARINDUQUE_BOUNDS;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < bounds.south || latitude > bounds.north
    || longitude < bounds.west || longitude > bounds.east) return null;
  return hit;
}

const pinLookup = new Map(
  Object.entries(barangayPins).map(([key, pin]) => [key.toLowerCase(), pin]),
);

function localBarangayPin(input: TerminalGeocodeInput): GeocodedTerminal | null {
  const pin = pinLookup.get(`${input.municipality.trim().toLowerCase()}|${input.barangay.trim().toLowerCase()}`);
  if (!pin) return null;
  return {
    latitude: pin.lat,
    longitude: pin.lng,
    displayName: `Approximate ${input.barangay.trim()}, ${input.municipality.trim()} barangay pin`,
    approximate: true,
    matchedLevel: 'directory',
  };
}

// Resolves the terminal location with progressively looser queries: street
// address, then barangay, then municipality, and finally the locally cached
// barangay pin so a save never depends on OpenStreetMap coverage alone.
// The terminal name is deliberately excluded — Nominatim cannot match
// invented record names and including it returns empty result sets.
export async function geocodeTerminalAddress(input: TerminalGeocodeInput): Promise<GeocodedTerminal> {
  const town = [input.municipality, 'Marinduque', 'Philippines'];
  const attempts: { parts: string[]; level: GeocodedTerminal['matchedLevel']; approximate: boolean }[] = [
    { parts: [input.address, input.barangay, ...town], level: 'address', approximate: false },
    { parts: [input.barangay, ...town], level: 'barangay', approximate: true },
    { parts: town, level: 'municipality', approximate: true },
  ];
  let lookupError: Error | null = null;
  for (const attempt of attempts) {
    if (!attempt.parts[0].trim()) continue; // skip empty leading terms
    try {
      const hit = await searchNominatim(attempt.parts);
      if (hit) {
        return {
          latitude: Number(hit.lat),
          longitude: Number(hit.lon),
          displayName: hit.display_name ?? attempt.parts.join(', '),
          approximate: attempt.approximate,
          matchedLevel: attempt.level,
        };
      }
    } catch (cause) {
      // Service-level failure (offline, rate-limited, bad response): stop
      // querying and let the local directory pin cover the save if it can.
      lookupError ??= cause instanceof Error ? cause : new Error('Address lookup failed.');
      break;
    }
  }

  const pin = localBarangayPin(input);
  if (pin) return pin;
  throw lookupError ?? new Error('No Marinduque location matched this barangay. Check the barangay spelling against the official list and try again.');
}
