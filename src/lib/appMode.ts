import { storageGet, storageRemove, storageSet } from './storage';

export type AppMode = 'online' | 'offline';

const STORAGE_KEY = 'egabay.appMode';

// A missing value means no connection mode has been chosen yet.
export function getStoredMode(): AppMode | null {
  const value = storageGet(STORAGE_KEY);
  return value === 'online' || value === 'offline' ? value : null;
}

export function setStoredMode(mode: AppMode): void {
  storageSet(STORAGE_KEY, mode);
}

export function clearStoredMode(): void {
  storageRemove(STORAGE_KEY);
}
