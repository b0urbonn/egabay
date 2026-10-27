import { storageGet, storageSet } from './storage';

// Last-good snapshots of the public transport directory so commuters still
// see routes, terminals, and stops when the network or Supabase is down.

export type DirectoryCacheKey = 'routes' | 'terminals' | 'route-stops';

const memoryCache = new Map<DirectoryCacheKey, unknown>();

export function readDirectoryCache<T>(key: DirectoryCacheKey, guard: (value: unknown) => value is T): T | null {
  const memory = memoryCache.get(key);
  if (guard(memory)) return memory;
  const raw = storageGet(`egabay.directory.${key}`);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!guard(parsed)) return null;
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeDirectoryCache(key: DirectoryCacheKey, value: unknown): void {
  memoryCache.set(key, value);
  try {
    storageSet(`egabay.directory.${key}`, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; the in-memory snapshot still applies.
  }
}
