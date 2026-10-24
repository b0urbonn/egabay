import { storageGet, storageRemove, storageSet } from './storage';

export type Session =
  | { kind: 'account'; name: string; email: string }
  | { kind: 'guest' };

type MockAccount = { name: string; email: string };

const SESSION_KEY = 'egabay.session';
const ONBOARDING_KEY = 'egabay.onboardingDone';
const ACCOUNTS_KEY = 'egabay.mockAccounts';

const DEMO_ACCOUNT: MockAccount = { name: 'Juan Dela Cruz', email: 'demo@egabay.ph' };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAccounts(): MockAccount[] {
  const raw = storageGet(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is MockAccount =>
        typeof a === 'object' && a !== null &&
        typeof a.name === 'string' && typeof a.email === 'string',
    );
  } catch {
    return [];
  }
}

function allAccounts(): MockAccount[] {
  const stored = getAccounts();
  return stored.some((a) => a.email === DEMO_ACCOUNT.email) ? stored : [DEMO_ACCOUNT, ...stored];
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 800));
}

export function getStoredSession(): Session | null {
  const raw = storageGet(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.kind === 'guest') return { kind: 'guest' };
    if (
      parsed?.kind === 'account' &&
      typeof parsed.name === 'string' && parsed.name.trim() !== '' &&
      typeof parsed.email === 'string' && validEmail(parsed.email)
    ) {
      return { kind: 'account', name: parsed.name, email: parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: Session): void {
  storageSet(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  storageRemove(SESSION_KEY);
}

export function mockSignIn(email: string, password: string): Promise<Session> {
  const normalized = normalizeEmail(email);
  if (!validEmail(normalized)) {
    return Promise.reject(new Error('Enter a valid email address.'));
  }
  if (password.length < 6) {
    return Promise.reject(new Error('Password must be at least 6 characters.'));
  }
  const account = allAccounts().find((a) => a.email === normalized);
  if (!account) {
    return Promise.reject(new Error('No account found for that email. Create one first.'));
  }
  return delay({ kind: 'account', name: account.name, email: account.email });
}

export function mockSignUp(name: string, email: string, password: string): Promise<Session> {
  const trimmedName = name.trim();
  const normalized = normalizeEmail(email);
  if (trimmedName === '') {
    return Promise.reject(new Error('Please enter your full name.'));
  }
  if (!validEmail(normalized)) {
    return Promise.reject(new Error('Enter a valid email address.'));
  }
  if (password.length < 6) {
    return Promise.reject(new Error('Password must be at least 6 characters.'));
  }
  if (allAccounts().some((a) => a.email === normalized)) {
    return Promise.reject(new Error('An account with that email already exists.'));
  }
  const account: MockAccount = { name: trimmedName, email: normalized };
  storageSet(ACCOUNTS_KEY, JSON.stringify([...getAccounts(), account]));
  return delay({ kind: 'account', name: account.name, email: account.email });
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
