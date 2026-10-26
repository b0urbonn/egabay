import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MaterialIcon } from '../components/MaterialIcon';
import { demoRoutes } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useColors, useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

type HomeDestination = 'Map' | 'Profile';

const quickAccess = [
  { label: 'Plan a Trip', icon: 'route' as const, destination: 'Map' as const },
  { label: 'Live Trips', icon: 'liveTrips' as const, destination: 'Map' as const },
  { label: 'Terminals', icon: 'terminals' as const, destination: 'Map' as const },
  { label: 'AI Assistant', icon: 'assistant' as const, destination: 'assistant' as const },
  { label: 'Map', icon: 'map' as const, destination: 'Map' as const },
  { label: 'More', icon: 'more' as const, destination: 'Profile' as const },
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
  onOpenSettings,
}: {
  session: Session;
  mode: AppMode;
  onNavigate: (tab: HomeDestination) => void;
  onOpenSettings: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const name = session.kind === 'account' ? session.name.split(' ')[0] : 'commuter';
  const today = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const handleQuickAccess = (destination: HomeDestination | 'assistant') => {
    if (destination === 'assistant') {
      Alert.alert('AI Assistant', 'Your travel assistant is coming soon.');
      return;
    }
    onNavigate(destination);
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.largeTitle}>{greeting()},</Text>
          <Text style={styles.nameTitle}>{name}!</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={onOpenSettings}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <MaterialIcon name="settings" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.searchField}>
        <MaterialIcon name="search" size={22} color={colors.green} />
        <TextInput
          accessibilityLabel="Search destinations"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => onNavigate('Map')}
          returnKeyType="search"
          placeholder="Where do you want to go?"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search destinations on map"
          onPress={() => onNavigate('Map')}
          style={({ pressed }) => [styles.searchAction, pressed && styles.pressed]}
        >
          <MaterialIcon name="arrowForward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {mode === 'offline' && (
        <View style={styles.offlineCard}>
          <View style={styles.offlineDot} />
          <View style={styles.offlineCopy}>
            <Text style={styles.offlineTitle}>You&apos;re offline</Text>
            <Text style={styles.offlineDetail}>Showing saved routes and fares.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Manage offline data" onPress={() => onNavigate('Profile')}>
            <Text style={styles.offlineAction}>Manage</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick access</Text>
        </View>
        <View style={styles.tileGrid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.tileRow}>
              {quickAccess.slice(row * 3, row * 3 + 3).map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => handleQuickAccess(item.destination)}
                  style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                >
                  <View style={[styles.tileIcon, item.label === 'AI Assistant' && styles.tileIconAccent]}>
                    <MaterialIcon
                      name={item.icon}
                      size={22}
                      color={item.label === 'AI Assistant' ? colors.quickIconAccent : colors.quickIcon}
                    />
                  </View>
                  <Text style={styles.tileLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.exploreBanner}>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerEyebrow}>YOUR ISLAND, YOUR WAY</Text>
          <Text style={styles.bannerTitle}>Explore{'\n'}Marinduque</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore Marinduque on the map"
            onPress={() => onNavigate('Map')}
            style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}
          >
            <Text style={styles.bannerButtonText}>Explore island</Text>
            <MaterialIcon name="arrowForward" size={16} color={colors.lime} />
          </Pressable>
        </View>
        <View pointerEvents="none" style={styles.bannerArt}>
          <View style={styles.bannerOrbOuter} />
          <View style={styles.bannerOrbInner} />
          <View style={styles.bannerRoute} />
          <View style={styles.bannerPin}><MaterialIcon name="location" size={23} color={colors.greenDark} /></View>
          <View style={styles.bannerTownTag}><Text style={styles.bannerTownTagText}>6 towns</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Routes</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="See all routes" onPress={() => onNavigate('Map')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.routeGroup}>
          {demoRoutes.slice(0, 3).map((route, index) => (
            <View key={route.id}>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${route.name}, ${route.duration}, ${route.fare}`}
                onPress={() => onNavigate('Map')}
                style={({ pressed }) => [styles.routeRow, pressed && styles.rowPressed]}
              >
                <View style={styles.routeIcon}>
                  <MaterialIcon name="route" size={21} color={colors.green} />
                </View>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeMeta}>{route.duration}  ·  {route.fare}</Text>
                </View>
                {route.status === 'Limited units' && <View style={styles.limitedBadge}><Text style={styles.limitedText}>Limited</Text></View>}
                <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Sample data — live information coming soon.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pageContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greetingCopy: { flex: 1 },
    dateText: { fontSize: 12, lineHeight: 17, fontWeight: '700', letterSpacing: 0.65, textTransform: 'uppercase', color: colors.muted, marginBottom: 7 },
    largeTitle: { fontSize: 25, lineHeight: 30, fontWeight: '500', letterSpacing: -0.45, color: colors.ink },
    nameTitle: { fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.75, color: colors.ink },
    settingsButton: { width: 44, height: 44, marginLeft: 12, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    searchField: { height: 52, marginTop: 21, paddingLeft: 15, paddingRight: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center' },
    searchInput: { flex: 1, height: '100%', marginLeft: 10, paddingVertical: 0, color: colors.ink, fontSize: 14, lineHeight: 20 },
    searchAction: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    section: { marginTop: 24 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3, color: colors.ink },
    sectionAction: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.green },
    tileGrid: { gap: 10 },
    tileRow: { flexDirection: 'row', gap: 10 },
    quickTile: { flex: 1, minHeight: 95, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', gap: 8 },
    tilePressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
    tileIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    tileIconAccent: { backgroundColor: colors.orangeLight },
    tileLabel: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
    exploreBanner: { height: 174, marginTop: 23, paddingLeft: 19, paddingVertical: 17, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.green, flexDirection: 'row' },
    bannerCopy: { zIndex: 2, flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
    bannerEyebrow: { color: '#D5E9D9', fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.05, marginBottom: 5 },
    bannerTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 27, fontWeight: '800', letterSpacing: -0.55 },
    bannerButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, minHeight: 30 },
    bannerButtonText: { color: colors.lime, fontSize: 12, lineHeight: 16, fontWeight: '800' },
    bannerArt: { position: 'absolute', right: -3, top: 0, bottom: 0, width: 162 },
    bannerOrbOuter: { position: 'absolute', width: 164, height: 164, borderRadius: 82, right: -12, top: 12, backgroundColor: '#2C805F' },
    bannerOrbInner: { position: 'absolute', width: 119, height: 119, borderRadius: 60, right: 13, top: 34, borderWidth: 1, borderColor: 'rgba(230,246,226,0.35)', backgroundColor: 'rgba(16,84,58,0.33)' },
    bannerRoute: { position: 'absolute', width: 70, height: 70, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#C6F06A', borderTopRightRadius: 36, transform: [{ rotate: '18deg' }], right: 39, top: 61 },
    bannerPin: { position: 'absolute', width: 38, height: 38, borderRadius: 14, right: 44, top: 46, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
    bannerTownTag: { position: 'absolute', right: 9, bottom: 25, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF' },
    bannerTownTagText: { color: colors.greenDark, fontSize: 9, lineHeight: 12, fontWeight: '800' },
    routeGroup: { borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 67 },
    routeRow: { minHeight: 70, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
    rowPressed: { backgroundColor: colors.selectedCardBg },
    routeIcon: { width: 40, height: 40, borderRadius: 14, marginRight: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    routeCopy: { flex: 1 },
    routeName: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: colors.ink },
    routeMeta: { marginTop: 2, fontSize: 11, lineHeight: 15, fontWeight: '500', color: colors.muted },
    limitedBadge: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.orangeLight, marginRight: 5 },
    limitedText: { fontSize: 9, lineHeight: 12, fontWeight: '800', color: colors.orange },
    offlineCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13, backgroundColor: colors.orangeLight },
    offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange, marginRight: 9 },
    offlineCopy: { flex: 1 },
    offlineTitle: { fontSize: 13, lineHeight: 17, fontWeight: '700', color: colors.ink },
    offlineDetail: { fontSize: 11, lineHeight: 15, color: colors.muted },
    offlineAction: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.green, marginLeft: 8 },
    pressed: { opacity: 0.75 },
    footer: { fontSize: 11, lineHeight: 15, fontWeight: '400', color: colors.muted, textAlign: 'center', marginTop: 20 },
  });
}
