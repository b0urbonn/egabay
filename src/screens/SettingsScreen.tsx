import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/ui';
import type { AppearanceSetting } from '../lib/appearance';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

type AppearanceOption = {
  value: AppearanceSetting;
  title: string;
  detail: string;
};

const appearanceOptions: AppearanceOption[] = [
  { value: 'system', title: 'System', detail: 'Follow your device setting' },
  { value: 'light', title: 'Light', detail: 'Use light appearance' },
  { value: 'dark', title: 'Dark', detail: 'Use dark appearance' },
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to profile"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backGlyph}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text accessibilityRole="header" style={styles.pageTitle}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionDetail}>Choose how eGABAY looks.</Text>
        </View>
        <Card style={styles.optionCard}>
          {appearanceOptions.map((option, index) => {
            const selected = appearance === option.value;
            return (
              <View key={option.value}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${option.title}, ${option.detail}`}
                  accessibilityState={{ selected }}
                  onPress={() => onChangeAppearance(option.value)}
                  style={({ pressed }) => [styles.optionRow, selected && styles.optionRowSelected, pressed && styles.pressed]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
                {index < appearanceOptions.length - 1 && <View style={styles.optionDivider} />}
              </View>
            );
          })}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reset app</Text>
        <Card style={styles.resetCard}>
          <Text style={styles.resetDetail}>
            Clears your session and settings on this device, then returns to setup. Mock accounts stay saved.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resetArmed ? 'Tap again to confirm app reset' : 'Reset app'}
            accessibilityHint="Clears this device's session and preferences"
            onPress={() => (resetArmed ? onReset() : setResetArmed(true))}
            style={({ pressed }) => [styles.resetButton, resetArmed && styles.resetButtonArmed, pressed && styles.pressed]}
          >
            <Text style={[styles.resetButtonText, resetArmed && styles.resetButtonTextArmed]}>
              {resetArmed ? 'Tap again to confirm' : 'Reset eGABAY'}
            </Text>
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.72 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 32, gap: 22 },
    backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingRight: 12 },
    backGlyph: { color: colors.green, fontSize: 24, lineHeight: 28 },
    backText: { color: colors.green, fontSize: 15, fontWeight: '600' },
    pageTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: '700' },
    section: { gap: 9 },
    sectionHeading: { gap: 3 },
    sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
    sectionDetail: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    optionCard: { padding: 0, overflow: 'hidden' },
    optionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
    optionRowSelected: { backgroundColor: colors.selectedCardBg },
    optionCopy: { flex: 1, gap: 3 },
    optionTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
    optionDetail: { color: colors.muted, fontSize: 13, lineHeight: 17 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    radioSelected: { borderColor: colors.green },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.green },
    optionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 16 },
    resetCard: { gap: 14, backgroundColor: colors.connectBg, borderColor: colors.connectBorder },
    resetDetail: { color: colors.connectBody, fontSize: 13, lineHeight: 19 },
    resetButton: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    resetButtonArmed: { backgroundColor: colors.red },
    resetButtonText: { color: colors.red, fontSize: 15, fontWeight: '600' },
    resetButtonTextArmed: { color: '#FFFFFF' },
  });
}
