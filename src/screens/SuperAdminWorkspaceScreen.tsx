import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { Button, Card, Chip, ErrorBanner } from '../components/ui';
import { accountRoles, type AccountRole, type AccountSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { useColors, useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

type Section = 'overview' | 'groups' | 'terminals' | 'vehicles' | 'users' | 'reports' | 'audit';
type Group = { id: string; name: string; kind: 'toda' | 'jeepney'; municipality: string; is_active: boolean; chairperson_id: string | null };
type Terminal = { id: string; group_id: string; name: string; municipality: string; barangay: string; is_active: boolean };
type Vehicle = { id: string; terminal_id: string; body_number: string; plate_number: string | null; vehicle_type: 'jeepney' | 'tricycle'; status: string; assigned_driver_id: string | null };
type Driver = { profile_id: string; group_id: string; membership_status: string; availability: string };
type DirectoryUser = { id: string; display_name: string | null; email: string; role: AccountRole; created_at: string };
type AuditEvent = { id: number; actor_id: string | null; action: string; table_name: string; record_id: string | null; detail: Record<string, unknown>; created_at: string };
type PanelData = {
  groups: Group[]; terminals: Terminal[]; vehicles: Vehicle[]; drivers: Driver[]; users: DirectoryUser[]; audit: AuditEvent[];
  counts: { groups: number; activeGroups: number; terminals: number; vehicles: number; onTrip: number; drivers: number; pending: number; approved: number; routes: number };
};

const roles: Record<AccountRole, string> = { commuter: 'Commuter', driver: 'Driver', chairperson: 'Chairperson', super_admin: 'Super admin' };
const sections: { id: Section; label: string; icon: MaterialIconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'groups', label: 'Transport groups', icon: 'groups' },
  { id: 'terminals', label: 'Terminals', icon: 'terminals' },
  { id: 'vehicles', label: 'Vehicles', icon: 'liveTrips' },
  { id: 'users', label: 'Users & roles', icon: 'person' },
  { id: 'reports', label: 'Reports', icon: 'analytics' },
  { id: 'audit', label: 'Audit log', icon: 'history' },
];
const municipalities = ['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'];
const initialData: PanelData = {
  groups: [], terminals: [], vehicles: [], drivers: [], users: [], audit: [],
  counts: { groups: 0, activeGroups: 0, terminals: 0, vehicles: 0, onTrip: 0, drivers: 0, pending: 0, approved: 0, routes: 0 },
};

function errorMessage(cause: unknown): string {
  if (typeof cause === 'object' && cause !== null && 'message' in cause && typeof cause.message === 'string') return cause.message;
  return 'Dashboard data could not be loaded. Check the database setup and try again.';
}

async function loadPanelData(): Promise<PanelData> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [groups, activeGroups, terminals, vehicles, onTripVehicles, drivers, pendingDrivers, approvedDrivers, users, routes, audit] = await Promise.all([
    supabase.from('groups').select('id,name,kind,municipality,is_active,chairperson_id', { count: 'exact' }).order('name').limit(250),
    supabase.from('groups').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('terminals').select('id,group_id,name,municipality,barangay,is_active', { count: 'exact' }).order('name').limit(250),
    supabase.from('vehicles').select('id,terminal_id,body_number,plate_number,vehicle_type,status,assigned_driver_id', { count: 'exact' }).order('body_number').limit(250),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'on_route'),
    supabase.from('drivers').select('profile_id,group_id,membership_status,availability', { count: 'exact' }).limit(250),
    supabase.from('drivers').select('profile_id', { count: 'exact', head: true }).eq('membership_status', 'pending'),
    supabase.from('drivers').select('profile_id', { count: 'exact', head: true }).eq('membership_status', 'approved'),
    supabase.rpc('admin_user_directory').limit(50),
    supabase.from('routes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('audit_log').select('id,actor_id,action,table_name,record_id,detail,created_at').order('created_at', { ascending: false }).limit(10),
  ]);
  for (const result of [groups, activeGroups, terminals, vehicles, onTripVehicles, drivers, pendingDrivers, approvedDrivers, users, routes, audit]) {
    if (result.error) throw result.error;
  }
  return {
    groups: groups.data ?? [], terminals: terminals.data ?? [], vehicles: vehicles.data ?? [], drivers: drivers.data ?? [],
    users: users.data ?? [], audit: (audit.data ?? []) as AuditEvent[],
    counts: {
      groups: groups.count ?? 0, activeGroups: activeGroups.count ?? 0, terminals: terminals.count ?? 0,
      vehicles: vehicles.count ?? 0, onTrip: onTripVehicles.count ?? 0, drivers: drivers.count ?? 0,
      pending: pendingDrivers.count ?? 0, approved: approvedDrivers.count ?? 0, routes: routes.count ?? 0,
    },
  };
}

function shortDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

function initials(value: string): string {
  return value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A';
}

