import { supabase } from './supabase';
import { readDirectoryCache, writeDirectoryCache } from './directoryCache';
import { normalizeWeeklySchedule, type TerminalScheduleEntry, type TerminalScheduleRow } from './terminalSchedule';

// Public transport directory reads. Every query relies on the anon-safe RLS
// policies (`*_public`) plus the definer-owned public_vehicle_directory view,
// so guests and signed-in commuters see the same published records.

export type PublicRoute = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  mode: string;
  fareMin: number | null;
  fareMax: number | null;
  minutes: number | null;
  isSample: boolean;
};

export type PublicRouteStop = {
  routeId: string;
  name: string;
  locality: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
};

export type PublicTerminal = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  address: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  groupId: string;
  groupName: string | null;
  groupKind: string | null;
  isSample: boolean;
  schedules: TerminalScheduleEntry[];
  routeIds: string[];
};

export type LiveVehicle = {
  id: string;
  bodyNumber: string;
  vehicleType: string;
  status: 'on_route' | 'delayed';
  driverName: string | null;
  terminalId: string | null;
  terminalName: string | null;
};

export type ServiceNotice = {
  id: string;
  title: string;
  body: string;
  locality: string | null;
  severity: string;
  startsAt: string;
};

function nullableNumber(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function isPublicRoute(value: unknown): value is PublicRoute {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.name === 'string'
    && typeof row.origin === 'string' && typeof row.destination === 'string'
    && typeof row.mode === 'string' && typeof row.isSample === 'boolean'
    && nullableNumber(row.fareMin) && nullableNumber(row.fareMax) && nullableNumber(row.minutes);
}

function isPublicTerminal(value: unknown): value is PublicTerminal {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.name === 'string'
    && typeof row.municipality === 'string' && typeof row.barangay === 'string'
    && typeof row.groupId === 'string' && typeof row.isSample === 'boolean'
    && nullableString(row.address) && nullableString(row.contactPhone)
    && nullableString(row.groupName) && nullableString(row.groupKind)
    && nullableNumber(row.latitude) && nullableNumber(row.longitude)
    && Array.isArray(row.routeIds) && row.routeIds.every((id) => typeof id === 'string')
    && Array.isArray(row.schedules) && row.schedules.every(isScheduleEntry);
}

function isScheduleEntry(value: unknown): value is TerminalScheduleEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.dayOfWeek === 'number' && row.dayOfWeek >= 0 && row.dayOfWeek <= 6
    && ['open', 'closed', 'unpublished'].includes(String(row.status))
    && nullableString(row.opensAt) && nullableString(row.closesAt)
    && typeof row.isSample === 'boolean';
}

function isPublicRouteStop(value: unknown): value is PublicRouteStop {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.routeId === 'string' && typeof row.name === 'string'
    && typeof row.locality === 'string' && typeof row.sequence === 'number'
    && Number.isInteger(row.sequence)
    && row.sequence > 0 && nullableNumber(row.latitude) && nullableNumber(row.longitude);
}

export function fareLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Fare to be confirmed';
  if (min != null && max != null) return min === max ? `₱${min}` : `₱${min}–₱${max}`;
  return `₱${min ?? max}`;
}

export function durationLabel(minutes: number | null): string {
  if (minutes == null) return 'Travel time to be confirmed';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function shortLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function fetchPublicRoutes(): Promise<PublicRoute[]> {
  const cached = readDirectoryCache('routes', (value): value is PublicRoute[] =>
    Array.isArray(value) && value.every(isPublicRoute));
  if (!supabase) return cached ?? [];
  const { data, error } = await supabase
    .from('routes')
    .select('id,name,origin_label,destination_label,mode,fare_min,fare_max,estimated_minutes,is_sample')
    .eq('is_active', true)
    .order('name');
  if (error) {
    console.warn('[directory] routes fetch failed:', error.message);
    return cached ?? [];
  }
  const routes = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    origin: row.origin_label,
    destination: row.destination_label,
    mode: row.mode,
    fareMin: row.fare_min,
    fareMax: row.fare_max,
    minutes: row.estimated_minutes,
    isSample: row.is_sample,
  }));
  writeDirectoryCache('routes', routes);
  return routes;
}

type TerminalRouteLink = { terminal_id: string; route_id: string };

// PostgREST caps each response (1000 rows by default); terminal_routes already
// exceeds that with the barangay sample links, so read it in pages.
async function fetchTerminalRouteLinks(): Promise<{ links: TerminalRouteLink[] | null; error: string | null }> {
  if (!supabase) return { links: null, error: 'Supabase is not configured' };
  const pageSize = 1000;
  const links: TerminalRouteLink[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('terminal_routes')
      .select('terminal_id,route_id')
      .range(from, from + pageSize - 1);
    if (error) return { links: null, error: error.message };
    links.push(...(data ?? []));
    if (!data || data.length < pageSize) return { links, error: null };
  }
}

