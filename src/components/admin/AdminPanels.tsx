import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { AccountRole } from '../../lib/session';
import { useColors, useThemeStyles } from '../../lib/theme';
import type { ThemeColors } from '../../theme';
import type { AdminGroup, AdminTerminal, AdminUser } from '../../types/admin';
import { MaterialIcon } from '../MaterialIcon';
import { Button, Chip, ErrorBanner, TextField } from '../ui';

const roleLabels: Record<AccountRole, string> = { commuter: 'Commuter', driver: 'Driver', chairperson: 'Chairperson', super_admin: 'Super admin' };
const municipalities = ['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'];

function Panel({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const { width } = useWindowDimensions();
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.panel, width < 640 && styles.fullPanel]}>
        <View style={styles.header}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel="Close panel" onPress={onClose} style={styles.close}><MaterialIcon name="close" size={21} color={colors.ink} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function AdminRecordInspector({ title, subtitle, rows, detail, onClose, onEdit, editLabel = 'Edit record' }: {
  title: string; subtitle: string; rows: { label: string; value: string }[]; detail?: string; onClose: () => void; onEdit?: () => void; editLabel?: string;
}) {
  const styles = useThemeStyles(createStyles);
  return <Panel title={title} subtitle={subtitle} onClose={onClose} footer={<><Button label="Close" variant="secondary" onPress={onClose} />{onEdit && <Button label={editLabel} onPress={onEdit} />}</>}>
    {rows.map((row) => <View key={row.label} style={styles.detailRow}><Text style={styles.label}>{row.label}</Text><Text selectable style={styles.value}>{row.value}</Text></View>)}
    {detail && <View style={styles.stack}><Text style={styles.sectionTitle}>Recorded changes</Text><Text selectable style={styles.code}>{detail}</Text></View>}
  </Panel>;
}

export type AdminGroupInput = {
  name: string;
  kind: 'toda' | 'jeepney';
  municipality: string;
  chairperson_id: string | null;
  is_active: boolean;
};

