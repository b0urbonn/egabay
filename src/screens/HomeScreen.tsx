import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RouteCard } from '../components/RouteCard';
import { demoAlerts, demoRoutes } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

const rideModeOptions = ['Any ride', 'Jeepney', 'Tricycle'] as const;

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
  onNavigate: (tab: 'Plan' | 'Updates' | 'Profile') => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [preferredMode, setPreferredMode] = useState<(typeof rideModeOptions)[number]>('Any ride');
  const name = session.kind === 'account' ? session.name.split(' ')[0] : 'commuter';
  const today = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const reportedUnits = demoRoutes.reduce((total, route) => total + route.activeUnits, 0);

  return (
    <>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeRow}>
          <View style={styles.greetingCopy}>
            <Text style={styles.dashboardDate}>{today.toUpperCase()}  |  MARINDUQUE</Text>
            <Text style={styles.pageTitle}>{greeting()}, {name}.</Text>
            <Text style={styles.pageIntro}>Your island travel at a glance.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open travel settings"
            onPress={() => setSettingsVisible(true)}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.statusDot, mode === 'offline' && styles.statusDotOff]} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>{mode === 'online' ? 'Online - live updates on' : 'Offline - showing saved data'}</Text>
            <Text style={styles.statusBody}>
              {mode === 'online' ? 'Fresh notices and unit positions when available.' : 'Routes, stops, and fares from your last sync.'}
            </Text>
          </View>
          {mode === 'offline' && (
            <Pressable onPress={() => onNavigate('Profile')} hitSlop={6}>
              <Text style={styles.statusLink}>Manage</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroPill}><View style={styles.heroPillDot} /><Text style={styles.heroPillText}>LOCAL TRAVEL, MADE CLEAR</Text></View>
          <Text style={styles.heroTitle}>Where will the island take you?</Text>
          <Text style={styles.heroBody}>Find a jeepney or tricycle route, check service information, and plan your next ride.</Text>
          <Pressable style={styles.heroButton} onPress={() => onNavigate('Plan')}>
            <Text style={styles.heroButtonText}>Plan a trip</Text>
            <Text style={styles.heroButtonArrow}>-&gt;</Text>
          </Pressable>
          <View style={styles.heroDecorCircle} />
          <View style={styles.heroDecorLine} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>TRAVEL SNAPSHOT</Text>
              <Text style={styles.sectionTitle}>Trips and routes</Text>
            </View>
            <View style={styles.sampleBadge}><Text style={styles.sampleBadgeText}>SAMPLE</Text></View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{demoRoutes.length}</Text>
              <Text style={styles.metricLabel}>routes listed</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{reportedUnits}</Text>
              <Text style={styles.metricLabel}>units reported</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{demoAlerts.length}</Text>
              <Text style={styles.metricLabel}>recent updates</Text>
            </View>
          </View>
          <Text style={styles.summaryNote}>Sample information only. Personal trip history is not connected yet.</Text>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>A ROUTE TO GET YOU STARTED</Text>
            <Text style={styles.sectionTitle}>Recent trip preview</Text>
          </View>
          <View style={styles.sampleBadge}><Text style={styles.sampleBadgeText}>DEMO</Text></View>
        </View>
        <RouteCard route={demoRoutes[0]} onPress={() => onNavigate('Plan')} />

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>FROM THE SERVICE BOARD</Text>
            <Text style={styles.sectionTitle}>Recent information</Text>
          </View>
          <Pressable onPress={() => onNavigate('Updates')}>
            <Text style={styles.textLink}>All updates -&gt;</Text>
          </Pressable>
        </View>
        {demoAlerts.map((alert) => (
          <Pressable key={alert.id} style={({ pressed }) => [styles.infoCard, pressed && styles.pressed]} onPress={() => onNavigate('Updates')}>
            <View style={[styles.infoIcon, alert.severity === 'notice' && styles.infoIconNotice]}>
              <Text style={[styles.infoIconText, alert.severity === 'notice' && styles.infoIconTextNotice]}>{alert.severity === 'notice' ? '!' : 'i'}</Text>
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoMeta}>{alert.locality}  |  {alert.time}</Text>
              <Text style={styles.infoTitle}>{alert.title}</Text>
              <Text style={styles.infoDetail}>{alert.detail}</Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.offlineCard}>
          <View style={styles.offlineMark}><Text style={styles.offlineMarkText}>OFF</Text></View>
          <View style={styles.offlineCopy}>
            <Text style={styles.offlineTitle}>Offline travel guide</Text>
            <Text style={styles.offlineBody}>Saved routes, terminal details, and offline guidance are planned for the app.</Text>
          </View>
        </View>
        <Text style={styles.demoNote}>Routes, vehicle counts, fares, and service notices shown here are sample data.</Text>
      </ScrollView>

      <Modal transparent animationType="fade" visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>YOUR TRAVEL PREFERENCES</Text>
                <Text style={styles.settingsTitle}>Settings</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={() => setSettingsVisible(false)} style={styles.settingsCloseButton}>
                <Text style={styles.settingsCloseText}>x</Text>
              </Pressable>
            </View>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>Preferred ride</Text>
              <View style={styles.settingsModeOptions}>
                {rideModeOptions.map((rideMode) => {
                  const selected = preferredMode === rideMode;
                  return (
                    <Pressable key={rideMode} onPress={() => setPreferredMode(rideMode)} style={[styles.settingsModeOption, selected && styles.settingsModeOptionSelected]}>
                      <Text style={[styles.settingsModeText, selected && styles.settingsModeTextSelected]}>{rideMode}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.settingsDetailsCard}>
              <Text style={styles.settingsLabel}>Service area</Text>
              <Text style={styles.settingsValue}>Marinduque, Philippines</Text>
              <View style={styles.settingsDivider} />
              <Text style={styles.settingsLabel}>Offline information</Text>
              <Text style={styles.settingsDescription}>Offline routes and terminal details are planned; live service updates need an internet connection.</Text>
            </View>
            <Pressable style={styles.settingsDoneButton} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.settingsDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 16 },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    greetingCopy: { flex: 1 },
    dashboardDate: { color: colors.green, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    pageTitle: { color: colors.ink, fontSize: 24, lineHeight: 29, letterSpacing: -0.8, fontWeight: '800' },
    pageIntro: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
    settingsButton: { minWidth: 62, height: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
    settingsButtonText: { color: colors.greenDark, fontSize: 10, fontWeight: '800' },
    statusCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onTime },
    statusDotOff: { backgroundColor: colors.orange },
    statusCopy: { flex: 1 },
    statusTitle: { color: colors.ink, fontSize: 10, fontWeight: '800' },
    statusBody: { color: colors.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
    statusLink: { color: colors.green, fontSize: 10, fontWeight: '800' },
    heroCard: { backgroundColor: colors.green, borderRadius: 22, paddingHorizontal: 19, paddingTop: 18, paddingBottom: 18, overflow: 'hidden', minHeight: 178 },
    heroPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 16, gap: 7 },
    heroPillDot: { width: 6, height: 6, backgroundColor: colors.lime, borderRadius: 3 },
    heroPillText: { color: '#F4FAF2', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
    heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 26, letterSpacing: -0.7, fontWeight: '800', marginTop: 13, maxWidth: 290 },
    heroBody: { color: '#DDECE3', fontSize: 10, lineHeight: 15, marginTop: 6, maxWidth: 290 },
    heroButton: { marginTop: 13, height: 36, backgroundColor: colors.lime, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 13 },
    heroButtonText: { color: colors.greenDark, fontSize: 10, fontWeight: '800' },
    heroButtonArrow: { color: colors.greenDark, fontSize: 14, fontWeight: '700' },
    heroDecorCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', right: -61, top: 55 },
    heroDecorLine: { position: 'absolute', width: 145, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', right: -31, top: 116, transform: [{ rotate: '-38deg' }] },
    summaryCard: { backgroundColor: colors.card, borderRadius: 19, borderWidth: 1, borderColor: colors.line, padding: 15, gap: 14 },
    sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
    sectionEyebrow: { color: colors.green, fontSize: 8, fontWeight: '800', letterSpacing: 1.05, marginBottom: 5 },
    sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    sampleBadge: { backgroundColor: colors.orangeLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 2 },
    sampleBadgeText: { color: colors.orange, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    metric: { flex: 1, alignItems: 'flex-start' },
    metricValue: { color: colors.greenDark, fontSize: 22, lineHeight: 26, fontWeight: '800' },
    metricLabel: { color: colors.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
    metricDivider: { width: 1, height: 30, backgroundColor: colors.line },
    summaryNote: { color: colors.muted, fontSize: 8, lineHeight: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9 },
    textLink: { color: colors.green, fontSize: 10, fontWeight: '800', marginBottom: 2 },
    infoCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    infoIconNotice: { backgroundColor: colors.orangeLight },
    infoIconText: { color: colors.green, fontSize: 12, fontWeight: '900' },
    infoIconTextNotice: { color: colors.orange },
    infoCopy: { flex: 1 },
    infoMeta: { color: colors.green, fontSize: 8, lineHeight: 12, fontWeight: '800', letterSpacing: 0.3 },
    infoTitle: { color: colors.ink, fontSize: 10, lineHeight: 15, fontWeight: '800', marginTop: 3 },
    infoDetail: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
    offlineCard: { backgroundColor: colors.greenLight, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
    offlineMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    offlineMarkText: { color: colors.greenDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
    offlineCopy: { flex: 1 },
    offlineTitle: { color: colors.greenDark, fontSize: 10, fontWeight: '800' },
    offlineBody: { color: colors.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
    demoNote: { color: colors.muted, fontSize: 8, lineHeight: 13, textAlign: 'center', paddingHorizontal: 8 },
    settingsOverlay: { flex: 1, backgroundColor: 'rgba(16,35,25,0.42)', alignItems: 'center', justifyContent: 'center', padding: 18 },
    settingsSheet: { width: '100%', maxWidth: 380, backgroundColor: colors.card, borderRadius: 23, padding: 20, gap: 17 },
    settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingsTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
    settingsCloseButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
    settingsCloseText: { color: colors.muted, fontSize: 22, lineHeight: 25 },
    settingsSection: { gap: 9 },
    settingsLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    settingsModeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    settingsModeOption: { borderRadius: 15, borderWidth: 1, borderColor: colors.line, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.canvas },
    settingsModeOptionSelected: { borderColor: colors.green, backgroundColor: colors.greenLight },
    settingsModeText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    settingsModeTextSelected: { color: colors.greenDark },
    settingsDetailsCard: { backgroundColor: colors.canvas, borderRadius: 15, padding: 13, gap: 5 },
    settingsValue: { color: colors.ink, fontSize: 12, fontWeight: '700' },
    settingsDivider: { height: 1, backgroundColor: colors.line, marginVertical: 7 },
    settingsDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
    settingsDoneButton: { height: 44, backgroundColor: colors.green, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    settingsDoneText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  });
}
