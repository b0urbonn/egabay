import { isSupabaseConfigured, supabase } from './supabase';

// Public columns of `public.terminals` — readable by anon through the
// `terminals_public` RLS policy (active terminals in active groups only).
export type PublicTerminal = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

export async function fetchPublicTerminals(): Promise<PublicTerminal[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('terminals')
    .select('id,name,municipality,barangay,address,latitude,longitude')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .order('municipality');
  if (error) {
    console.warn('[terminals] fetch failed:', error.message);
    return [];
  }
  return (data ?? []).filter(
    (t): t is PublicTerminal => typeof t.latitude === 'number' && typeof t.longitude === 'number',
  );
}

/** Re-runs `onChange` whenever the terminals table changes. No-op when Supabase is not configured. */
export function subscribePublicTerminals(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel('public-terminals')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'terminals' }, onChange)
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
