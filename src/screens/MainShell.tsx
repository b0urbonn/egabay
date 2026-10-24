import { useEffect, useState } from 'react';
import { BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Badge, BrandMark } from '../components/ui';
import type { AppMode } from '../lib/appMode';
import type { AppearanceSetting } from '../lib/appearance';
import type { Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { spacing, type ThemeColors } from '../theme';
import { HomeScreen } from './HomeScreen';
import { PlanScreen } from './PlanScreen';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { UpdatesScreen } from './UpdatesScreen';

export type Tab = 'Home' | 'Plan' | 'Updates' | 'Profile';

const tabs: { label: Tab; glyph: string }[] = [
  { label: 'Home', glyph: '⌂' },
  { label: 'Plan', glyph: '↗' },
  { label: 'Updates', glyph: '◉' },
  { label: 'Profile', glyph: '○' },
];

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
      <View style={styles.appHeader}>
        <BrandMark />
        <Text style={styles.brandName}>eGABAY</Text>
        <View style={styles.headerSpacer} />
        {mode === 'offline' && <Badge label="OFFLINE" tone="orange" />}
        <Badge label="MARINDUQUE" />
        <Pressable onPress={() => setShowSettings(true)} style={styles.gearButton} hitSlop={6}>
          <Text style={styles.gearGlyph}>⚙</Text>
        </Pressable>
      </View>
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
            {activeTab === 'Plan' && <PlanScreen mode={mode} />}
            {activeTab === 'Updates' && <UpdatesScreen mode={mode} />}
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
                <Text style={[styles.tabGlyph, selected && styles.tabGlyphSelected]}>{tab.glyph}</Text>
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
    appHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
    brandName: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: 1.1 },
    headerSpacer: { flex: 1 },
    gearButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    gearGlyph: { color: colors.ink, fontSize: 15 },
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