export async function fetchTerminalDirectory(): Promise<PublicTerminal[]> {
  const cached = readDirectoryCache('terminals', (value): value is PublicTerminal[] =>
    Array.isArray(value) && value.every(isPublicTerminal));
  if (!supabase) return cached ?? [];
  const [terminals, links] = await Promise.all([
    supabase
      .from('terminals')
      .select('id,name,municipality,barangay,address,contact_phone,latitude,longitude,group_id,is_sample,groups(name,kind),terminal_schedules(day_of_week,status,opens_at,closes_at,is_sample)')
      .eq('is_active', true)
      .order('municipality')
      .order('name'),
    fetchTerminalRouteLinks(),
  ]);
  if (terminals.error) {
    console.warn('[directory] terminals fetch failed:', terminals.error.message);
    return cached ?? [];
  }
  if (links.error) {
    console.warn('[directory] terminal routes fetch failed:', links.error);
    return cached ?? [];
  }
  const routeIds = new Map<string, string[]>();
  for (const link of links.links ?? []) {
    const list = routeIds.get(link.terminal_id) ?? [];
    list.push(link.route_id);
    routeIds.set(link.terminal_id, list);
  }
  type TerminalRow = {
    id: string; name: string; municipality: string; barangay: string;
    address: string | null; contact_phone: string | null;
    latitude: number | null; longitude: number | null; group_id: string;
    is_sample: boolean;
    groups: { name: string; kind: string } | { name: string; kind: string }[] | null;
    terminal_schedules: TerminalScheduleRow[];
  };
  const result = (terminals.data ?? []).map((row: TerminalRow) => {
    const group = Array.isArray(row.groups) ? row.groups[0] : row.groups;
    return {
      id: row.id,
      name: row.name,
      municipality: row.municipality,
      barangay: row.barangay,
      address: row.address,
      contactPhone: row.contact_phone,
      latitude: row.latitude,
      longitude: row.longitude,
      groupId: row.group_id,
      groupName: group?.name ?? null,
      groupKind: group?.kind ?? null,
      isSample: row.is_sample,
      schedules: normalizeWeeklySchedule(row.terminal_schedules ?? []),
      routeIds: routeIds.get(row.id) ?? [],
    };
  });
  writeDirectoryCache('terminals', result);
  return result;
}

export async function fetchPublicRouteStops(routeIds: string[]): Promise<PublicRouteStop[]> {
  const cached = readDirectoryCache('route-stops', (value): value is PublicRouteStop[] =>
    Array.isArray(value) && value.every(isPublicRouteStop));
  if (!supabase) return cached ?? [];
  if (routeIds.length === 0) return cached ?? [];
  const { data, error } = await supabase
    .from('route_stops')
    .select('route_id,name,locality,sequence,latitude,longitude')
    .in('route_id', routeIds)
    .order('sequence');
  if (error) {
    console.warn('[directory] route stops fetch failed:', error.message);
    return cached ?? [];
  }
  const stops = (data ?? []).map((row) => ({
    routeId: row.route_id,
    name: row.name,
    locality: row.locality,
    sequence: row.sequence,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
  writeDirectoryCache('route-stops', stops);
  return stops;
}

export async function fetchLiveVehicles(): Promise<LiveVehicle[]> {
  if (!supabase) return [];
  const [vehicles, terminals] = await Promise.all([
    supabase
      .from('public_vehicle_directory')
      .select('id,terminal_id,body_number,vehicle_type,status,driver_name')
      .in('status', ['on_route', 'delayed'])
      .order('body_number'),
    supabase.from('terminals').select('id,name').eq('is_active', true),
  ]);
  if (vehicles.error) {
    console.warn('[directory] live vehicles fetch failed:', vehicles.error.message);
    return [];
  }
  if (terminals.error) console.warn('[directory] terminal names fetch failed:', terminals.error.message);
  const terminalName = new Map((terminals.data ?? []).map((row) => [row.id, row.name]));
  // Only surface units operating from a configured active terminal.
  return (vehicles.data ?? [])
    .filter((row) => row.terminal_id != null && terminalName.has(row.terminal_id))
    .map((row) => ({
      id: row.id,
      bodyNumber: row.body_number,
      vehicleType: row.vehicle_type,
      status: row.status as LiveVehicle['status'],
      driverName: row.driver_name,
      terminalId: row.terminal_id,
      terminalName: row.terminal_id ? terminalName.get(row.terminal_id) ?? null : null,
    }));
}

/** Live vehicle counts keyed by route, resolved through each route's terminals. */
export async function fetchRouteActivity(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!supabase) return counts;
  const [links, vehicles] = await Promise.all([
    fetchTerminalRouteLinks(),
    supabase.from('public_vehicle_directory').select('terminal_id').in('status', ['on_route', 'delayed']),
  ]);
  if (links.error || vehicles.error) {
    console.warn('[directory] route activity fetch failed:', links.error ?? vehicles.error?.message);
    return counts;
  }
  const liveTerminals = new Set((vehicles.data ?? []).map((row) => row.terminal_id));
  for (const link of links.links ?? []) {
    if (liveTerminals.has(link.terminal_id)) counts.set(link.route_id, (counts.get(link.route_id) ?? 0) + 1);
  }
  return counts;
}

export async function fetchServiceNotices(): Promise<ServiceNotice[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('service_alerts')
    .select('id,title,body,locality,severity,starts_at')
    .eq('published', true)
    .order('starts_at', { ascending: false })
    .limit(20);
  if (error) {
    console.warn('[directory] alerts fetch failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    locality: row.locality,
    severity: row.severity,
    startsAt: row.starts_at,
  }));
}
