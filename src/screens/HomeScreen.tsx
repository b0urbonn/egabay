import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, Eyebrow, SectionHeader } from '../components/ui';
import { RouteCard } from '../components/RouteCard';
import { demoAlerts, demoRoutes } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

const quickActions: { glyph: string; label: string; tab: 'Map' | 'Profile' }[] = [
  { glyph: '◈', label: 'Island map', tab: 'Map' },
  { glyph: '↗', label: 'Plan trip', tab: 'Map' },
  { glyph: '▤', label: 'Saved routes', tab: 'Map' },
  { glyph: '○', label: 'My profile', tab: 'Profile' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({
  session,
  mode,
  onNavigate,
}: {
  session: Session;
  mode: AppMode;
  onNavigate: (tab: 'Map' | 'Profile') => void;
}) {
  const styles = useThemeStyles(createStyles);
  const name = session.kind === 'account' ? session.name.split(' ')[0] : null;
  const latest = demoAlerts[0];

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeRow}>
        <View>
          <Eyebrow>Marinduque commute guide</Eyebrow>
          <Text style={styles.pageTitle}>{name ? `${greeting()}, ${name}.` : 'Hello, traveler.'}</Text>
        </View>
      </View>

      <Card style={styles.statusCard}>
        <View style={[styles.statusDot, mode === 'offline' && styles.statusDotOff]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>{mode === 'online' ? 'Online · live updates on' : 'Offline · showing saved data'}</Text>
          <Text style={styles.statusBody}>
            {mode === 'online' ? 'Fresh notices and unit positions when available.' : 'Routes, stops, and fares from your last sync.'}
          </Text>
        </View>
        {mode === 'offline' && (
          <Pressable onPress={() => onNavigate('Profile')} hitSlop={6}>
            <Text style={styles.statusLink}>Manage</Text>
          </Pressable>
        )}
      </Card>

      <View style={styles.searchBlock}>
        <Pressable style={styles.destinationField} onPress={() => onNavigate('Map')}>
          <View style={styles.destinationPin}><Text style={styles.destinationPinText}>⌖</Text></View>
          <Text style={styles.destinationPlaceholder}>Where are you going?</Text>
          <Text style={styles.destinationArrow}>→</Text>
        </Pressable>
        <View style={styles.quickPlaces}>
          {['Boac', 'Gasan', 'Santa Cruz', 'Mogpog'].map((place) => (
            <Chip key={place} label={place} onPress={() => onNavigate('Map')} />
          ))}
        </View>
      </View>

      <View style={styles.actionGrid}>
        {quickActions.map((action) => (
          <Pressable key={action.label} onPress={() => onNavigate(action.tab)} style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}>
            <Text style={styles.actionGlyph}>{action.glyph}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader
        eyebrow="Explore the island"
        title="Popular routes"
        action={<Pressable onPress={() => onNavigate('Map')}><Text style={styles.textLink}>See map  →</Text></Pressable>}
      />
      {demoRoutes.slice(0, 2).map((route) => (
        <RouteCard key={route.id} route={route} onPress={() => onNavigate('Map')} />
      ))}

      <SectionHeader
        eyebrow="Know before you go"
        title="Latest notice"
      />
      <View style={styles.homeAlert}>
        <View style={styles.alertIcon}><Text style={styles.alertIconText}>!</Text></View>
        <View style={styles.homeAlertCopy}>
          <Text style={styles.homeAlertTitle}>{latest.title}</Text>
          <Text style={styles.homeAlertDetail}>{latest.locality} · {latest.time}</Text>
        </View>
        <Text style={styles.homeAlertArrow}>›</Text>
      </View>
      <Text style={styles.demoNote}>Demo content only · route, fare, and vehicle details need operator confirmation.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 18 },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pageTitle: { color: colors.ink, fontSize: 27, lineHeight: 31, letterSpacing: -0.9, fontWeight: '800' },
    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.onTime },
    statusDotOff: { backgroundColor: colors.orange },
    statusCopy: { flex: 1 },
    statusTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    statusBody: { color: colors.muted, fontSize: 10, marginTop: 3 },
    statusLink: { color: colors.green, fontSize: 11, fontWeight: '800' },
    searchBlock: { gap: 11 },
    destinationField: { minHeight: 55, backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
    destinationPin: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    destinationPinText: { color: colors.green, fontSize: 17, fontWeight: '700' },
    destinationPlaceholder: { flex: 1, color: colors.muted, fontSize: 13 },
    destinationArrow: { color: colors.green, fontSize: 19, fontWeight: '700' },
    quickPlaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionTile: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 8 },
    actionGlyph: { color: colors.green, fontSize: 20, fontWeight: '800' },
    actionLabel: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    textLink: { color: colors.green, fontSize: 11, fontWeight: '800', marginBottom: 2 },
    homeAlert: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    alertIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeLight },
    alertIconText: { color: colors.orange, fontWeight: '900', fontSize: 14 },
    homeAlertCopy: { flex: 1 },
    homeAlertTitle: { color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '800' },
    homeAlertDetail: { color: colors.muted, fontSize: 9, marginTop: 3 },
    homeAlertArrow: { color: colors.muted, fontSize: 22 },
    demoNote: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  });
}
