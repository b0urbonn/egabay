import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { AccountRole } from '../../lib/session';
import { useColors, useThemeStyles } from '../../lib/theme';
import type { ThemeColors } from '../../theme';
import type { AdminGroup, AdminUser } from '../../types/admin';
import { MaterialIcon } from '../MaterialIcon';
import { Button, Chip, ErrorBanner, TextField } from '../ui';

const towns = ['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'];
const roleLabels: Record<AccountRole, string> = { commuter: 'Commuter', driver: 'Driver', chairperson: 'Chairperson', super_admin: 'Super admin' };

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

export function AdminGroupEditor({ group, groups, users, onClose, onSave }: {
  group: AdminGroup | null; groups: AdminGroup[]; users: AdminUser[]; onClose: () => void; onSave: (group: AdminGroup) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [name, setName] = useState(group?.name ?? '');
  const [kind, setKind] = useState<'toda' | 'jeepney'>(group?.kind ?? 'toda');
  const [municipality, setMunicipality] = useState(group?.municipality ?? 'Boac');
  const [chairperson, setChairperson] = useState<string | null>(group?.chairperson_id ?? null);
  const [active, setActive] = useState(group?.is_active ?? true);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [discarding, setDiscarding] = useState(false);
  const dirty = name !== (group?.name ?? '') || kind !== (group?.kind ?? 'toda') || municipality !== (group?.municipality ?? 'Boac') || chairperson !== (group?.chairperson_id ?? null) || active !== (group?.is_active ?? true);
  const close = () => dirty ? setDiscarding(true) : onClose();
  const availableChairs = users.filter((user) => user.role === 'chairperson' && !groups.some((entry) => entry.id !== group?.id && entry.chairperson_id === user.id));
  const save = () => {
    if (!name.trim()) { setErrors({ name: 'Enter the group name.' }); return; }
    if (groups.some((entry) => entry.id !== group?.id && entry.name.trim().toLowerCase() === name.trim().toLowerCase())) { setErrors({ name: 'This group name is already in use.' }); return; }
    onSave({ id: group?.id ?? `preview-group-${Date.now()}`, name: name.trim(), kind, municipality, chairperson_id: chairperson, is_active: active });
  };
  return <Panel title={group ? 'Edit transport group' : 'Create transport group'} subtitle="Design preview · sample changes stay in this preview." onClose={close} footer={discarding ? <><Button label="Keep editing" variant="secondary" onPress={() => setDiscarding(false)} /><Button label="Discard changes" onPress={onClose} /></> : <><Button label="Cancel" variant="secondary" onPress={close} /><Button label="Save preview group" onPress={save} /></>}>
    {discarding ? <View style={styles.stack}><Text style={styles.sectionTitle}>Discard your changes?</Text><Text style={styles.copy}>The group has not been saved.</Text></View> : <>
      <TextField comfortable label="Group name" value={name} onChangeText={(value) => { setName(value); setErrors({}); }} placeholder="Enter the registered group name" error={errors.name} />
      <FieldSection title="Transport type"><View style={styles.chips}><Chip comfortable label="TODA / Tricycle" selected={kind === 'toda'} onPress={() => setKind('toda')} /><Chip comfortable label="Jeepney" selected={kind === 'jeepney'} onPress={() => setKind('jeepney')} /></View></FieldSection>
      <FieldSection title="Municipality"><View style={styles.chips}>{towns.map((town) => <Chip comfortable key={town} label={town} selected={municipality === town} onPress={() => setMunicipality(town)} />)}</View></FieldSection>
      <FieldSection title="Chairperson" hint="Only accounts with the chairperson role and no other group assignment are available."><View style={styles.stack}><Choice label="Assign later" detail="The group will have no chairperson yet." selected={chairperson === null} onPress={() => setChairperson(null)} />{availableChairs.map((user) => <Choice key={user.id} label={user.display_name || user.email} detail={user.email} selected={chairperson === user.id} onPress={() => setChairperson(user.id)} />)}</View></FieldSection>
      {group?.chairperson_id && chairperson !== group.chairperson_id && <Text style={styles.warning}>Replacing the chairperson removes the previous chairperson's access to this group. The new chairperson will manage its terminals, vehicles, and drivers.</Text>}
      <FieldSection title="Group status"><View style={styles.chips}><Chip comfortable label="Active" selected={active} onPress={() => setActive(true)} /><Chip comfortable label="Inactive" selected={!active} onPress={() => setActive(false)} /></View>{!active && <Text style={styles.warning}>Inactive groups and their transport records are hidden from public browsing. Drivers cannot share a trip for this group.</Text>}</FieldSection>
    </>}
  </Panel>;
}

function FieldSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.stack}><Text style={styles.sectionTitle}>{title}</Text>{hint && <Text style={styles.copy}>{hint}</Text>}{children}</View>;
}

