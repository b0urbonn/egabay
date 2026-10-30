import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button, Card, ErrorBanner } from '../components/ui';
import { accountRoles, type AccountRole, type AccountSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

type Group = { id: string; name: string; kind: string; municipality: string; is_active: boolean };
type Terminal = { id: string; name: string; municipality: string; barangay: string; is_active: boolean };
type DirectoryUser = { id: string; display_name: string | null; email: string; role: AccountRole };
type Workspace = { groups: Group[]; terminals: Terminal[]; users: DirectoryUser[]; terminalCount: number; driverCount: number; membership: string | null };
const labels: Record<AccountRole, string> = { commuter: 'Commuter', driver: 'Driver', chairperson: 'Chairperson', super_admin: 'Super admin' };
function message(cause: unknown, fallback: string): string {
  return typeof cause === 'object' && cause !== null && 'message' in cause && typeof cause.message === 'string' ? cause.message : fallback;
}
const empty: Workspace = { groups: [], terminals: [], users: [], terminalCount: 0, driverCount: 0, membership: null };

async function loadWorkspace(account: AccountSession): Promise<Workspace> {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (account.role === 'super_admin') {
    const [groups, users, terminals, drivers] = await Promise.all([
      supabase.from('groups').select('id,name,kind,municipality,is_active').order('name'),
      supabase.rpc('admin_user_directory').limit(50),
      supabase.from('terminals').select('id', { count: 'exact', head: true }),
      supabase.from('drivers').select('profile_id', { count: 'exact', head: true }),
    ]);
    for (const result of [groups, users, terminals, drivers]) if (result.error) throw result.error;
    return { ...empty, groups: groups.data ?? [], users: users.data ?? [], terminalCount: terminals.count ?? 0, driverCount: drivers.count ?? 0 };
  }
  let groupId: string | null = null;
  let membership: string | null = null;
  if (account.role === 'chairperson') {
    const group = await supabase.from('groups').select('id').eq('chairperson_id', account.id).maybeSingle();
    if (group.error) throw group.error;
    groupId = group.data?.id ?? null;
  } else if (account.role === 'driver') {
    const driver = await supabase.from('drivers').select('group_id,membership_status,availability').eq('profile_id', account.id).maybeSingle();
    if (driver.error) throw driver.error;
    groupId = driver.data?.group_id ?? null;
    membership = driver.data ? `${driver.data.membership_status} · ${driver.data.availability}` : null;
  }
  if (!groupId) return empty;
  const [groups, links] = await Promise.all([
    supabase.from('groups').select('id,name,kind,municipality,is_active').eq('id', groupId),
    supabase.from('terminal_groups').select('terminals(id,name,municipality,barangay,is_active)').eq('group_id', groupId),
  ]);
  if (groups.error) throw groups.error;
  if (links.error) throw links.error;
  const terminals = (links.data ?? [])
    .flatMap((link) => {
      const terminal = Array.isArray(link.terminals) ? link.terminals[0] : link.terminals;
      return terminal ? [terminal] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { ...empty, groups: groups.data ?? [], terminals, terminalCount: terminals.length, membership };
}

export function RoleWorkspaceScreen({ account, onLogout, onOpenCommuter, onRefreshSession }: {
  account: AccountSession; onLogout: () => void; onOpenCommuter: () => void; onRefreshSession: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const { width } = useWindowDimensions();
  const wide = account.role === 'super_admin' && width >= 900;
  const [data, setData] = useState<Workspace>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [choices, setChoices] = useState<Record<string, AccountRole>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void loadWorkspace(account).then((next) => { if (active) setData(next); })
      .catch((cause: unknown) => { if (active) setError(message(cause, 'Workspace data could not be loaded. Check your connection, then retry.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account.id, account.role, revision]);

  const saveRole = async (user: DirectoryUser) => {
    if (!supabase || !choices[user.id]) return;
    setSaving(user.id);
    setError(null);
    try {
      const result = await supabase.rpc('set_user_role', { target_user: user.id, next_role: choices[user.id] });
      if (result.error) throw result.error;
      setChoices((current) => { const next = { ...current }; delete next[user.id]; return next; });
      setRevision((value) => value + 1);
      if (user.id === account.id) onRefreshSession();
    } catch (cause) {
      setError(message(cause, 'The role could not be updated. Check the account’s group assignments.'));
    } finally { setSaving(null); }
  };

  return (
    <View style={[styles.shell, wide && styles.wideShell]}>
      {wide && <View style={styles.sidebar}>
        <Text style={styles.brand}>eGABAY</Text>
        <Text style={styles.sidebarLabel}>ADMINISTRATION</Text>
        <Text style={styles.sidebarItem}>Overview & accounts</Text>
        <Text style={styles.sidebarCopy}>Manage access across the transport network.</Text>
        <View style={styles.sidebarFooter}><Button label="Commuter view" variant="secondary" onPress={onOpenCommuter} /><Button label="Sign out" variant="ghost" onPress={onLogout} /></View>
      </View>}
      <ScrollView style={styles.main} contentContainerStyle={[styles.content, wide && styles.wideContent]}>
        <View style={styles.topRow}>
          <View style={styles.flex}><Text style={styles.eyebrow}>{labels[account.role].toUpperCase()} WORKSPACE</Text><Text style={styles.title}>Hello, {account.name.split(' ')[0]}</Text><Text style={styles.copy}>{account.email}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setRevision((value) => value + 1)} style={styles.refresh}><Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh'}</Text></Pressable>
        </View>
        {!wide && <View style={styles.actions}><Button label="Commuter view" variant="secondary" onPress={onOpenCommuter} /><Button label="Sign out" variant="ghost" onPress={onLogout} /></View>}
        {error && <ErrorBanner message={error} />}
        <View style={styles.stats}>
          {[['Groups', data.groups.length], ['Terminals', data.terminalCount], ...(account.role === 'super_admin' ? [['Drivers', data.driverCount]] : [])].map(([label, value]) => <Card key={label} style={styles.stat}><Text style={styles.statValue}>{loading ? '—' : value}</Text><Text style={styles.statLabel}>{label}</Text></Card>)}
        </View>
        {data.membership && <Card><Text style={styles.cardTitle}>Membership & availability</Text><Text style={styles.copy}>{data.membership}</Text></Card>}
        <Text style={styles.sectionTitle}>{account.role === 'super_admin' ? 'Transport groups' : 'Your group'}</Text>
        {!loading && !data.groups.length && <Card><Text style={styles.cardTitle}>{account.role === 'super_admin' ? 'No groups registered yet' : 'No group assigned yet'}</Text><Text style={styles.copy}>{account.role === 'super_admin' ? 'Verified TODA and jeepney groups will appear here after registration.' : 'Your group will appear here after its membership or chairperson assignment is recorded.'}</Text></Card>}
        {data.groups.map((group) => <Card key={group.id}><Text style={styles.cardTitle}>{group.name}</Text><Text style={styles.copy}>{group.kind.toUpperCase()} · {group.municipality} · {group.is_active ? 'Active' : 'Inactive'}</Text></Card>)}
        {data.terminals.length > 0 && <Text style={styles.sectionTitle}>Group terminals</Text>}
        {data.terminals.map((terminal) => <Card key={terminal.id}><Text style={styles.cardTitle}>{terminal.name}</Text><Text style={styles.copy}>{terminal.barangay} · {terminal.municipality}</Text></Card>)}
        {account.role === 'super_admin' && <>
          <Text style={styles.sectionTitle}>Account access</Text>
          <Text style={styles.copy}>Showing up to 50 accounts. New accounts start as commuters. Group membership and chairperson assignments are configured separately.</Text>
          {data.users.map((user) => <Card key={user.id} style={styles.userCard}>
            <Text style={styles.cardTitle}>{user.display_name || user.email}</Text><Text style={styles.copy}>{user.email}</Text>
            <View style={styles.roleOptions}>{accountRoles.map((role) => {
              const selected = (choices[user.id] ?? user.role) === role;
              return <Pressable key={role} accessibilityRole="button" accessibilityLabel={`${labels[role]} role for ${user.email}`} accessibilityState={{ selected }} disabled={saving !== null} onPress={() => setChoices((current) => ({ ...current, [user.id]: role }))} style={[styles.roleOption, selected && styles.roleSelected]}><Text style={[styles.roleText, selected && styles.roleTextSelected]}>{labels[role]}</Text></Pressable>;
            })}</View>
            {choices[user.id] && choices[user.id] !== user.role && <Button label="Save role" onPress={() => void saveRole(user)} loading={saving === user.id} disabled={saving !== null && saving !== user.id} />}
          </Card>)}
        </>}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.canvas }, wideShell: { flexDirection: 'row' },
    sidebar: { width: 250, padding: 24, borderRightWidth: 1, borderRightColor: colors.line, backgroundColor: colors.card },
    brand: { color: colors.ink, fontSize: 24, fontWeight: '900', marginBottom: 45 }, sidebarLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
    sidebarItem: { color: colors.greenDark, backgroundColor: colors.greenLight, borderRadius: 12, padding: 14, marginTop: 14, fontWeight: '700' },
    sidebarCopy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 18 }, sidebarFooter: { marginTop: 'auto', gap: 8 },
    main: { flex: 1 }, content: { padding: 22, gap: 14, paddingBottom: 40 }, wideContent: { padding: 36, maxWidth: 1200, width: '100%', alignSelf: 'center' },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, flex: { flex: 1 }, eyebrow: { color: colors.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    title: { color: colors.ink, fontSize: 26, lineHeight: 34, fontWeight: '800', marginTop: 6 }, copy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 4 },
    refresh: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, refreshText: { color: colors.greenDark, fontSize: 12, fontWeight: '700' },
    actions: { gap: 8 }, stats: { flexDirection: 'row', gap: 10, marginTop: 10 }, stat: { flex: 1, gap: 4 }, statValue: { color: colors.ink, fontSize: 26, fontWeight: '800' }, statLabel: { color: colors.muted, fontSize: 11 },
    sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 14 }, cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' }, userCard: { gap: 6 },
    roleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }, roleOption: { borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 9 },
    roleSelected: { backgroundColor: colors.greenLight, borderColor: colors.greenDark }, roleText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, roleTextSelected: { color: colors.greenDark },
  });
}
