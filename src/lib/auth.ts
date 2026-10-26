import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';

import { accountRoles, type AccountRole, type AccountSession } from './session';
import { supabase } from './supabase';

function client() {
  if (!supabase) throw new Error('Sign-in is not configured yet. Please contact the administrator.');
  return supabase;
}

export function authRedirectUrl(): string | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return window.location.origin + window.location.pathname;
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = authRedirectUrl();
  if (!redirectTo) throw new Error('Open eGABAY in your web browser to use Google sign-in.');
  const { error } = await client().auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<boolean> {
  const { data, error } = await client().auth.signUp({
    email: email.trim(), password,
    options: { data: { display_name: name.trim() }, emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw error;
  return !data.session;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await client().auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl() });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function loadAccount(user: User): Promise<AccountSession> {
  const { data, error } = await client().from('profiles').select('id, display_name, photo_url, role').eq('id', user.id).single();
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42703') {
      throw new Error('Your account profile is not ready yet. Ask the administrator to finish setup, then select Retry.');
    }
    throw new Error('Your profile could not be loaded. Check the connection and database setup, then retry.');
  }
  if (!accountRoles.includes(data.role as AccountRole)) throw new Error('Your account role is not supported. Ask the administrator to review your profile.');
  const candidatePhoto = data.photo_url ?? user.user_metadata.avatar_url;
  return {
    kind: 'account', id: user.id, email: user.email ?? '', role: data.role as AccountRole,
    name: data.display_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'Commuter',
    photoUrl: typeof candidatePhoto === 'string' && /^https?:\/\//i.test(candidatePhoto) ? candidatePhoto : null,
  };
}
