import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { MaterialIcon } from '../components/MaterialIcon';
import { AdminChairpersonApproval, AdminGroupEditor, AdminRecordInspector, AdminRoleConfirmation, AdminTerminalEditor, type AdminGroupInput, type AdminTerminalInput } from '../components/admin/AdminPanels';
import { Button, Card, ErrorBanner } from '../components/ui';
import { geocodeTerminalAddress } from '../lib/geocoding';
import { type AccountRole, type AccountSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { useColors, useThemeStyles } from '../lib/theme';
import type { AdminGroup as Group, AdminTerminal as Terminal, AdminUser as DirectoryUser, AdminPanelData as PanelData } from '../types/admin';
import { AuditPanel } from './admin/AuditPanel';
import { GroupsPanel } from './admin/GroupsPanel';
import { OverviewPanel } from './admin/OverviewPanel';
import { ReportsPanel } from './admin/ReportsPanel';
import { TerminalsPanel } from './admin/TerminalsPanel';
import { UsersPanel } from './admin/UsersPanel';
import { VehiclesPanel } from './admin/VehiclesPanel';
import { EMAIL_RE, initialData, roles, sectionDescription, sections } from './admin/data';
import { errorMessage, initials, loadPanelData, shortDate } from './admin/api';
import { createStyles } from './admin/styles';
import type { Inspector, Section } from './admin/types';
import { EmptyState, NavigationItem } from './admin/ui';

export function SuperAdminWorkspaceScreen({ account, onLogout, onRefreshSession }: {
  account: AccountSession; onLogout: () => void; onRefreshSession: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const compact = width < 520;
  const styles = useThemeStyles((colors) => createStyles(colors, wide));
  const colors = useColors();
  const [section, setSection] = useState<Section>('overview');
  const [data, setData] = useState<PanelData>(initialData);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inspector, setInspector] = useState<Inspector | null>(null);
  const [confirmUser, setConfirmUser] = useState<DirectoryUser | null>(null);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [choices, setChoices] = useState<Record<string, AccountRole>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [chairEmail, setChairEmail] = useState('');
  const [chairEmailError, setChairEmailError] = useState<string | null>(null);
  const [confirmChair, setConfirmChair] = useState<string | null>(null);
  const [approvingChair, setApprovingChair] = useState(false);
  const [terminalEditor, setTerminalEditor] = useState<Terminal | null | undefined>(undefined);
  const [savingTerminal, setSavingTerminal] = useState(false);
  const [groupEditor, setGroupEditor] = useState<Group | null | undefined>(undefined);
  const [savingGroup, setSavingGroup] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void loadPanelData().then((next) => { if (active) { setData(next); setLoaded(true); setUpdatedAt(new Date().toISOString()); } })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account.id, revision]);

  const selectedSection = sections.find((item) => item.id === section) ?? sections[0];
  const matching = (text: string) => text.toLowerCase().includes(search.trim().toLowerCase());
  const groupById = useMemo(() => new Map(data.groups.map((group) => [group.id, group])), [data.groups]);
  const terminalById = useMemo(() => new Map(data.terminals.map((terminal) => [terminal.id, terminal])), [data.terminals]);
  const userById = useMemo(() => new Map([...data.users, ...data.chairpersons].map((user) => [user.id, user])), [data.users, data.chairpersons]);

  const groups = data.groups.filter((group) => {
    const status = filter === 'Active' ? group.is_active : filter === 'Inactive' ? !group.is_active : true;
    const chairperson = group.chairperson_id ? userById.get(group.chairperson_id) : undefined;
    return status && matching(`${group.name} ${group.kind} ${group.municipality} ${chairperson?.display_name ?? ''} ${chairperson?.email ?? ''}`);
  });
  const terminals = data.terminals.filter((terminal) => {
    const group = groupById.get(terminal.group_id);
    const status = filter === 'Active' ? terminal.is_active : filter === 'Inactive' ? !terminal.is_active : true;
    return status && matching(`${terminal.name} ${terminal.barangay} ${terminal.municipality} ${terminal.address ?? ''} ${terminal.contact_phone ?? ''} ${group?.name ?? ''}`);
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
  const audit = data.audit.filter((event) => matching(`${event.action} ${event.table_name} ${event.record_id ?? ''} ${event.actor_id ? userById.get(event.actor_id)?.display_name ?? '' : 'System'}`));
  const searchable = ['groups', 'terminals', 'vehicles', 'users', 'audit'].includes(section);

  const changeSection = (next: Section) => { setSection(next); setSearch(''); setFilter('All'); setChairEmail(''); setChairEmailError(null); };
  const saveRole = async (user: DirectoryUser) => {
    const nextRole = choices[user.id];
    if (!nextRole || !supabase) return;
    setSaving(user.id); setActionError(null);
    try {
      const result = await supabase.rpc('set_user_role', { target_user: user.id, next_role: nextRole });
      if (result.error) throw result.error;
      setRevision((value) => value + 1);
      if (user.id === account.id) onRefreshSession();
      setChoices((current) => { const next = { ...current }; delete next[user.id]; return next; });
      setConfirmUser(null); setNotice('Account role updated.');
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally { setSaving(null); }
  };

  const submitChairApproval = () => {
    const email = chairEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { setChairEmailError('Enter a valid email address.'); return; }
    setChairEmailError(null); setActionError(null); setConfirmChair(email);
  };

  const approveChair = async (email: string) => {
    if (!supabase) return;
    setApprovingChair(true); setActionError(null);
    try {
      const result = await supabase.rpc('approve_chairperson', { target_email: email });
      if (result.error) throw result.error;
      setRevision((value) => value + 1);
      setConfirmChair(null); setChairEmail('');
      setNotice('Chairperson access approved.');
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally { setApprovingChair(false); }
  };

  const saveTerminal = async (input: AdminTerminalInput) => {
    if (!supabase) { setActionError('Database insert unavailable: Supabase is not configured.'); return; }
    const isEditing = Boolean(terminalEditor);
    let failureStage = 'Address geocoding';
    setSavingTerminal(true); setActionError(null); setNotice(null);
    try {
      const address = input.address.trim().replace(/\s+/g, ' ');
      const normalize = (value: string | null | undefined) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
      const locationChanged = !terminalEditor
        || normalize(address) !== normalize(terminalEditor.address)
        || normalize(input.barangay) !== normalize(terminalEditor.barangay)
        || input.municipality !== terminalEditor.municipality
        || terminalEditor.latitude === null
        || terminalEditor.longitude === null;
      const geocoded = locationChanged
        ? await geocodeTerminalAddress({ name: input.name, address, barangay: input.barangay, municipality: input.municipality })
        : null;
      const latitude = geocoded?.latitude ?? terminalEditor?.latitude;
      const longitude = geocoded?.longitude ?? terminalEditor?.longitude;
      if (latitude == null || longitude == null) throw new Error('The terminal address needs a successful location lookup before it can be saved.');
      const values = {
        ...input,
        name: input.name.trim(),
        barangay: input.barangay.trim(),
        address,
        contact_phone: input.contact_phone?.trim() || null,
        latitude,
        longitude,
      };
      failureStage = terminalEditor ? 'Database terminal update' : 'Database terminal insert';
      if (terminalEditor) {
        const result = await supabase.from('terminals').update(values).eq('id', terminalEditor.id).select('id').maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Terminal not found or you no longer have permission to update it.');
      } else {
        const result = await supabase.from('terminals').insert(values).select('id').single();
        if (result.error) throw result.error;
      }
      setTerminalEditor(undefined);
      setNotice(`${isEditing ? 'Terminal saved successfully.' : 'Terminal added successfully.'}${geocoded ? ` Address matched: ${geocoded.displayName}.` : ''}`);
      setRevision((value) => value + 1);
    } catch (cause) {
      setActionError(`${failureStage} failed.\n${errorMessage(cause)}`);
    } finally { setSavingTerminal(false); }
  };

  const saveGroup = async (input: AdminGroupInput) => {
    if (!supabase) { setActionError('Supabase is not configured.'); return; }
    const isEditing = Boolean(groupEditor);
    setSavingGroup(true); setActionError(null); setNotice(null);
    try {
      if (groupEditor) {
        const result = await supabase.from('groups').update(input).eq('id', groupEditor.id).select('id').maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Group not found or you no longer have permission to update it.');
      } else {
        const result = await supabase.from('groups').insert(input).select('id').single();
        if (result.error) throw result.error;
      }
      setGroupEditor(undefined);
      setNotice(isEditing ? 'Transport group saved successfully.' : 'Transport group created successfully.');
      setRevision((value) => value + 1);
    } catch (cause) {
      setActionError(`Could not save transport group. ${errorMessage(cause)}`);
    } finally { setSavingGroup(false); }
  };

  const openGroup = (group: Group) => setInspector({
    title: group.name,
    subtitle: `${group.kind === 'toda' ? 'TODA / Tricycle' : 'Jeepney'} · ${group.municipality}`,
    rows: [
      { label: 'Status', value: group.is_active ? 'Active' : 'Inactive' },
      { label: 'Chairperson', value: group.chairperson_id ? userById.get(group.chairperson_id)?.display_name || userById.get(group.chairperson_id)?.email || 'Assigned account' : 'Not assigned' },
      { label: 'Terminals', value: String(data.terminals.filter((terminal) => terminal.group_id === group.id).length) },
      { label: 'Vehicles', value: String(data.vehicles.filter((vehicle) => data.terminals.some((terminal) => terminal.id === vehicle.terminal_id && terminal.group_id === group.id)).length) },
      { label: 'Drivers', value: String(data.drivers.filter((driver) => driver.group_id === group.id).length) },
      { label: 'Group ID', value: group.id },
    ],
    editLabel: 'Edit group',
    onEdit: () => { setInspector(null); setActionError(null); setNotice(null); setGroupEditor(group); },
  });

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
            <Pressable accessibilityRole="button" onPress={onLogout} style={styles.signOut}><MaterialIcon name="logout" size={17} color={colors.muted} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.mobileHeader}>
          <View style={styles.mobileBrand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View><View><Text style={styles.brand}>eGABAY Admin</Text><Text style={styles.sidebarEyebrow}>SUPER ADMIN</Text></View></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={onLogout} style={styles.iconButton}><MaterialIcon name="logout" size={19} color={colors.ink} /></Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>{sections.map((item) => <NavigationItem key={item.id} item={item} selected={section === item.id} onPress={() => changeSection(item.id)} styles={styles} colors={colors} compact />)}</ScrollView>
        </View>
      )}

      <View style={styles.main}>
        <View style={[styles.topbar, compact && styles.topbarCompact]}>
          <View style={styles.breadcrumb}>{compact ? <Text style={styles.breadcrumbCurrent}>{selectedSection.label}</Text> : <><Text style={styles.breadcrumbMuted}>eGABAY</Text><Text style={styles.breadcrumbSlash}>/</Text><Text style={styles.breadcrumbCurrent}>{selectedSection.label}</Text></>}</View>
          <View style={styles.topbarActions}>
            {searchable && <View style={[styles.searchBox, compact && styles.searchBoxCompact]}><MaterialIcon name="search" size={18} color={colors.muted} /><TextInput accessibilityLabel={`Search ${selectedSection.label.toLowerCase()}`} value={search} onChangeText={setSearch} placeholder={compact ? 'Search' : `Search ${selectedSection.label.toLowerCase()}`} placeholderTextColor={colors.muted} style={styles.searchInput} /></View>}
            <Pressable accessibilityRole="button" accessibilityLabel="Refresh dashboard" accessibilityState={{ disabled: loading }} disabled={loading} onPress={() => { setRevision((value) => value + 1); setNotice(null); }} style={styles.refreshButton}>
              {loading ? <ActivityIndicator size="small" color={colors.green} /> : <MaterialIcon name="refresh" size={19} color={colors.ink} />}
            </Pressable>
            {!compact && <View style={styles.topAvatar}><Text style={styles.avatarText}>{initials(account.name)}</Text></View>}
          </View>
        </View>

        {notice && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.successNotice}><Text style={styles.successText}>{notice}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => setNotice(null)} style={styles.dismissNotice}><Text style={styles.panelAction}>Dismiss</Text></Pressable></View>}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeading}><Text style={styles.eyebrow}>MARINDUQUE TRANSPORT REGISTRY</Text><Text style={styles.pageTitle}>{section === 'overview' ? 'Network overview' : selectedSection.label}</Text><Text style={styles.pageIntro}>{sectionDescription[section]}</Text>{updatedAt && <Text style={styles.updatedAt}>{`Updated ${shortDate(updatedAt)}`}</Text>}</View>
            {section === 'groups' && <Button label="Add transport group" onPress={() => { setActionError(null); setNotice(null); setGroupEditor(null); }} disabled={loading} />}
            {section === 'terminals' && <Button label="Add terminal" onPress={() => { setActionError(null); setNotice(null); setTerminalEditor(null); }} disabled={loading || !data.groups.some((group) => group.is_active)} />}
          </View>
          {error && <ErrorBanner message={error} />}
          {error && !loaded ? <Card><EmptyState title="Registry data is unavailable" body="We could not load the records. Check your connection and try again." styles={styles} /><Button label="Try again" onPress={() => setRevision((value) => value + 1)} loading={loading} /></Card> : <>
          {section === 'overview' && <OverviewPanel data={data} users={userById} loading={loading} styles={styles} onNavigate={changeSection} />}
          {section === 'groups' && <GroupsPanel groups={groups} loading={loading} filter={filter} setFilter={setFilter} styles={styles} users={data.chairpersons} onOpen={openGroup} />}
          {section === 'terminals' && <TerminalsPanel terminals={terminals} groups={groupById} loading={loading} filter={filter} setFilter={setFilter} styles={styles} canAdd={data.groups.some((group) => group.is_active)} onOpen={(terminal) => setInspector({
            title: terminal.name,
            subtitle: 'Terminal record',
            rows: [
              { label: 'Responsible group', value: groupById.get(terminal.group_id)?.name ?? 'Unavailable' },
              { label: 'Municipality', value: terminal.municipality },
              { label: 'Barangay', value: terminal.barangay },
              { label: 'Street address or landmark', value: terminal.address || 'Not recorded' },
              { label: 'Contact phone', value: terminal.contact_phone || 'Not recorded' },
              { label: 'Map coordinates', value: terminal.latitude !== null && terminal.longitude !== null ? `${terminal.latitude}, ${terminal.longitude}` : 'Not recorded · map pin unavailable' },
              { label: 'Status', value: terminal.is_active ? 'Active' : 'Inactive' },
              { label: 'Registered vehicles', value: String(data.vehicles.filter((vehicle) => vehicle.terminal_id === terminal.id).length) },
            ],
            editLabel: 'Edit terminal',
            onEdit: () => { setInspector(null); setActionError(null); setNotice(null); setTerminalEditor(terminal); },
          })} />}
          {section === 'vehicles' && <VehiclesPanel vehicles={vehicles} terminals={terminalById} groups={groupById} users={userById} loading={loading} filter={filter} setFilter={setFilter} styles={styles} onOpen={(vehicle) => setInspector({ title: vehicle.body_number, subtitle: 'Vehicle record', rows: [{ label: 'Plate number', value: vehicle.plate_number ?? 'Not recorded' }, { label: 'Transport type', value: vehicle.vehicle_type }, { label: 'Terminal', value: terminalById.get(vehicle.terminal_id)?.name ?? 'Unavailable' }, { label: 'Assigned driver', value: vehicle.assigned_driver_id ? userById.get(vehicle.assigned_driver_id)?.display_name ?? 'Assigned account' : 'Not assigned' }, { label: 'Status', value: vehicle.status.replaceAll('_', ' ') }] })} />}
          {section === 'users' && <UsersPanel users={users} loading={loading} filter={filter} setFilter={setFilter} choices={choices} setChoices={setChoices} saving={saving} saveRole={async (user) => { setActionError(null); setConfirmUser(user); }} chairEmail={chairEmail} chairEmailError={chairEmailError} onChairEmail={(value) => { setChairEmail(value); setChairEmailError(null); }} onApproveChair={submitChairApproval} approvingChair={approvingChair} styles={styles} />}
          {section === 'reports' && <ReportsPanel data={data} loading={loading} styles={styles} />}
          {section === 'audit' && <AuditPanel events={audit} users={userById} loading={loading} styles={styles} onOpen={(event) => setInspector({ title: `${event.action} · ${event.table_name}`, subtitle: 'Recorded activity', rows: [{ label: 'Actor', value: event.actor_id ? userById.get(event.actor_id)?.display_name ?? 'Account' : 'System' }, { label: 'Recorded at', value: shortDate(event.created_at) }, { label: 'Record ID', value: event.record_id ?? 'Not recorded' }], detail: JSON.stringify(event.detail, null, 2) })} />}
          </>}
          <Text style={styles.footerNote}>Transport registry · Marinduque, Philippines</Text>
        </ScrollView>
      </View>
      {inspector && <AdminRecordInspector {...inspector} onClose={() => setInspector(null)} />}
      {groupEditor !== undefined && <AdminGroupEditor key={groupEditor?.id ?? 'new-group'} group={groupEditor} groups={data.groups} chairpersons={data.chairpersons} saving={savingGroup} error={actionError} onClose={() => { if (!savingGroup) { setGroupEditor(undefined); setActionError(null); } }} onSave={(input) => void saveGroup(input)} />}
      {terminalEditor !== undefined && <AdminTerminalEditor key={terminalEditor?.id ?? 'new-terminal'} groups={data.groups} terminal={terminalEditor} saving={savingTerminal} error={actionError} onClose={() => { if (!savingTerminal) { setTerminalEditor(undefined); setActionError(null); } }} onSave={(input) => void saveTerminal(input)} />}
      {confirmUser && choices[confirmUser.id] && <AdminRoleConfirmation user={confirmUser} nextRole={choices[confirmUser.id]} saving={saving !== null} error={actionError} onClose={() => setConfirmUser(null)} onConfirm={() => void saveRole(confirmUser)} />}
      {confirmChair && <AdminChairpersonApproval email={confirmChair} saving={approvingChair} error={actionError} onClose={() => setConfirmChair(null)} onConfirm={() => void approveChair(confirmChair)} />}
    </View>
  );
}