export function SuperAdminWorkspaceScreen({ account, onLogout, onOpenCommuter, onRefreshSession }: {
  account: AccountSession; onLogout: () => void; onOpenCommuter: () => void; onRefreshSession: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const compact = width < 520;
  const styles = useThemeStyles((colors) => createStyles(colors, wide));
  const colors = useColors();
  const [section, setSection] = useState<Section>('overview');
  const [data, setData] = useState<PanelData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [choices, setChoices] = useState<Record<string, AccountRole>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void loadPanelData().then((next) => { if (active) setData(next); })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account.id, revision]);

  const selectedSection = sections.find((item) => item.id === section) ?? sections[0];
  const matching = (text: string) => text.toLowerCase().includes(search.trim().toLowerCase());
  const groupById = useMemo(() => new Map(data.groups.map((group) => [group.id, group])), [data.groups]);
  const terminalById = useMemo(() => new Map(data.terminals.map((terminal) => [terminal.id, terminal])), [data.terminals]);
  const userById = useMemo(() => new Map(data.users.map((user) => [user.id, user])), [data.users]);

  const groups = data.groups.filter((group) => {
    const status = filter === 'Active' ? group.is_active : filter === 'Inactive' ? !group.is_active : true;
    return status && matching(`${group.name} ${group.kind} ${group.municipality}`);
  });
  const terminals = data.terminals.filter((terminal) => {
    const group = groupById.get(terminal.group_id);
    const status = filter === 'Active' ? terminal.is_active : filter === 'Inactive' ? !terminal.is_active : true;
    return status && matching(`${terminal.name} ${terminal.barangay} ${terminal.municipality} ${group?.name ?? ''}`);
  });
  const vehicles = data.vehicles.filter((vehicle) => {
    const terminal = terminalById.get(vehicle.terminal_id);
    const driver = vehicle.assigned_driver_id ? userById.get(vehicle.assigned_driver_id) : undefined;
    const type = filter === 'Jeepney' || filter === 'Tricycle' ? vehicle.vehicle_type === filter.toLowerCase() : true;
    const status = filter === 'On trip' ? vehicle.status === 'on_route' : true;
    return type && status && matching(`${vehicle.body_number} ${vehicle.plate_number ?? ''} ${terminal?.name ?? ''} ${driver?.display_name ?? ''} ${driver?.email ?? ''}`);
  });
  const users = data.users.filter((user) => {
    const role = filter === 'All' || roles[user.role] === filter;
    return role && matching(`${user.display_name ?? ''} ${user.email} ${roles[user.role]}`);
  });

  const changeSection = (next: Section) => { setSection(next); setSearch(''); setFilter('All'); };
  const saveRole = async (user: DirectoryUser) => {
    if (!supabase || !choices[user.id]) return;
    setSaving(user.id); setError(null);
    try {
      const result = await supabase.rpc('set_user_role', { target_user: user.id, next_role: choices[user.id] });
      if (result.error) throw result.error;
      setChoices((current) => { const next = { ...current }; delete next[user.id]; return next; });
      setRevision((value) => value + 1);
      if (user.id === account.id) onRefreshSession();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally { setSaving(null); }
  };

  const sectionDescription: Record<Section, string> = {
    overview: 'A clear view of groups, terminals, vehicles, and operator accounts across Marinduque.',
    groups: 'Browse TODA and jeepney groups and see their municipality and chairperson assignment.',
    terminals: 'Review registered transport terminals and the groups responsible for them.',
    vehicles: 'View the island wide vehicle roster, assignment, and current service status.',
    users: 'Review accounts and manage the roles supported by the access model.',
    reports: 'Compare verified registry coverage across municipalities and transport types.',
    audit: 'Review privileged changes recorded by the database with actor and timestamp.',
  };

  return (
    <View style={styles.shell}>
      {wide ? (
        <View style={styles.sidebar}>
          <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View><Text style={styles.brand}>eGABAY</Text></View>
          <Text style={styles.sidebarEyebrow}>ADMINISTRATION</Text>
          <Text style={styles.sidebarCaption}>Transport network</Text>
          <View style={styles.navList}>{sections.map((item) => <NavigationItem key={item.id} item={item} selected={section === item.id} onPress={() => changeSection(item.id)} styles={styles} colors={colors} />)}</View>
          <View style={styles.sidebarBottom}>
            <View style={styles.sidebarAccount}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(account.name)}</Text></View><View style={styles.accountCopy}><Text style={styles.accountName} numberOfLines={1}>{account.name}</Text><Text style={styles.accountRole}>Super administrator</Text></View></View>
            <Button label="Commuter view" variant="secondary" onPress={onOpenCommuter} />
            <Pressable accessibilityRole="button" onPress={onLogout} style={styles.signOut}><MaterialIcon name="logout" size={17} color={colors.muted} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.mobileHeader}>
          <View style={styles.mobileBrand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View><View><Text style={styles.brand}>eGABAY Admin</Text><Text style={styles.sidebarEyebrow}>SUPER ADMIN</Text></View></View>
          <Pressable accessibilityRole="button" onPress={onLogout} style={styles.iconButton}><MaterialIcon name="logout" size={19} color={colors.ink} /></Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>{sections.map((item) => <NavigationItem key={item.id} item={item} selected={section === item.id} onPress={() => changeSection(item.id)} styles={styles} colors={colors} compact />)}</ScrollView>
        </View>
      )}

      <View style={styles.main}>
        <View style={[styles.topbar, compact && styles.topbarCompact]}>
          <View style={styles.breadcrumb}>{compact ? <Text style={styles.breadcrumbCurrent}>{selectedSection.label}</Text> : <><Text style={styles.breadcrumbMuted}>eGABAY</Text><Text style={styles.breadcrumbSlash}>/</Text><Text style={styles.breadcrumbCurrent}>{selectedSection.label}</Text></>}</View>
          <View style={styles.topbarActions}>
            <View style={[styles.searchBox, compact && styles.searchBoxCompact]}><MaterialIcon name="search" size={18} color={colors.muted} /><TextInput accessibilityLabel="Search current section" value={search} onChangeText={setSearch} placeholder="Search this section" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Refresh dashboard" onPress={() => setRevision((value) => value + 1)} style={styles.refreshButton}>
              {loading ? <ActivityIndicator size="small" color={colors.green} /> : <MaterialIcon name="refresh" size={19} color={colors.ink} />}
            </Pressable>
            {!compact && <View style={styles.topAvatar}><Text style={styles.avatarText}>{initials(account.name)}</Text></View>}
          </View>
        </View>

        {!wide && <View style={styles.mobileActions}><Button label="Commuter view" variant="secondary" onPress={onOpenCommuter} /></View>}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeading}><Text style={styles.eyebrow}>SUPER ADMIN CONSOLE</Text><Text style={styles.pageTitle}>{section === 'overview' ? `Welcome back, ${account.name.split(' ')[0]}` : selectedSection.label}</Text><Text style={styles.pageIntro}>{sectionDescription[section]}</Text></View>
            {section === 'groups' && <Button label="New group · coming soon" variant="secondary" disabled />}
          </View>
          {error && <ErrorBanner message={error} />}
          {section === 'overview' && <OverviewPanel data={data} users={userById} loading={loading} styles={styles} onNavigate={changeSection} />}
          {section === 'groups' && <GroupsPanel groups={groups} loading={loading} filter={filter} setFilter={setFilter} styles={styles} users={data.users} />}
          {section === 'terminals' && <TerminalsPanel terminals={terminals} groups={groupById} loading={loading} filter={filter} setFilter={setFilter} styles={styles} />}
          {section === 'vehicles' && <VehiclesPanel vehicles={vehicles} terminals={terminalById} groups={groupById} users={userById} loading={loading} filter={filter} setFilter={setFilter} styles={styles} />}
          {section === 'users' && <UsersPanel users={users} loading={loading} filter={filter} setFilter={setFilter} choices={choices} setChoices={setChoices} saving={saving} saveRole={saveRole} styles={styles} />}
          {section === 'reports' && <ReportsPanel data={data} loading={loading} styles={styles} />}
          {section === 'audit' && <AuditPanel events={data.audit} users={userById} loading={loading} styles={styles} />}
          <Text style={styles.footerNote}>Showing verified Supabase records. Group, terminal, and vehicle editing workflows are staged for the next build-plan step.</Text>
        </ScrollView>
      </View>
    </View>
  );
}

