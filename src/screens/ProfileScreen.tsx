import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ScreenHeader } from '../components/ui';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { isSupabaseConfigured } from '../lib/supabase';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

function Row({ glyph, label, value, onPress }: { glyph: string; label: string; value?: string; onPress?: () => void }) {
  const styles = useThemeStyles(createStyles);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowGlyphWrap}><Text style={styles.rowGlyph}>{glyph}</Text></View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
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
    ? session.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '✦';

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="Your eGABAY" title={isAccount ? 'Account' : 'Guest mode'} />
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{initials}</Text></View>
        <Text style={styles.profileTitle}>{isAccount ? session.name : 'Guest'}</Text>
        <Text style={styles.profileBody}>{isAccount ? session.email : 'Browsing offline with saved data'}</Text>
        <View style={styles.profileDivider} />
        <View style={styles.profileRow}><Text style={styles.profileRowLabel}>Account</Text><Text style={styles.profileRowValue}>{isSupabaseConfigured ? 'Supabase ready' : 'Backend not connected'}</Text></View>
        <View style={styles.profileRow}><Text style={styles.profileRowLabel}>Service area</Text><Text style={styles.profileRowValue}>Marinduque, PH</Text></View>
        <View style={styles.profileRow}><Text style={styles.profileRowLabel}>Connection mode</Text><Text style={styles.profileRowValue}>{mode === 'online' ? 'Online' : 'Offline'}</Text></View>
      </Card>

      {isAccount && (
        <Card>
          <Text style={styles.modeSwitchTitle}>Connection mode</Text>
          <Text style={styles.modeSwitchBody}>Online gets live positions and fresh notices. Offline keeps saved routes, stops, and fares working with no signal.</Text>
          <View style={styles.modeSwitchRow}>
            {(['online', 'offline'] as AppMode[]).map((option) => {
              const active = mode === option;
              return (
                <Pressable key={option} onPress={() => onChangeMode(option)} style={[styles.modeSwitchOption, active && styles.modeSwitchOptionActive]}>
                  <Text style={[styles.modeSwitchOptionText, active && styles.modeSwitchOptionTextActive]}>{option === 'online' ? 'Online' : 'Offline'}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      {!isAccount && (
        <Card style={styles.guestCta}>
          <Text style={styles.guestCtaTitle}>Unlock live updates</Text>
          <Text style={styles.guestCtaBody}>Create an account or log in to see vehicle positions, fresh notices, and sync your trips.</Text>
          <Button label="Create an account / Log in" onPress={onAuthRequest} />
        </Card>
      )}

      <Card style={styles.rowsCard}>
        <Row glyph="⚙" label="Settings" onPress={onOpenSettings} />
        <Row glyph="⌖" label="Service area" value="Marinduque, PH" />
        <Row glyph="▤" label="Mode" value={mode === 'online' ? 'Online' : 'Offline'} />
      </Card>

      <View style={styles.tipCard}>
        <Text style={styles.tipGlyph}>⌁</Text>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Built with local knowledge</Text>
          <Text style={styles.tipBody}>Routes and service information should be reviewed with transport groups and local communities before launch.</Text>
        </View>
      </View>
      {!isSupabaseConfigured && (
        <View style={styles.connectCard}>
          <Text style={styles.connectTitle}>Connect your Supabase project</Text>
          <Text style={styles.connectBody}>Copy .env.example to .env.local and add your project URL and publishable key to enable backend features.</Text>
        </View>
      )}
      {isAccount && <Button label="Log out" variant="ghost" onPress={onLogout} />}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 18 },
    profileCard: { alignItems: 'center', padding: 20 },
    profileAvatar: { width: 60, height: 60, borderRadius: 21, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    profileAvatarText: { color: colors.lime, fontSize: 26, fontWeight: '900' },
    profileTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
    profileBody: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 7 },
    profileDivider: { height: 1, backgroundColor: colors.line, width: '100%', marginVertical: 16 },
    profileRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
    profileRowLabel: { color: colors.muted, fontSize: 10 },
    profileRowValue: { color: colors.ink, fontSize: 10, fontWeight: '700' },
    modeSwitchTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    modeSwitchBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
    modeSwitchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    modeSwitchOption: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    modeSwitchOptionActive: { backgroundColor: colors.green, borderColor: colors.green },
    modeSwitchOptionText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
    modeSwitchOptionTextActive: { color: colors.lime },
    guestCta: { gap: 10 },
    guestCtaTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
    guestCtaBody: { color: colors.muted, fontSize: 11, lineHeight: 16 },
    rowsCard: { padding: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: radius.sm },
    rowGlyphWrap: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    rowGlyph: { color: colors.green, fontSize: 15, fontWeight: '700' },
    rowLabel: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: '700' },
    rowValue: { color: colors.muted, fontSize: 10 },
    rowChevron: { color: colors.muted, fontSize: 18 },
    tipCard: { flexDirection: 'row', gap: 11, padding: 14, backgroundColor: colors.tipBg, borderRadius: radius.md },
    tipGlyph: { color: colors.green, fontSize: 19, fontWeight: '800' },
    tipCopy: { flex: 1 },
    tipTitle: { color: colors.greenDark, fontSize: 11, fontWeight: '800', marginBottom: 4 },
    tipBody: { color: colors.tipBody, fontSize: 10, lineHeight: 15 },
    connectCard: { borderWidth: 1, borderColor: colors.connectBorder, backgroundColor: colors.connectBg, padding: 14, borderRadius: radius.md, gap: 5 },
    connectTitle: { color: colors.connectTitle, fontSize: 11, fontWeight: '800' },
    connectBody: { color: colors.connectBody, fontSize: 10, lineHeight: 15 },
  });
}
