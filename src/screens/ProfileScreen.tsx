import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { Button, Card } from '../components/ui';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useColors, useThemeStyles } from '../lib/theme';
import { useWideLayout } from '../lib/useWideLayout';
import { radius, spacing, type ThemeColors } from '../theme';

const profileMenu: { label: string; icon: MaterialIconName }[] = [
  { label: 'My Information', icon: 'person' },
  { label: 'Favorites', icon: 'favorite' },
  { label: 'Notifications', icon: 'notifications' },
  { label: 'Settings', icon: 'settings' },
  { label: 'Help & Support', icon: 'help' },
];

function ProfileMenuRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: MaterialIconName;
  onPress: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <View style={[styles.menuIconWrap, label === 'Favorites' && styles.menuIconWarm]}>
        <MaterialIcon name={icon} size={19} color={label === 'Favorites' ? colors.orange : colors.green} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
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
  const isWide = useWideLayout();
  const isAccount = session.kind === 'account';
  const name = isAccount ? session.name : 'Guest commuter';
  const email = isAccount ? session.email : 'Sign in to add your email';

  const handleMenuPress = (label: string) => {
    if (label === 'Settings') {
      onOpenSettings();
      return;
    }
    if (label === 'My Information') {
      Alert.alert('My Information', isAccount
        ? `Name: ${session.name}\nEmail: ${session.email}`
        : 'You are browsing as a guest. Sign in or create an account to add your name and email.');
      return;
    }

    const messages: Record<string, string> = {
      Favorites: 'Saved places and routes will appear here once you add favorites.',
      Notifications: 'Notification preferences will be available here soon.',
      'Help & Support': 'For current fares and departures, confirm details with local transport operators. eGABAY support options are coming soon.',
    };
    Alert.alert(label, messages[label] ?? 'This section is coming soon.');
  };

  const identityCard = (
    <Card style={styles.identityCard}>
      <View style={styles.avatarFrame}>
        <Image
          source={session.kind === 'account' && session.photoUrl ? { uri: session.photoUrl } : require('../../assets/profile-avatar.png')}
          style={styles.avatar}
          resizeMode="cover"
          accessibilityLabel={`${name} profile photo`}
        />
      </View>
      <View style={styles.identityCopy}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.identityDetail} numberOfLines={1}>{email}</Text>
        {isAccount && <Text style={styles.accountLabel}>{session.role.replace('_', ' ')}</Text>}
      </View>
    </Card>
  );

  const menuSection = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Menu</Text>
      <Card style={styles.menuCard}>
        {profileMenu.map((item, index) => (
          <View key={item.label}>
            <ProfileMenuRow label={item.label} icon={item.icon} onPress={() => handleMenuPress(item.label)} />
            {index < profileMenu.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>
    </View>
  );

  const accountSection = isAccount ? (
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
      <View style={styles.guestCopy}>
        <Text style={styles.guestTitle}>Sync your travel details</Text>
        <Text style={styles.guestDetail}>Create an account to save favorites and receive service updates.</Text>
      </View>
      <Button label="Sign in or create account" onPress={onAuthRequest} />
    </Card>
  );

  const footerBits = (
    <>
      <Text style={styles.footerNote}>Route and fare details are sample information. Confirm locally before travel.</Text>
      {isAccount && <Button label="Log out" variant="ghost" onPress={onLogout} />}
    </>
  );

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.pageTitle}>Profile</Text>
      {isWide ? (
        <View style={styles.columns}>
          <View style={styles.column}>{identityCard}{accountSection}</View>
          <View style={styles.column}>{menuSection}{footerBits}</View>
        </View>
      ) : (
        <>{identityCard}{menuSection}{accountSection}{footerBits}</>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.72 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 32, gap: 17 },
    pageTitle: { color: colors.ink, fontSize: 30, lineHeight: 36, letterSpacing: -0.7, fontWeight: '700' },
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 16 },
    avatarFrame: { width: 76, height: 76, padding: 3, borderRadius: 38, backgroundColor: colors.greenLight },
    avatar: { width: 70, height: 70, borderRadius: 35 },
    identityCopy: { flex: 1, gap: 4 },
    name: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' },
    identityDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    accountLabel: { color: colors.green, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 0.25, marginTop: 2 },
    section: { gap: 8 },
    sectionTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.15 },
    menuCard: { paddingHorizontal: 12, paddingVertical: 4, overflow: 'hidden' },
    menuRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    menuIconWarm: { backgroundColor: colors.orangeLight },
    menuLabel: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 46 },
    modeCard: { gap: 11 },
    modeOptions: { flexDirection: 'row', backgroundColor: colors.canvas, borderRadius: radius.md, padding: 4, gap: 4 },
    modeOption: { minHeight: 42, flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    modeOptionSelected: { backgroundColor: colors.green },
    modeOptionText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    modeOptionTextSelected: { color: '#FFFFFF' },
    modeFootnote: { color: colors.muted, fontSize: 11, lineHeight: 16 },
    sectionDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -4 },
    guestCard: { gap: 13, padding: 15 },
    guestCopy: { gap: 4 },
    guestTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    guestDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    footerNote: { color: colors.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 2 },
    columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
    column: { flex: 1, gap: 17 },
  });
}