function NavigationItem({ item, selected, onPress, styles, colors, compact = false }: {
  item: { id: Section; label: string; icon: MaterialIconName }; selected: boolean; onPress: () => void;
  styles: ReturnType<typeof createStyles>; colors: ThemeColors; compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[compact ? styles.mobileNavItem : styles.navItem, selected && (compact ? styles.mobileNavSelected : styles.navSelected)]}>
    <MaterialIcon name={item.icon} size={18} color={selected ? colors.greenDark : colors.muted} />
    <Text style={[compact ? styles.mobileNavLabel : styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
    {!compact && selected && <View style={styles.navIndicator} />}
  </Pressable>;
}

function OverviewPanel({ data, users, loading, styles, onNavigate }: { data: PanelData; users: Map<string, DirectoryUser>; loading: boolean; styles: ReturnType<typeof createStyles>; onNavigate: (section: Section) => void }) {
  const metrics = [
    { label: 'Transport groups', value: data.counts.groups, icon: 'groups' as const, note: `${data.counts.activeGroups} active` },
    { label: 'Terminals', value: data.counts.terminals, icon: 'terminals' as const, note: 'Across all municipalities' },
    { label: 'Registered vehicles', value: data.counts.vehicles, icon: 'liveTrips' as const, note: `${data.counts.onTrip} currently on route` },
    { label: 'Drivers', value: data.counts.drivers, icon: 'person' as const, note: `${data.counts.pending} applications pending` },
  ];
  const groupsInTown = (town: string) => data.groups.filter((group) => group.municipality === town).length;
  const maxGroups = Math.max(1, ...municipalities.map(groupsInTown));
  return <>
    <View style={styles.hero}>
      <View style={styles.heroContent}><View style={styles.heroKicker}><View style={styles.heroDot} /><Text style={styles.heroKickerText}>NETWORK OVERVIEW</Text></View><Text style={styles.heroTitle}>Marinduque transport, at a glance</Text><Text style={styles.heroCopy}>Keep local groups, terminals, vehicles, and account access organized in one place.</Text><Pressable accessibilityRole="button" onPress={() => onNavigate('groups')} style={styles.heroLink}><Text style={styles.heroLinkText}>View transport groups</Text><MaterialIcon name="arrowForward" size={17} color="#FFFFFF" /></Pressable></View>
      <View style={styles.heroIconWrap}><MaterialIcon name="map" size={64} color="rgba(255,255,255,0.88)" /></View>
    </View>
    <View style={[styles.metrics, !styles.wide && styles.metricsCompact]}>
      {metrics.map((metric) => <Card key={metric.label} style={styles.metricCard}><View style={styles.metricTop}><View style={styles.metricIcon}><MaterialIcon name={metric.icon} size={18} color={styles.colors.green} /></View><Text style={styles.metricArrow}>↗</Text></View><Text style={styles.metricValue}>{loading ? '—' : metric.value.toLocaleString()}</Text><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricNote}>{metric.note}</Text></Card>)}
    </View>
    <View style={[styles.dashboardColumns, !styles.wide && styles.dashboardColumnsCompact]}>
      <Card style={styles.coverageCard}>
        <View style={styles.panelHeading}><View><Text style={styles.panelTitle}>Network coverage</Text><Text style={styles.panelSubtitle}>Registered groups by municipality</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('reports')}><Text style={styles.panelAction}>View report</Text></Pressable></View>
        {municipalities.map((town) => <View key={town} style={styles.coverageRow}><View style={styles.coverageTown}><Text style={styles.coverageName}>{town}</Text><Text style={styles.coverageCount}>{groupsInTown(town)} groups</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { width: `${(groupsInTown(town) / maxGroups) * 100}%` }]} /></View></View>)}
        {!loading && data.counts.groups === 0 && <Text style={styles.emptyCaption}>No verified groups have been added yet.</Text>}
      </Card>
      <View style={styles.overviewAside}>
        <Card style={styles.actionsCard}><Text style={styles.panelTitle}>Quick access</Text><Text style={styles.panelSubtitle}>Jump to a common admin task</Text>
          <QuickLink label="Manage transport groups" detail="Review group coverage and chairs" icon="groups" onPress={() => onNavigate('groups')} styles={styles} />
          <QuickLink label="Manage user access" detail="Review roles and account status" icon="person" onPress={() => onNavigate('users')} styles={styles} />
          <QuickLink label="Review admin activity" detail="See privileged changes" icon="history" onPress={() => onNavigate('audit')} styles={styles} />
        </Card>
        <Card style={styles.activityCard}><View style={styles.panelHeading}><View><Text style={styles.panelTitle}>Recent activity</Text><Text style={styles.panelSubtitle}>Latest privileged changes</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('audit')}><Text style={styles.panelAction}>All activity</Text></Pressable></View>
          {loading ? <ActivityIndicator color={styles.colors.green} /> : data.audit.length ? data.audit.slice(0, 4).map((event) => <ActivityRow key={event.id} event={event} actor={event.actor_id ? users.get(event.actor_id)?.display_name || users.get(event.actor_id)?.email || 'Administrator' : 'System'} styles={styles} />) : <Text style={styles.emptyCaption}>No admin activity recorded yet.</Text>}
        </Card>
      </View>
    </View>
  </>;
}

