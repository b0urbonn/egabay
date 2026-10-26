import { useEffect, useState } from 'react';
import { BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { MarinduqueMap } from '../components/MarinduqueMap';
import type { AppMode } from '../lib/appMode';
import type { AppearanceSetting } from '../lib/appearance';
import type { Session } from '../lib/session';
import { useColors, useThemeStyles } from '../lib/theme';
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
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminals, setShowTerminals] = useState(false);
  useEffect(() => {
    if (!showSettings) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowSettings(false);
      return true;
    });
    return () => sub.remove();
  }, [showSettings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
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
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = !showSettings && !showTerminals && activeTab === tab.label;
          return (
            <Pressable
              style={styles.tabItem}
              key={tab.label}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected }}
              onPress={() => { setShowSettings(false); setShowTerminals(false); setActiveTab(tab.label); }}
            >
              <View style={[styles.tabGlyphWrap, selected && styles.tabGlyphWrapSelected]}>
                <MaterialIcon name={tab.icon} size={21} color={selected ? colors.green : colors.muted} />
              </View>
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    screen: { flex: 1 },
    tabBar: { minHeight: 70, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around' },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    tabGlyphWrap: { width: 38, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tabGlyphWrapSelected: { backgroundColor: colors.greenLight },
    tabLabel: { color: colors.muted, fontSize: 10, lineHeight: 12, fontWeight: '700' },
    tabLabelSelected: { color: colors.greenDark },
  });
}
