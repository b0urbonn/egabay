import { isSupabaseConfigured, supabase } from './supabase';

// Public columns of `public.terminals` — readable by anon through the
// `terminals_public` RLS policy (active terminals in active groups only).
// `groupKind` comes from the owning transport group ('jeepney' | 'toda') and
// lets the map filter terminals by transport type.
export type PublicTerminal = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  address: string | null;
  latitude: number;
  longitude: number;
  groupKind: string | null;
};

type PublicTerminalRow = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  groups: { kind: string } | { kind: string }[] | null;
};

export async function fetchPublicTerminals(): Promise<PublicTerminal[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('terminals')
    .select('id,name,municipality,barangay,address,latitude,longitude,groups(kind)')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .order('municipality');
  if (error) {
    console.warn('[terminals] fetch failed:', error.message);
    return [];
  }
  return ((data ?? []) as PublicTerminalRow[]).flatMap((t) => {
    if (typeof t.latitude !== 'number' || typeof t.longitude !== 'number') return [];
    const group = Array.isArray(t.groups) ? t.groups[0] : t.groups;
    return [{
      id: t.id,
      name: t.name,
      municipality: t.municipality,
      barangay: t.barangay,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      groupKind: group?.kind ?? null,
    }];
  });
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