function QuickLink({ label, detail, icon, onPress, styles }: { label: string; detail: string; icon: MaterialIconName; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickLink}><View style={styles.quickIcon}><MaterialIcon name={icon} size={17} color={styles.colors.green} /></View><View style={styles.quickCopy}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickDetail}>{detail}</Text></View><MaterialIcon name="chevronRight" size={18} color={styles.colors.muted} /></Pressable>;
}

function GroupsPanel({ groups, loading, filter, setFilter, styles, users }: { groups: Group[]; loading: boolean; filter: string; setFilter: (value: string) => void; styles: ReturnType<typeof createStyles>; users: DirectoryUser[] }) {
  return <Card style={styles.listCard}><ListToolbar title="Transport groups" count={groups.length} filter={filter} setFilter={setFilter} options={['All', 'Active', 'Inactive']} styles={styles} />
    <StandbyNotice styles={styles} text="Group creation, editing, and chairperson assignment will be enabled in the operational console milestone." />
    {loading ? <LoadingRows styles={styles} /> : groups.length ? <View style={styles.listRows}>{groups.map((group) => {
      const chair = users.find((user) => user.id === group.chairperson_id);
      return <View key={group.id} style={styles.dataRow}><View style={styles.rowLeading}><View style={[styles.rowIcon, group.kind === 'toda' ? styles.orangeIcon : styles.greenIcon]}><MaterialIcon name={group.kind === 'toda' ? 'liveTrips' : 'groups'} size={18} color={group.kind === 'toda' ? styles.colors.orangeDark : styles.colors.green} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{group.name}</Text><Text style={styles.rowSub}>{group.kind === 'toda' ? 'TODA' : 'Jeepney group'} · {group.municipality}</Text></View></View><View style={styles.rowSecondary}><Text style={styles.rowMetaLabel}>CHAIRPERSON</Text><Text style={styles.rowMeta}>{chair?.display_name || chair?.email || (group.chairperson_id ? 'Assigned' : 'Unassigned')}</Text></View><StatusPill label={group.is_active ? 'Active' : 'Inactive'} tone={group.is_active ? 'green' : 'neutral'} styles={styles} /></View>;
    })}</View> : <EmptyState title="No transport groups yet" body="Verified TODA and jeepney groups will appear here after they are registered." styles={styles} />}
  </Card>;
}

