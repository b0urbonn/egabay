import { storageGet, storageRemove, storageSet } from './storage';

export const accountRoles = ['commuter', 'driver', 'chairperson', 'super_admin'] as const;
export type AccountRole = (typeof accountRoles)[number];
export type AccountSession = {
  kind: 'account';
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  photoUrl: string | null;
};
export type Session = AccountSession | { kind: 'guest' };

const SESSION_KEY = 'egabay.session';
const ONBOARDING_KEY = 'egabay.onboardingDone';

// Supabase owns authenticated sessions. Only the guest preference is restored
// here; old mock accounts and locally edited roles must never authenticate users.
export function getStoredSession(): Session | null {
  try {
    return JSON.parse(storageGet(SESSION_KEY) ?? 'null')?.kind === 'guest' ? { kind: 'guest' } : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: Session): void {
  if (session.kind === 'guest') storageSet(SESSION_KEY, JSON.stringify(session));
  else storageRemove(SESSION_KEY);
}

export function clearStoredSession(): void {
  storageRemove(SESSION_KEY);
  storageRemove('egabay.mockAccounts');
}

export function isOnboardingDone(): boolean {
  return storageGet(ONBOARDING_KEY) === 'true';
}
export function setOnboardingDone(): void {
  storageSet(ONBOARDING_KEY, 'true');
}
export function clearOnboardingDone(): void {
  storageRemove(ONBOARDING_KEY);
}
