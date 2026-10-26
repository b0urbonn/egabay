import { useEffect, useState } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

import { loadAccount } from './auth';
import type { AccountSession } from './session';
import { supabase } from './supabase';

export function useAuthSession() {
  const [authSession, setAuthSession] = useState<SupabaseSession | null>(null);
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [initialized, setInitialized] = useState(!supabase);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    let events = 0;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      events += 1;
      setRevision((value) => value + 1);
      // Keep this callback synchronous: database/auth calls run in effects,
      // outside Supabase's auth lock.
      setAuthSession(session);
      setAccount(null);
      setProfileLoading(Boolean(session));
      setInitialized(true);
      setError(null);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (!session) setRecovering(false);
    });
    void client.auth.initialize().then(async ({ error: initializationError }) => {
      if (!active) return;
      if (initializationError) {
        setError(initializationError.message);
        setInitialized(true);
        return;
      }
      const { data, error: sessionError } = await client.auth.getSession();
      if (!active) return;
      if (sessionError) { setError(sessionError.message); setInitialized(true); }
      else if (!events) {
        setAuthSession(data.session);
        setProfileLoading(Boolean(data.session));
        setInitialized(true);
      }
    }).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : 'Unable to restore your sign-in.');
      setInitialized(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authSession) { setAccount(null); setProfileLoading(false); return; }
    let active = true;
    setProfileLoading(true);
    setError(null);
    void loadAccount(authSession.user).then((profile) => {
      if (active) setAccount(profile);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your profile.');
    }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [authSession, revision]);

  return {
    account, userId: authSession?.user.id ?? null,
    loading: !initialized || profileLoading, error, recovering,
    retry: () => { setError(null); setRevision((value) => value + 1); },
    finishRecovery: () => setRecovering(false),
  };
}