function TerminalsPanel({ terminals, groups, loading, filter, setFilter, styles }: { terminals: Terminal[]; groups: Map<string, Group>; loading: boolean; filter: string; setFilter: (value: string) => void; styles: ReturnType<typeof createStyles> }) {
  return <Card style={styles.listCard}><ListToolbar title="Terminal directory" count={terminals.length} filter={filter} setFilter={setFilter} options={['All', 'Active', 'Inactive']} styles={styles} />
    <StandbyNotice styles={styles} text="Terminal editing and map pin updates are planned after the group registry workflow." />
    {loading ? <LoadingRows styles={styles} /> : terminals.length ? <View style={styles.listRows}>{terminals.map((terminal) => <View key={terminal.id} style={styles.dataRow}><View style={styles.rowLeading}><View style={styles.rowIcon}><MaterialIcon name="terminals" size={18} color={styles.colors.green} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{terminal.name}</Text><Text style={styles.rowSub}>{terminal.barangay}, {terminal.municipality}</Text></View></View><View style={styles.rowSecondary}><Text style={styles.rowMetaLabel}>RESPONSIBLE GROUP</Text><Text style={styles.rowMeta}>{groups.get(terminal.group_id)?.name ?? 'Group unavailable'}</Text></View><StatusPill label={terminal.is_active ? 'Active' : 'Inactive'} tone={terminal.is_active ? 'green' : 'neutral'} styles={styles} /></View>)}</View> : <EmptyState title="No terminals registered" body="Terminals will appear here once operator groups add their verified locations." styles={styles} />}
  </Card>;
}

function VehiclesPanel({ vehicles, terminals, groups, users, loading, filter, setFilter, styles }: {
  vehicles: Vehicle[]; terminals: Map<string, Terminal>; groups: Map<string, Group>; users: Map<string, DirectoryUser>; loading: boolean; filter: string; setFilter: (value: string) => void; styles: ReturnType<typeof createStyles>;
}) {
  return <Card style={styles.listCard}><ListToolbar title="Vehicle registry" count={vehicles.length} filter={filter} setFilter={setFilter} options={['All', 'Jeepney', 'Tricycle', 'On trip']} styles={styles} />
    <StandbyNotice styles={styles} text="Roster edits, driver assignment, and terminal moves will be connected in the operational console milestone." />
    {loading ? <LoadingRows styles={styles} /> : vehicles.length ? <View style={styles.listRows}>{vehicles.map((vehicle) => {
      const terminal = terminals.get(vehicle.terminal_id);
      const group = terminal ? groups.get(terminal.group_id) : undefined;
      const driver = vehicle.assigned_driver_id ? users.get(vehicle.assigned_driver_id) : undefined;
      return <View key={vehicle.id} style={styles.dataRow}><View style={styles.rowLeading}><View style={[styles.rowIcon, vehicle.vehicle_type === 'tricycle' && styles.orangeIcon]}><MaterialIcon name="liveTrips" size={18} color={vehicle.vehicle_type === 'tricycle' ? styles.colors.orangeDark : styles.colors.green} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{vehicle.body_number}</Text><Text style={styles.rowSub}>{vehicle.vehicle_type === 'tricycle' ? 'Tricycle' : 'Jeepney'}{vehicle.plate_number ? ` · ${vehicle.plate_number}` : ''}</Text></View></View><View style={styles.rowSecondary}><Text style={styles.rowMetaLabel}>TERMINAL · DRIVER</Text><Text style={styles.rowMeta}>{terminal?.name ?? 'Unassigned terminal'} · {driver?.display_name ?? 'No driver'}</Text><Text style={styles.rowSub}>{group?.name ?? 'No group assigned'}</Text></View><StatusPill label={vehicle.status.replaceAll('_', ' ')} tone={vehicle.status === 'on_route' ? 'green' : vehicle.status === 'maintenance' ? 'orange' : 'neutral'} styles={styles} /></View>;
    })}</View> : <EmptyState title="No vehicles registered" body="Vehicle records will appear here after a group adds its roster." styles={styles} />}
  </Card>;
}