function Choice({ label, detail, selected, onPress }: { label: string; detail: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, selected && styles.selected]}><View style={styles.heading}><Text style={styles.value}>{label}</Text><Text style={styles.copy}>{detail}</Text></View><Text style={styles.radio}>{selected ? '●' : '○'}</Text></Pressable>;
}

export function AdminRecordInspector({ title, subtitle, rows, detail, onClose, onEdit }: {
  title: string; subtitle: string; rows: { label: string; value: string }[]; detail?: string; onClose: () => void; onEdit?: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return <Panel title={title} subtitle={subtitle} onClose={onClose} footer={<><Button label="Close" variant="secondary" onPress={onClose} />{onEdit && <Button label="Edit preview group" onPress={onEdit} />}</>}>
    {rows.map((row) => <View key={row.label} style={styles.detailRow}><Text style={styles.label}>{row.label}</Text><Text selectable style={styles.value}>{row.value}</Text></View>)}
    {detail && <View style={styles.stack}><Text style={styles.sectionTitle}>Recorded changes</Text><Text selectable style={styles.code}>{detail}</Text></View>}
  </Panel>;
}

export function AdminRoleConfirmation({ user, nextRole, preview, saving, error, onClose, onConfirm }: {
  user: AdminUser; nextRole: AccountRole; preview: boolean; saving: boolean; error: string | null; onClose: () => void; onConfirm: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const access: Record<AccountRole, string> = {
    commuter: 'Can browse public transport information and manage their own profile.',
    driver: 'Can use the driver workspace. An approved group membership is required for trip sharing.',
    chairperson: 'Can manage their assigned group. Assign a group separately after changing this role.',
    super_admin: 'Can manage all transport groups, user roles, and system records.',
  };
  return <Panel title="Review role change" subtitle={user.email} onClose={() => { if (!saving) onClose(); }} footer={<><Button label="Cancel" variant="secondary" disabled={saving} onPress={onClose} /><Button label={preview ? 'Apply preview role' : 'Confirm role change'} loading={saving} onPress={onConfirm} /></>}>
    <View style={styles.detailRow}><Text style={styles.label}>Account</Text><Text style={styles.value}>{user.display_name || user.email}</Text></View>
    <View style={styles.roleChange}><Text style={styles.value}>{roleLabels[user.role]}</Text><Text style={styles.copy}>changes to</Text><Text style={styles.newRole}>{roleLabels[nextRole]}</Text></View>
    <Text style={styles.copy}>{access[nextRole]}</Text>
    {preview && <Text style={styles.warning}>This changes sample data only. It does not grant access to an account.</Text>}
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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, warning: { padding: 12, borderRadius: 10, backgroundColor: colors.orangeLight, color: colors.orangeDark, fontSize: 13, lineHeight: 20 },
    choice: { minHeight: 64, flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 12, gap: 12 }, selected: { borderColor: colors.greenDark, backgroundColor: colors.greenLight }, radio: { color: colors.greenDark, fontSize: 20 },
    detailRow: { gap: 7, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.line }, label: { color: colors.muted, fontSize: 13 }, value: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
    code: { color: colors.ink, backgroundColor: colors.canvas, padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 21, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    roleChange: { padding: 20, gap: 10, borderRadius: 12, backgroundColor: colors.greenLight }, newRole: { color: colors.greenDark, fontSize: 22, fontWeight: '800' },
  });
}