export function AdminGroupEditor({ group, groups, chairpersons, saving, error, onClose, onSave }: {
  group: AdminGroup | null; groups: AdminGroup[]; chairpersons: AdminUser[]; saving: boolean; error: string | null; onClose: () => void; onSave: (input: AdminGroupInput) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [name, setName] = useState(group?.name ?? '');
  const [kind, setKind] = useState<'toda' | 'jeepney'>(group?.kind ?? 'toda');
  const [municipality, setMunicipality] = useState(group?.municipality ?? 'Boac');
  const [chairpersonId, setChairpersonId] = useState(group?.chairperson_id ?? '');
  const [chairpersonSearch, setChairpersonSearch] = useState('');
  const [active, setActive] = useState(group?.is_active ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const availableChairs = chairpersons.filter((user) => user.role === 'chairperson' && !groups.some((entry) => entry.id !== group?.id && entry.chairperson_id === user.id));
  const visibleChairs = availableChairs.filter((user) => `${user.display_name ?? ''} ${user.email}`.toLowerCase().includes(chairpersonSearch.trim().toLowerCase()));

  const save = () => {
    if (!name.trim()) { setValidationError('Enter the group name.'); return; }
    if (groups.some((entry) => entry.id !== group?.id && entry.kind === kind && entry.municipality === municipality && entry.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setValidationError('A group with this name, type, and municipality already exists.'); return;
    }
    if (chairpersonId && !availableChairs.some((user) => user.id === chairpersonId)) {
      setValidationError('Choose an available chairperson or leave this group unassigned.'); return;
    }
    setValidationError(null);
    onSave({ name: name.trim(), kind, municipality, chairperson_id: chairpersonId || null, is_active: active });
  };

  const saveLabel = !group ? (active ? 'Create group' : 'Create inactive group') : group.is_active && !active ? 'Deactivate group' : 'Save group';
  return <Panel title={group ? 'Edit transport group' : 'Add transport group'} subtitle="Groups organize terminals, vehicles, and one assigned chairperson." onClose={() => { if (!saving) onClose(); }} footer={<><Button label="Cancel" variant="secondary" disabled={saving} onPress={onClose} /><Button label={saveLabel} loading={saving} onPress={save} /></>}>
    <View style={styles.stack}>
      <TextField comfortable label="Group name" value={name} onChangeText={(value) => { setName(value); setValidationError(null); }} placeholder="e.g. Boac Central TODA" autoCapitalize="words" />
      <View style={styles.stack}><Text style={styles.sectionTitle}>Transport type</Text><View style={styles.choiceWrap}><Chip comfortable label="TODA / Tricycle" selected={kind === 'toda'} onPress={() => { setKind('toda'); setValidationError(null); }} /><Chip comfortable label="Jeepney" selected={kind === 'jeepney'} onPress={() => { setKind('jeepney'); setValidationError(null); }} /></View></View>
      <View style={styles.stack}><Text style={styles.sectionTitle}>Municipality</Text><View style={styles.choiceWrap}>{municipalities.map((town) => <Chip key={town} comfortable label={town} selected={municipality === town} onPress={() => { setMunicipality(town); setValidationError(null); }} />)}</View></View>
      <View style={styles.stack}>
        <View><Text style={styles.sectionTitle}>Chairperson</Text><Text style={styles.copy}>Only accounts with the Chairperson role can be assigned. Each chairperson can lead one group.</Text></View>
        <View style={styles.choiceWrap}><Chip comfortable label="Unassigned" selected={!chairpersonId} onPress={() => { setChairpersonId(''); setValidationError(null); }} /></View>
        {availableChairs.length ? <><TextField comfortable label="Search chairpersons" value={chairpersonSearch} onChangeText={setChairpersonSearch} placeholder="Name or email" autoCapitalize="none" />{visibleChairs.length ? <View style={styles.candidateList}>{visibleChairs.map((user) => {
          const selected = chairpersonId === user.id;
          return <Pressable key={user.id} accessibilityRole="button" accessibilityLabel={`Assign ${user.display_name || user.email} as chairperson`} accessibilityState={{ selected }} onPress={() => { setChairpersonId(user.id); setValidationError(null); }} style={[styles.candidateRow, selected && styles.candidateRowSelected]}>
            <View style={styles.candidateCopy}><Text style={styles.candidateName}>{user.display_name || 'Unnamed account'}</Text><Text style={styles.candidateEmail}>{user.email}</Text></View>
            {selected && <Text style={styles.candidateSelected}>Selected</Text>}
          </Pressable>;
        })}</View> : <Text style={styles.copy}>No chairperson matches that search.</Text>}</> : <Text style={styles.copy}>No unassigned chairperson accounts are available. Approve an account in Users & roles first.</Text>}
      </View>
      <View style={styles.stack}><Text style={styles.sectionTitle}>Group status</Text><View style={styles.choiceWrap}><Chip comfortable label="Active" selected={active} onPress={() => setActive(true)} /><Chip comfortable label="Inactive" selected={!active} onPress={() => setActive(false)} /></View></View>
      {group?.is_active && !active && <Text style={styles.warningCopy}>Deactivating hides this group and its terminals from public listings.</Text>}
      {validationError && <ErrorBanner message={validationError} />}
      {error && <ErrorBanner message={error} />}
    </View>
  </Panel>;
}

export type AdminTerminalInput = {
  group_id: string;
  name: string;
  municipality: string;
  barangay: string;
  address: string;
  contact_phone: string | null;
  is_active: boolean;
};

export function AdminTerminalEditor({ groups, terminal, saving, error, onClose, onSave }: {
  groups: AdminGroup[]; terminal: AdminTerminal | null; saving: boolean; error: string | null; onClose: () => void; onSave: (input: AdminTerminalInput) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const selectableGroups = groups.filter((group) => group.is_active || group.id === terminal?.group_id);
  const [groupId, setGroupId] = useState(terminal?.group_id ?? selectableGroups.find((group) => group.is_active)?.id ?? '');
  const [name, setName] = useState(terminal?.name ?? '');
  const [barangay, setBarangay] = useState(terminal?.barangay ?? '');
  const [address, setAddress] = useState(terminal?.address ?? '');
  const [contactPhone, setContactPhone] = useState(terminal?.contact_phone ?? '');
  const [active, setActive] = useState(terminal?.is_active ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const selectedGroup = selectableGroups.find((group) => group.id === groupId);

  const save = () => {
    if (!name.trim()) { setValidationError('Enter the terminal name.'); return; }
    if (!selectedGroup) { setValidationError('Choose an active transport group.'); return; }
    if (!barangay.trim()) { setValidationError('Enter the barangay where the terminal is located.'); return; }
    if (!address.trim()) { setValidationError('Enter a street address or recognizable landmark so its map location can be found.'); return; }
    setValidationError(null);
    onSave({
      group_id: selectedGroup.id,
      name: name.trim(),
      municipality: selectedGroup.municipality,
      barangay: barangay.trim(),
      address: address.trim(),
      contact_phone: contactPhone.trim() || null,
      is_active: active,
    });
  };

  return <Panel title={terminal ? 'Edit terminal' : 'Add terminal'} subtitle="Enter the address; its coordinates are found automatically when you save. Municipality follows the responsible transport group." onClose={() => { if (!saving) onClose(); }} footer={<><Button label="Cancel" variant="secondary" disabled={saving} onPress={onClose} /><Button label={terminal ? 'Save terminal' : 'Add terminal'} loading={saving} disabled={selectableGroups.length === 0} onPress={save} /></>}>
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>Responsible group</Text>
      {selectableGroups.length ? <View style={styles.choiceWrap}>{selectableGroups.map((group) => <Chip key={group.id} comfortable label={`${group.name} · ${group.kind === 'toda' ? 'TODA' : 'Jeepney'}`} selected={group.id === groupId} onPress={() => { setGroupId(group.id); setValidationError(null); }} />)}</View> : <Text style={styles.copy}>No active transport group is available. Add or activate a group before registering a terminal.</Text>}
      <View style={styles.readOnlyField}><Text style={styles.label}>Municipality</Text><Text style={styles.readOnlyValue}>{selectedGroup?.municipality ?? 'Choose a group'}</Text></View>
      <TextField comfortable label="Terminal name" value={name} onChangeText={(value) => { setName(value); setValidationError(null); }} placeholder="e.g. Boac Public Market Terminal" autoCapitalize="words" />
      <TextField comfortable label="Barangay" value={barangay} onChangeText={(value) => { setBarangay(value); setValidationError(null); }} placeholder="Terminal barangay" autoCapitalize="words" />
      <TextField comfortable label="Street address or landmark" value={address} onChangeText={setAddress} placeholder="Street, landmark, or local directions" />
      <TextField comfortable label="Terminal contact phone" value={contactPhone} onChangeText={setContactPhone} placeholder="Optional contact number" keyboardType="phone-pad" />
      <View style={styles.stack}>
        <Text style={styles.copy}>When you save, OpenStreetMap looks up the address once and the matching coordinates are stored for the map. © OpenStreetMap contributors. Use a public terminal address, not personal or confidential details.</Text>
      </View>
      <View style={styles.stack}><Text style={styles.sectionTitle}>Terminal status</Text><View style={styles.choiceWrap}><Chip comfortable label="Active" selected={active} onPress={() => setActive(true)} /><Chip comfortable label="Inactive" selected={!active} onPress={() => setActive(false)} /></View></View>
      {validationError && <ErrorBanner message={validationError} />}
      {error && <ErrorBanner message={error} />}
    </View>
  </Panel>;
}

export function AdminRoleConfirmation({ user, nextRole, saving, error, onClose, onConfirm }: {
  user: AdminUser; nextRole: AccountRole; saving: boolean; error: string | null; onClose: () => void; onConfirm: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const access: Record<AccountRole, string> = {
    commuter: 'Can browse public transport information and manage their own profile.',
    driver: 'Can use the driver workspace. An approved group membership is required for trip sharing.',
    chairperson: 'Can manage their assigned group. Assign a group separately after changing this role.',
    super_admin: 'Can manage all transport groups, user roles, and system records.',
  };
  return <Panel title="Review role change" subtitle={user.email} onClose={() => { if (!saving) onClose(); }} footer={<><Button label="Cancel" variant="secondary" disabled={saving} onPress={onClose} /><Button label="Confirm role change" loading={saving} onPress={onConfirm} /></>}>
    <View style={styles.detailRow}><Text style={styles.label}>Account</Text><Text style={styles.value}>{user.display_name || user.email}</Text></View>
    <View style={styles.roleChange}><Text style={styles.value}>{roleLabels[user.role]}</Text><Text style={styles.copy}>changes to</Text><Text style={styles.newRole}>{roleLabels[nextRole]}</Text></View>
    <Text style={styles.copy}>{access[nextRole]}</Text>
    {error && <ErrorBanner message={error} />}
  </Panel>;
}

export function AdminChairpersonApproval({ email, saving, error, onClose, onConfirm }: {
  email: string; saving: boolean; error: string | null; onClose: () => void; onConfirm: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return <Panel title="Approve chairperson access" subtitle={email} onClose={() => { if (!saving) onClose(); }} footer={<><Button label="Cancel" variant="secondary" disabled={saving} onPress={onClose} /><Button label="Approve chairperson" loading={saving} onPress={onConfirm} /></>}>
    <View style={styles.roleChange}><Text style={styles.value}>{email}</Text><Text style={styles.copy}>becomes</Text><Text style={styles.newRole}>Chairperson</Text></View>
    <Text style={styles.copy}>The account must already exist. A chairperson only manages a group after one is assigned in the group registry.</Text>
    {error && <ErrorBanner message={error} />}
  </Panel>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(9,20,14,0.48)', alignItems: 'flex-end', justifyContent: 'center', padding: 24 },
    panel: { width: '100%', maxWidth: 580, maxHeight: '100%', backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
    fullPanel: { maxWidth: '100%', height: '100%', borderRadius: 14 },
    header: { padding: 24, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    heading: { flex: 1, minWidth: 0 }, title: { color: colors.ink, fontSize: 22, fontWeight: '800', lineHeight: 29 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
    close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
    body: { padding: 24, gap: 24 }, footer: { padding: 20, gap: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.line },
    stack: { gap: 10 }, sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, copy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, readOnlyField: { gap: 7, padding: 13, borderRadius: 11, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line }, readOnlyValue: { color: colors.ink, fontSize: 15, fontWeight: '600' },
    candidateList: { gap: 8 }, candidateRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 11, borderWidth: 1, borderColor: colors.line }, candidateRowSelected: { borderColor: colors.green, backgroundColor: colors.greenLight }, candidateCopy: { flex: 1, minWidth: 0 }, candidateName: { color: colors.ink, fontSize: 14, fontWeight: '700' }, candidateEmail: { color: colors.muted, fontSize: 12, marginTop: 4 }, candidateSelected: { color: colors.greenDark, fontSize: 12, fontWeight: '800' }, warningCopy: { color: colors.orangeDark, backgroundColor: colors.orangeLight, padding: 12, borderRadius: 11, fontSize: 13, lineHeight: 19 },
    detailRow: { gap: 7, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.line }, label: { color: colors.muted, fontSize: 13 }, value: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
    code: { color: colors.ink, backgroundColor: colors.canvas, padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 21, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    roleChange: { padding: 20, gap: 10, borderRadius: 12, backgroundColor: colors.greenLight }, newRole: { color: colors.greenDark, fontSize: 22, fontWeight: '800' },
  });
}