function UsersPanel({ users, loading, filter, setFilter, choices, setChoices, saving, saveRole, styles }: {
  users: DirectoryUser[]; loading: boolean; filter: string; setFilter: (value: string) => void; choices: Record<string, AccountRole>; setChoices: (update: (current: Record<string, AccountRole>) => Record<string, AccountRole>) => void; saving: string | null; saveRole: (user: DirectoryUser) => Promise<void>; styles: ReturnType<typeof createStyles>;
}) {
  return <Card style={styles.listCard}><ListToolbar title="User access" count={users.length} filter={filter} setFilter={setFilter} options={['All', ...accountRoles.map((role) => roles[role])]} styles={styles} />
    <Text style={styles.panelSubtitle}>Showing the latest 50 accounts. New sign-ins begin with commuter access. Driver and chairperson roles still need a group assignment.</Text>
    {loading ? <LoadingRows styles={styles} /> : users.length ? <View style={styles.listRows}>{users.map((user) => <View key={user.id} style={styles.userRow}><View style={styles.rowLeading}><View style={styles.userAvatar}><Text style={styles.userAvatarText}>{initials(user.display_name || user.email)}</Text></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{user.display_name || 'Unnamed account'}</Text><Text style={styles.rowSub}>{user.email}</Text></View></View><View style={styles.userRoleOptions}>{accountRoles.map((role) => {
      const selected = (choices[user.id] ?? user.role) === role;
      return <Pressable key={role} accessibilityRole="button" accessibilityLabel={`${roles[role]} role for ${user.email}`} accessibilityState={{ selected }} disabled={saving !== null} onPress={() => setChoices((current) => ({ ...current, [user.id]: role }))} style={[styles.roleOption, selected && styles.roleSelected]}><Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>{roles[role]}</Text></Pressable>;
    })}</View>{choices[user.id] && choices[user.id] !== user.role && <Button label="Save" onPress={() => void saveRole(user)} loading={saving === user.id} disabled={saving !== null && saving !== user.id} style={styles.saveRoleButton} />}</View>)}</View> : <EmptyState title="No accounts found" body="Accounts appear here after someone signs in with Google or email." styles={styles} />}
  </Card>;
}

function ReportsPanel({ data, loading, styles }: { data: PanelData; loading: boolean; styles: ReturnType<typeof createStyles> }) {
  const groupsInTown = (town: string) => data.groups.filter((group) => group.municipality === town).length;
  const maxGroups = Math.max(1, ...municipalities.map(groupsInTown));
  const jeepney = data.groups.filter((group) => group.kind === 'jeepney').length;
  const toda = data.groups.filter((group) => group.kind === 'toda').length;
  const maxKind = Math.max(1, jeepney, toda);
  return <View style={styles.reportGrid}>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Group coverage</Text><Text style={styles.panelSubtitle}>Registered transport groups by municipality</Text>{municipalities.map((town) => <ReportBar key={town} label={town} value={groupsInTown(town)} max={maxGroups} loading={loading} styles={styles} />)}</Card>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Transport mix</Text><Text style={styles.panelSubtitle}>Groups by operator type</Text><ReportBar label="Jeepney" value={jeepney} max={maxKind} loading={loading} styles={styles} tone="green" /><ReportBar label="TODA" value={toda} max={maxKind} loading={loading} styles={styles} tone="orange" /><View style={styles.reportDivider} /><Text style={styles.reportFact}><Text style={styles.reportFactNumber}>{loading ? '—' : data.counts.routes}</Text> active routes</Text><Text style={styles.reportFact}><Text style={styles.reportFactNumber}>{loading ? '—' : data.counts.approved}</Text> approved drivers</Text></Card>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Registry summary</Text><Text style={styles.panelSubtitle}>Live counts from Supabase</Text>{[
      ['Groups', data.counts.groups], ['Terminals', data.counts.terminals], ['Vehicles', data.counts.vehicles], ['Drivers', data.counts.drivers], ['Pending applications', data.counts.pending],
    ].map(([label, value]) => <View key={label} style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{loading ? '—' : value}</Text></View>)}</Card>
  </View>;
}

function ReportBar({ label, value, max, loading, styles, tone = 'green' }: { label: string; value: number; max: number; loading: boolean; styles: ReturnType<typeof createStyles>; tone?: 'green' | 'orange' }) {
  return <View style={styles.reportBarRow}><View style={styles.reportBarHeader}><Text style={styles.coverageName}>{label}</Text><Text style={styles.coverageCount}>{loading ? '—' : value}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, tone === 'orange' && styles.barFillOrange, { width: `${(value / max) * 100}%` }]} /></View></View>;
}

function AuditPanel({ events, users, loading, styles }: { events: AuditEvent[]; users: Map<string, DirectoryUser>; loading: boolean; styles: ReturnType<typeof createStyles> }) {
  return <Card style={styles.listCard}><View style={styles.auditHeading}><View><Text style={styles.panelTitle}>Privileged activity</Text><Text style={styles.panelSubtitle}>Append only records from super admin and chairperson changes</Text></View><StatusPill label="Protected log" tone="green" styles={styles} /></View>
    {loading ? <LoadingRows styles={styles} /> : events.length ? <View style={styles.listRows}>{events.map((event) => <ActivityRow key={event.id} event={event} actor={event.actor_id ? users.get(event.actor_id)?.display_name || users.get(event.actor_id)?.email || 'Account' : 'System'} styles={styles} detailed />)}</View> : <EmptyState title="No activity recorded yet" body="Role changes and group operations will appear here with their actor and timestamp." styles={styles} />}
  </Card>;
}

function ActivityRow({ event, actor, styles, detailed = false }: { event: AuditEvent; actor?: string; styles: ReturnType<typeof createStyles>; detailed?: boolean }) {
  return <View style={styles.activityRow}><View style={styles.activityMark}><MaterialIcon name="history" size={15} color={styles.colors.green} /></View><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.action.replaceAll('_', ' ')} <Text style={styles.activityTable}>· {event.table_name.replaceAll('_', ' ')}</Text></Text><Text style={styles.activityMeta}>{actor ?? 'Administrator'} · {shortDate(event.created_at)}{detailed && event.record_id ? ` · Record ${event.record_id.slice(0, 8)}` : ''}</Text></View></View>;
}

