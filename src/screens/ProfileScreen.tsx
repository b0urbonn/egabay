import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '../components/ui';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const rowContent = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrailing}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.settingsRow}>{rowContent}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
    >
      {rowContent}
    </Pressable>
  );
}

export function ProfileScreen({
  session,
  mode,
  onChangeMode,
  onOpenSettings,
  onLogout,
  onAuthRequest,
}: {
  session: Session;
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onAuthRequest: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const isAccount = session.kind === 'account';
  const initials = isAccount
    ? session.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'G';

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.pageTitle}>Profile</Text>

      <Card style={styles.identityCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{isAccount ? session.name : 'Guest mode'}</Text>
          <Text style={styles.identityDetail} numberOfLines={1}>
            {isAccount ? session.email : 'Using saved travel information'}
          </Text>
        </View>
      </Card>

      {isAccount ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel mode</Text>
          <Text style={styles.sectionDetail}>Choose how eGABAY gets service updates.</Text>
          <Card style={styles.modeCard}>
            <View style={styles.modeOptions}>
              {(['online', 'offline'] as AppMode[]).map((option) => {
                const selected = mode === option;
                const label = option === 'online' ? 'Online' : 'Offline';
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} travel mode`}
                    accessibilityState={{ selected }}
                    onPress={() => onChangeMode(option)}
                    style={[styles.modeOption, selected && styles.modeOptionSelected]}
                  >
                    <Text style={[styles.modeOptionText, selected && styles.modeOptionTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.modeFootnote}>
              {mode === 'online' ? 'Live updates are available when connected.' : 'Saved routes and fares work without a signal.'}
            </Text>
          </Card>
        </View>
      ) : (
        <Card style={styles.guestCard}>
          <Text style={styles.guestTitle}>Get more from eGABAY</Text>
          <Text style={styles.guestDetail}>Sign in to sync your trips and receive live service updates.</Text>
          <Button label="Create account or sign in" onPress={onAuthRequest} />
        </Card>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingsGroup}>
          <SettingsRow label="Settings" onPress={onOpenSettings} />
          <View style={styles.divider} />
          <SettingsRow label="Service area" value="Marinduque, Philippines" />
        </Card>
      </View>

      <Text style={styles.footerNote}>Route and fare details are sample information. Confirm locally before travel.</Text>

      {isAccount && <Button label="Log out" variant="ghost" onPress={onLogout} />}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.7 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 32, gap: 20 },
    pageTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: '700' },
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.greenDark, fontSize: 18, fontWeight: '700' },
    identityCopy: { flex: 1, gap: 4 },
    name: { color: colors.ink, fontSize: 16, fontWeight: '700' },
    identityDetail: { color: colors.muted, fontSize: 13 },
    section: { gap: 6 },
    sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
    sectionDetail: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 5 },
    modeCard: { gap: 12 },
    modeOptions: { flexDirection: 'row', backgroundColor: colors.canvas, borderRadius: radius.md, padding: 4, gap: 4 },
    modeOption: { minHeight: 44, flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    modeOptionSelected: { backgroundColor: colors.green },
    modeOptionText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
    modeOptionTextSelected: { color: '#FFFFFF' },
    modeFootnote: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    guestCard: { gap: 12 },
    guestTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
    guestDetail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    settingsGroup: { paddingVertical: 4, paddingHorizontal: 14 },
    settingsRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    rowLabel: { flex: 1, color: colors.ink, fontSize: 15 },
    rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowValue: { color: colors.muted, fontSize: 13, textAlign: 'right', maxWidth: '55%' },
    rowChevron: { color: colors.muted, fontSize: 22, lineHeight: 24 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
    footerNote: { color: colors.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 2 },
  });
}
