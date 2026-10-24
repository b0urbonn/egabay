import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useColors, useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

export function BrandMark({ size = 31 }: { size?: number }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={[styles.brandMark, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Text style={[styles.brandMarkText, { fontSize: size * 0.7, lineHeight: size * 0.8 }]}>e</Text>
    </View>
  );
}

export function Eyebrow({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const styles = useThemeStyles(createStyles);
  return <Text style={[styles.eyebrow, style]}>{children.toUpperCase()}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useThemeStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  label,
  tone = 'green',
}: {
  label: string;
  tone?: 'green' | 'orange' | 'neutral';
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={[styles.badge, tone === 'orange' && styles.badgeOrange, tone === 'neutral' && styles.badgeNeutral]}>
      <Text style={[styles.badgeText, tone === 'orange' && styles.badgeTextOrange, tone === 'neutral' && styles.badgeTextNeutral]}>
        {label}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        {eyebrow && <Eyebrow style={styles.sectionEyebrow}>{eyebrow}</Eyebrow>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.screenHeader}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={styles.pageTitle}>{title}</Text>
      {intro && <Text style={styles.pageIntro}>{intro}</Text>}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  glyph,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  glyph?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        inactive && styles.buttonDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.green} size="small" />
      ) : (
        <>
          {glyph && (
            <Text style={[styles.buttonGlyph, variant !== 'primary' && styles.buttonGlyphAlt]}>{glyph}</Text>
          )}
          <Text
            style={[
              styles.buttonText,
              variant === 'secondary' && styles.buttonTextSecondary,
              variant === 'ghost' && styles.buttonTextGhost,
              inactive && styles.buttonTextDisabled,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secure = false,
  autoCapitalize = 'sentences',
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  hint?: string;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [hidden, setHidden] = useState(secure);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <View style={[styles.field, error && styles.fieldError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          style={styles.fieldInput}
        />
        {secure && (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Text style={styles.fieldToggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.fieldErrorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerGlyph}>!</Text>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

export function Divider({ label }: { label?: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      {label && <Text style={styles.dividerLabel}>{label}</Text>}
      <View style={styles.dividerLine} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    brandMark: { backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    brandMarkText: { color: colors.lime, fontWeight: '900' },
    eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.35, marginBottom: 7 },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 15 },
    badge: { backgroundColor: colors.greenLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
    badgeOrange: { backgroundColor: colors.orangeLight },
    badgeNeutral: { backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    badgeText: { color: colors.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
    badgeTextOrange: { color: colors.orange },
    badgeTextNeutral: { color: colors.muted },
    chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, paddingHorizontal: 13, paddingVertical: 8 },
    chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
    chipText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
    chipTextSelected: { color: '#FFFFFF' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    sectionEyebrow: { marginBottom: 5 },
    sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.35 },
    screenHeader: { gap: 0 },
    pageTitle: { color: colors.ink, fontSize: 35, lineHeight: 39, letterSpacing: -1.4, fontWeight: '800' },
    pageIntro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 330 },
    button: { height: 52, borderRadius: radius.md, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
    buttonSecondary: { backgroundColor: colors.greenLight },
    buttonGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.line },
    buttonDisabled: { opacity: 0.55 },
    buttonGlyph: { color: colors.lime, fontSize: 16, fontWeight: '700' },
    buttonGlyphAlt: { color: colors.green },
    buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    buttonTextSecondary: { color: colors.greenDark },
    buttonTextGhost: { color: colors.ink },
    buttonTextDisabled: { color: '#FFFFFF' },
    fieldWrap: { gap: 6 },
    fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
    field: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 14 },
    fieldError: { borderColor: colors.red },
    fieldInput: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600', padding: 0 },
    fieldToggle: { color: colors.green, fontSize: 11, fontWeight: '800', marginLeft: 10 },
    fieldErrorText: { color: colors.red, fontSize: 10, fontWeight: '700' },
    fieldHint: { color: colors.muted, fontSize: 10 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.orangeLight, borderRadius: radius.md, padding: 12 },
    errorBannerGlyph: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.orange, color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center', lineHeight: 22, overflow: 'hidden' },
    errorBannerText: { flex: 1, color: colors.connectTitle, fontSize: 11, fontWeight: '700', lineHeight: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
    dividerLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  });
}
