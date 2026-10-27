import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { AccountRole } from '../../lib/session';
import { useColors, useThemeStyles } from '../../lib/theme';
import type { ThemeColors } from '../../theme';
import type { AdminUser } from '../../types/admin';
import { MaterialIcon } from '../MaterialIcon';
import { Button, ErrorBanner } from '../ui';

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

export function AdminRecordInspector({ title, subtitle, rows, detail, onClose }: {
  title: string; subtitle: string; rows: { label: string; value: string }[]; detail?: string; onClose: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return <Panel title={title} subtitle={subtitle} onClose={onClose} footer={<Button label="Close" variant="secondary" onPress={onClose} />}>
    {rows.map((row) => <View key={row.label} style={styles.detailRow}><Text style={styles.label}>{row.label}</Text><Text selectable style={styles.value}>{row.value}</Text></View>)}
    {detail && <View style={styles.stack}><Text style={styles.sectionTitle}>Recorded changes</Text><Text selectable style={styles.code}>{detail}</Text></View>}
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
    detailRow: { gap: 7, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.line }, label: { color: colors.muted, fontSize: 13 }, value: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
    code: { color: colors.ink, backgroundColor: colors.canvas, padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 21, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    roleChange: { padding: 20, gap: 10, borderRadius: 12, backgroundColor: colors.greenLight }, newRole: { color: colors.greenDark, fontSize: 22, fontWeight: '800' },
  });
}
