// Browser storage stays independent of the native SQLite adapter.
export function storageGet(key: string): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); }
  catch { return null; }
}
export function storageSet(key: string, value: string): void {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); }
  catch { /* Preferences remain available in memory when browser storage is blocked. */ }
}
export function storageRemove(key: string): void {
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); }
  catch { /* Best-effort removal of non-authentication preferences. */ }
}
