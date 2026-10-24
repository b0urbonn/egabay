import { storageGet, storageRemove, storageSet } from './storage';

export type AppearanceSetting = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'egabay.appearance';

export function getStoredAppearance(): AppearanceSetting {
  const value = storageGet(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function setStoredAppearance(setting: AppearanceSetting): void {
  storageSet(STORAGE_KEY, setting);
}

export function clearStoredAppearance(): void {
  storageRemove(STORAGE_KEY);
}
