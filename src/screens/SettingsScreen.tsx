import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '../components/ui';
import type { AppearanceSetting } from '../lib/appearance';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

type AppearanceOption = {
  value: AppearanceSetting;
  glyph: string;
  title: string;
  detail: string;
};

const appearanceOptions: AppearanceOption[] = [
  { value: 'system', glyph: '◐', title: 'System', detail: 'Match your device setting' },
  { value: 'light', glyph: '☀', title: 'Light', detail: 'Always use light colors' },
  { value: 'dark', glyph: '☾', title: 'Dark', detail: 'Easier on the eyes at night' },
];

export function SettingsScreen({
  appearance,
  onChangeAppearance,
  onReset,
  onBack,
}: {
  appearance: AppearanceSetting;
  onChangeAppearance: (setting: AppearanceSetting) => void;
  onReset: () => void;
  onBack: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    if (!resetArmed) return;
    const timer = setTimeout(() => setResetArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [resetArmed]);

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backGlyph}>←</Text>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <ScreenHeader eyebrow="Settings" title={'Make it\nyours.'} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.sectionBody}>Choose a look, or follow your device.</Text>
        <View style={styles.optionList}>
          {appearanceOptions.map((option) => {
            const selected = appearance === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onChangeAppearance(option.value)}
                style={({ pressed }) => [styles.optionRow, selected && styles.optionRowSelected, pressed && styles.pressed]}
              >
                <View style={[styles.optionGlyphWrap, selected && styles.optionGlyphWrapSelected]}>
                  <Text style={[styles.optionGlyph, selected && styles.optionGlyphSelected]}>{option.glyph}</Text>
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDetail}>{option.detail}</Text>
                </View>
                <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
                  {selected && <View style={styles.optionRadioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Reset eGABAY</Text>
        <Text style={styles.dangerBody}>
          Clears your session, mode, appearance, and onboarding on this device, then shows first-time
          setup again. Created mock accounts are kept.
        </Text>
        <Pressable
          onPress={() => (resetArmed ? onReset() : setResetArmed(true))}
          style={({ pressed }) => [styles.resetButton, resetArmed && styles.resetButtonArmed, pressed && styles.pressed]}
        >
          <Text style={[styles.resetButtonText, resetArmed && styles.resetButtonTextArmed]}>
            {resetArmed ? 'Tap again to confirm' : 'Reset app'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.versionNote}>eGABAY · v1.0.0 · Marinduque pilot</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.85 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34, gap: 18 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    backGlyph: { color: colors.green, fontSize: 18, fontWeight: '700' },
    backText: { color: colors.green, fontSize: 12, fontWeight: '800' },
    section: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 15 },
    sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    sectionBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    optionList: { marginTop: 12, gap: 8 },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 11 },
    optionRowSelected: { borderColor: colors.green, backgroundColor: colors.selectedCardBg },
    optionGlyphWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    optionGlyphWrapSelected: { backgroundColor: colors.green },
    optionGlyph: { color: colors.green, fontSize: 17, fontWeight: '700' },
    optionGlyphSelected: { color: colors.lime },
    optionCopy: { flex: 1 },
    optionTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    optionDetail: { color: colors.muted, fontSize: 9, marginTop: 2 },
    optionRadio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    optionRadioSelected: { borderColor: colors.green },
    optionRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green },
    dangerCard: { borderWidth: 1, borderColor: colors.connectBorder, backgroundColor: colors.connectBg, padding: 15, borderRadius: radius.md },
    dangerTitle: { color: colors.connectTitle, fontSize: 12, fontWeight: '800' },
    dangerBody: { color: colors.connectBody, fontSize: 10, lineHeight: 15, marginTop: 6 },
    resetButton: { marginTop: 12, height: 42, borderRadius: 13, borderWidth: 1.5, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' },
    resetButtonArmed: { backgroundColor: colors.red },
    resetButtonText: { color: colors.red, fontSize: 12, fontWeight: '800' },
    resetButtonTextArmed: { color: '#FFFFFF' },
    versionNote: { color: colors.muted, fontSize: 9, textAlign: 'center' },
  });
}