function ListToolbar({ title, count, filter, setFilter, options, styles }: { title: string; count: number; filter: string; setFilter: (value: string) => void; options: string[]; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.listToolbar}><View><Text style={styles.panelTitle}>{title}</Text><Text style={styles.panelSubtitle}>{count} record{count === 1 ? '' : 's'} shown</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{options.map((option) => <Chip key={option} label={option} selected={filter === option} onPress={() => setFilter(option)} />)}</ScrollView></View>;
}

function StandbyNotice({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.standbyNotice}><MaterialIcon name="info" size={16} color={styles.colors.blue} /><Text style={styles.standbyText}>{text}</Text></View>;
}

function StatusPill({ label, tone, styles }: { label: string; tone: 'green' | 'orange' | 'neutral'; styles: ReturnType<typeof createStyles> }) {
  return <View style={[styles.statusPill, tone === 'orange' ? styles.statusOrange : tone === 'neutral' ? styles.statusNeutral : styles.statusGreen]}><Text style={[styles.statusText, tone === 'orange' ? styles.statusTextOrange : tone === 'neutral' ? styles.statusTextNeutral : styles.statusTextGreen]}>{label}</Text></View>;
}

function EmptyState({ title, body, styles }: { title: string; body: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><MaterialIcon name="search" size={22} color={styles.colors.muted} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

function LoadingRows({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.loadingRows}><ActivityIndicator color={styles.colors.green} /><Text style={styles.panelSubtitle}>Loading verified records…</Text></View>;
}

function createStyles(colors: ThemeColors, wide: boolean) {
  return { colors, wide, ...StyleSheet.create({
    shell: { flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.canvas },
    sidebar: { width: 264, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 18, backgroundColor: colors.card, borderRightWidth: 1, borderColor: colors.line },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: 38 },
    brandMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    brandMarkText: { color: colors.lime, fontSize: 25, lineHeight: 29, fontWeight: '900' }, brand: { color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 0.4 },
    sidebarEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.35 }, sidebarCaption: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 7, marginBottom: 19, paddingHorizontal: 10 },
    navList: { gap: 4 }, navItem: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }, navSelected: { backgroundColor: colors.greenLight },
    navLabel: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '600' }, navLabelSelected: { color: colors.greenDark, fontWeight: '800' }, navIndicator: { width: 5, height: 5, borderRadius: 4, backgroundColor: colors.green },
    sidebarBottom: { marginTop: 'auto', gap: 12, paddingTop: 22 }, sidebarAccount: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16, marginBottom: 4 },
    avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight }, avatarText: { color: colors.greenDark, fontWeight: '800', fontSize: 11 },
    accountCopy: { flex: 1 }, accountName: { color: colors.ink, fontSize: 11, fontWeight: '700' }, accountRole: { color: colors.muted, fontSize: 10, marginTop: 3 },
    signOut: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }, signOutText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    main: { flex: 1, minWidth: 0 }, topbar: { minHeight: 72, paddingHorizontal: wide ? 34 : 18, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, topbarCompact: { minHeight: 60, paddingHorizontal: 12, gap: 8 },
    breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 9 }, breadcrumbMuted: { color: colors.muted, fontSize: 12 }, breadcrumbSlash: { color: colors.disabled, fontSize: 12 }, breadcrumbCurrent: { color: colors.ink, fontWeight: '700', fontSize: 12 },
    topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, searchBox: { height: 38, minWidth: wide ? 240 : 150, maxWidth: 320, flex: wide ? 0 : 1, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.canvas, flexDirection: 'row', alignItems: 'center', gap: 8 }, searchBoxCompact: { minWidth: 112, maxWidth: 180, flex: 1, paddingHorizontal: 8 },
    searchInput: { flex: 1, padding: 0, color: colors.ink, fontSize: 12, outlineStyle: 'none' as never }, refreshButton: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    topAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }, scroll: { flex: 1 }, content: { width: '100%', maxWidth: 1440, alignSelf: 'center', paddingHorizontal: wide ? 34 : 18, paddingTop: 28, paddingBottom: 40, gap: 18 },
    pageHeader: { flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 2 }, pageHeading: { flex: 1 }, eyebrow: { color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.35 },
    pageTitle: { color: colors.ink, fontSize: wide ? 28 : 24, lineHeight: wide ? 36 : 31, fontWeight: '800', marginTop: 6 }, pageIntro: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5, maxWidth: 720 },
    hero: { minHeight: 178, overflow: 'hidden', borderRadius: 20, paddingHorizontal: wide ? 28 : 22, paddingVertical: 24, backgroundColor: '#155D42', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroContent: { flex: 1, maxWidth: 600 }, heroKicker: { flexDirection: 'row', alignItems: 'center', gap: 8 }, heroDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lime }, heroKickerText: { color: '#D3E9D9', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
    heroTitle: { color: '#FFFFFF', fontSize: wide ? 23 : 20, fontWeight: '800', marginTop: 13 }, heroCopy: { color: '#D7E8DE', fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 510 }, heroLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15 }, heroLinkText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, heroIconWrap: { width: wide ? 126 : 72, height: wide ? 126 : 72, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metricsCompact: { gap: 9 }, metricCard: { flex: 1, minWidth: wide ? 175 : 145, padding: 16, gap: 2 }, metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, metricIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }, metricArrow: { color: colors.muted, fontSize: 14 }, metricValue: { color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '800' }, metricLabel: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 2 }, metricNote: { color: colors.muted, fontSize: 10, marginTop: 4 },
    dashboardColumns: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' }, dashboardColumnsCompact: { flexDirection: 'column' }, coverageCard: { flex: 1.15, minWidth: 0, padding: 19 }, overviewAside: { flex: 0.85, minWidth: wide ? 300 : undefined, gap: 14 }, actionsCard: { padding: 18 }, activityCard: { padding: 18 }, panelHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 15 }, panelTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, panelSubtitle: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 }, panelAction: { color: colors.greenDark, fontSize: 10, fontWeight: '800', paddingTop: 2 },
    coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 15 }, coverageTown: { width: 116 }, coverageName: { color: colors.ink, fontSize: 11, fontWeight: '700' }, coverageCount: { color: colors.muted, fontSize: 9, marginTop: 4 }, barTrack: { flex: 1, height: 7, borderRadius: 5, backgroundColor: colors.greenLight, overflow: 'hidden' }, barFill: { height: '100%', borderRadius: 5, backgroundColor: colors.green }, barFillOrange: { backgroundColor: colors.orange }, emptyCaption: { color: colors.muted, fontSize: 10, marginTop: 16, lineHeight: 16 },
    quickLink: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 11, paddingTop: 10 }, quickIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }, quickCopy: { flex: 1 }, quickTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, quickDetail: { color: colors.muted, fontSize: 9, marginTop: 3 },
    activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line }, activityMark: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }, activityCopy: { flex: 1 }, activityTitle: { color: colors.ink, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }, activityTable: { color: colors.muted, fontWeight: '500' }, activityMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
    listCard: { padding: wide ? 20 : 14 }, listToolbar: { flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', justifyContent: 'space-between', gap: 13, marginBottom: 16 }, filterRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, standbyNotice: { padding: 11, borderRadius: 11, backgroundColor: colors.blueLight, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }, standbyText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 16 },
    listRows: { borderTopWidth: 1, borderTopColor: colors.line }, dataRow: { minHeight: 76, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 12, justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }, rowLeading: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, minWidth: 180 }, rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight }, greenIcon: { backgroundColor: colors.greenLight }, orangeIcon: { backgroundColor: colors.orangeLight }, rowMain: { flex: 1 }, rowTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' }, rowSub: { color: colors.muted, fontSize: 9, marginTop: 4 }, rowSecondary: { flex: 1, minWidth: 150 }, rowMetaLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, rowMeta: { color: colors.ink, fontSize: 10, fontWeight: '600', marginTop: 5 },
    statusPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, statusGreen: { backgroundColor: colors.greenLight }, statusOrange: { backgroundColor: colors.orangeLight }, statusNeutral: { backgroundColor: colors.chipBg }, statusText: { fontSize: 9, fontWeight: '800', textTransform: 'capitalize' }, statusTextGreen: { color: colors.greenDark }, statusTextOrange: { color: colors.orangeDark }, statusTextNeutral: { color: colors.muted },
    userRow: { minHeight: 88, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', justifyContent: 'space-between', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }, userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight }, userAvatarText: { color: colors.greenDark, fontSize: 10, fontWeight: '800' }, userRoleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: wide ? 0 : 1 }, roleOption: { borderRadius: 9, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 7 }, roleSelected: { borderColor: colors.green, backgroundColor: colors.greenLight }, roleOptionText: { color: colors.muted, fontSize: 8, fontWeight: '700' }, roleOptionTextSelected: { color: colors.greenDark }, saveRoleButton: { minWidth: 70, paddingVertical: 9, paddingHorizontal: 12 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 42, paddingHorizontal: 22 }, emptyIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' }, emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'center', maxWidth: 350, marginTop: 6 }, loadingRows: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 9 },
    reportGrid: { flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', alignItems: 'flex-start', gap: 14 }, reportCard: { flex: 1, minWidth: wide ? 260 : undefined, padding: 19 }, reportBarRow: { marginTop: 17 }, reportBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, reportDivider: { height: 1, backgroundColor: colors.line, marginVertical: 15 }, reportFact: { color: colors.muted, fontSize: 10, marginTop: 7 }, reportFactNumber: { color: colors.ink, fontWeight: '800' }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }, summaryLabel: { color: colors.muted, fontSize: 10 }, summaryValue: { color: colors.ink, fontSize: 11, fontWeight: '800' }, auditHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
    footerNote: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: 5 }, mobileHeader: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 12 }, mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 13 }, mobileNav: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingBottom: 10 }, mobileNavItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 }, mobileNavSelected: { backgroundColor: colors.greenLight }, mobileNavLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, mobileActions: { paddingHorizontal: 18, paddingTop: 11, backgroundColor: colors.card }, iconButton: { position: 'absolute', right: 17, top: 14, zIndex: 2, width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  }) };
}
