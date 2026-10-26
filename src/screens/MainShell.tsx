import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { MarinduqueMap } from '../components/MarinduqueMap';
import type { AppMode } from '../lib/appMode';
import type { AppearanceSetting } from '../lib/appearance';
import type { Session } from '../lib/session';
import { useColors, useThemeStyles } from '../lib/theme';
import { useWideLayout } from '../lib/useWideLayout';
import type { ThemeColors } from '../theme';
import { HomeScreen } from './HomeScreen';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { TerminalsScreen } from './TerminalsScreen';
import { TripsScreen } from './TripsScreen';

export type Tab = 'Home' | 'Map' | 'Trips' | 'Profile';

const tabs: { label: Tab; icon: MaterialIconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Map', icon: 'map' },
  { label: 'Trips', icon: 'liveTrips' },
  { label: 'Profile', icon: 'person' },
];

function MapScreen() {
  return <MarinduqueMap fullscreen />;
}

export function MainShell({
  session,
  mode,
  onChangeMode,
  appearance,
  onChangeAppearance,
  onReset,
  onLogout,
  onAuthRequest,
}: {
  session: Session;
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  appearance: AppearanceSetting;
  onChangeAppearance: (setting: AppearanceSetting) => void;
  onReset: () => void;
  onLogout: () => void;
  onAuthRequest: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  // Wide web renders as a desktop app: side navigation rail + content area.
  const isWide = useWideLayout();
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminals, setShowTerminals] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const railAnim = useRef(new Animated.Value(1)).current; // 1 = open, 0 = hidden
  const toggleRail = () => {
    const next = !railOpen;
    setRailOpen(next);
    Animated.timing(railAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (!showSettings) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowSettings(false);
      return true;
    });
    return () => sub.remove();
  }, [showSettings]);

  const selectTab = (tab: Tab) => { setShowSettings(false); setShowTerminals(false); setActiveTab(tab); };
  const isSelected = (tab: Tab) => !showSettings && !showTerminals && activeTab === tab;
  // List-style screens read best in a centered column; the map takes the
  // whole content area on wide screens.
  const constrainContent = isWide && (showSettings || showTerminals || activeTab !== 'Map');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={isWide ? styles.wideRow : styles.column}>
        {isWide && (
          <Animated.View
            style={[styles.rail, {
              width: railAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 214] }),
              opacity: railAnim,
            }]}
            pointerEvents={railOpen ? 'auto' : 'none'}
          >
            <View style={styles.railInner}>
              <Pressable
                style={styles.railBrand}
                accessibilityRole="button"
                accessibilityLabel="Hide navigation sidebar"
                onPress={toggleRail}
              >
                <View style={styles.railMark}><Text style={styles.railMarkText}>e</Text></View>
                <Text style={styles.railName}>eGABAY</Text>
              </Pressable>
              {tabs.map((tab) => {
                const selected = isSelected(tab.label);
                return (
                  <Pressable
                    style={[styles.railItem, selected && styles.railItemSelected]}
                    key={tab.label}
                    accessibilityRole="button"
                    accessibilityLabel={`${tab.label} tab`}
                    accessibilityState={{ selected }}
                    onPress={() => selectTab(tab.label)}
                  >
                    <MaterialIcon name={tab.icon} size={20} color={selected ? colors.green : colors.muted} />
                    <Text style={[styles.railLabel, selected && styles.railLabelSelected]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
        {isWide && (
          <Animated.View
            style={[styles.railToggle, {
              opacity: railAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            }]}
            pointerEvents={railOpen ? 'none' : 'auto'}
          >
            <Pressable
              style={styles.railToggleBtn}
              accessibilityRole="button"
              accessibilityLabel="Show navigation sidebar"
              onPress={toggleRail}
            >
              <View style={styles.railMark}><Text style={styles.railMarkText}>e</Text></View>
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.screen}>
          <View style={constrainContent ? styles.screenColumn : styles.screenFill}>
            {showSettings ? (
              <SettingsScreen
                appearance={appearance}
                onChangeAppearance={onChangeAppearance}
                onReset={onReset}
                onBack={() => setShowSettings(false)}
              />
            ) : showTerminals ? (
              <TerminalsScreen onBack={() => setShowTerminals(false)} />
            ) : (
              <>
                {activeTab === 'Home' && (
                  <HomeScreen
                    session={session}
                    mode={mode}
                    onNavigate={setActiveTab}
                    onOpenTerminals={() => setShowTerminals(true)}
                    onOpenSettings={() => setShowSettings(true)}
                  />
                )}
                {activeTab === 'Map' && <MapScreen />}
                {activeTab === 'Trips' && <TripsScreen />}
                {activeTab === 'Profile' && (
                  <ProfileScreen
                    session={session}
                    mode={mode}
                    onChangeMode={onChangeMode}
                    onOpenSettings={() => setShowSettings(true)}
                    onLogout={onLogout}
                    onAuthRequest={onAuthRequest}
                  />
                )}
              </>
            )}
          </View>
        </View>
        {!isWide && (
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const selected = isSelected(tab.label);
              return (
                <Pressable
                  style={styles.tabItem}
                  key={tab.label}
                  accessibilityRole="button"
                  accessibilityLabel={`${tab.label} tab`}
                  accessibilityState={{ selected }}
                  onPress={() => selectTab(tab.label)}
                >
                  <View style={[styles.tabGlyphWrap, selected && styles.tabGlyphWrapSelected]}>
                    <MaterialIcon name={tab.icon} size={21} color={selected ? colors.green : colors.muted} />
                  </View>
                  <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    column: { flex: 1 },
    wideRow: { flex: 1, flexDirection: 'row' },
    screen: { flex: 1 },
    screenFill: { flex: 1 },
    screenColumn: { flex: 1, width: '100%', maxWidth: 1240, alignSelf: 'center' },
    rail: { width: 214, overflow: 'hidden' },
    railInner: { width: 214, flex: 1, borderRightWidth: 1, borderRightColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 18, gap: 4 },
    railBrand: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, marginBottom: 16 },
    railMark: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    railMarkText: { color: colors.lime, fontSize: 18, fontWeight: '900', lineHeight: 21 },
    railName: { color: colors.ink, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    railItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    railItemSelected: { backgroundColor: colors.greenLight },
    railLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    railLabelSelected: { color: colors.greenDark },
    railToggle: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
    railToggleBtn: { padding: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    tabBar: { minHeight: 70, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around' },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    tabGlyphWrap: { width: 38, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tabGlyphWrapSelected: { backgroundColor: colors.greenLight },
    tabLabel: { color: colors.muted, fontSize: 10, lineHeight: 12, fontWeight: '700' },
    tabLabelSelected: { color: colors.greenDark },
  });
}
