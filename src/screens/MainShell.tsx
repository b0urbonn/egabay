import { useEffect, useState } from 'react';
import { BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { MapTabIcon } from '../components/MapTabIcon';
import { MarinduqueMap } from '../components/MarinduqueMap';
import type { AppMode } from '../lib/appMode';
import type { AppearanceSetting } from '../lib/appearance';
import type { Session } from '../lib/session';
import { useColors, useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';
import { HomeScreen } from './HomeScreen';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';

export type Tab = 'Home' | 'Map' | 'Profile';

const tabs: { label: Tab; glyph?: string }[] = [
  { label: 'Home', glyph: '⌂' },
  { label: 'Map' },
  { label: 'Profile', glyph: '○' },
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
        ) : (
          <>
            {activeTab === 'Home' && <HomeScreen session={session} mode={mode} onNavigate={setActiveTab} />}
            {activeTab === 'Map' && <MapScreen />}
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
          const selected = !showSettings && activeTab === tab.label;
          return (
            <Pressable style={styles.tabItem} key={tab.label} onPress={() => { setShowSettings(false); setActiveTab(tab.label); }}>
              <View style={[styles.tabGlyphWrap, selected && styles.tabGlyphWrapSelected]}>
                {tab.label === 'Map' ? (
                  <MapTabIcon
                    color={selected ? colors.green : colors.muted}
                    background={selected ? colors.greenLight : colors.card}
                  />
                ) : (
                  <Text style={[styles.tabGlyph, selected && styles.tabGlyphSelected]}>{tab.glyph}</Text>
                )}
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
    tabBar: { minHeight: 67, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 5, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around' },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    tabGlyphWrap: { width: 34, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    tabGlyphWrapSelected: { backgroundColor: colors.greenLight },
    tabGlyph: { color: colors.muted, fontSize: 18, lineHeight: 21, fontWeight: '600' },
    tabGlyphSelected: { color: colors.green, fontWeight: '900' },
    tabLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
    tabLabelSelected: { color: colors.greenDark },
  });
}
