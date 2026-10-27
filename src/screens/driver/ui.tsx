import { Pressable, Text, View } from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../../components/MaterialIcon';
import type { AppearanceSetting } from '../../lib/appearance';
import { useColors, useThemeStyles } from '../../lib/theme';
import { appearanceOptions } from './data';
import { createStyles } from './styles';
import type { DriverTab } from './types';

export function DriverNavButton({
  item,
  selected,
  onPress,
  compact = false,
}: {
  item: { label: DriverTab; icon: MaterialIconName };
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={compact ? 'tab' : 'button'}
      accessibilityLabel={`${item.label}${compact ? ' tab' : ''}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.bottomTab : styles.sideTab,
        selected && (compact ? styles.bottomTabSelected : styles.sideTabSelected),
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcon name={item.icon} size={compact ? 22 : 20} color={selected ? colors.greenDark : colors.muted} />
      <Text style={[compact ? styles.bottomTabText : styles.sideTabText, selected && styles.navTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  first = false,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  first?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <View style={[styles.infoRow, !first && styles.infoRowBorder]}>
      <View style={styles.rowIcon}><MaterialIcon name={icon} size={18} color={colors.green} /></View>
      <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function ActionRow({ label, onPress, first = false }: { label: string; onPress: () => void; first?: boolean }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, !first && styles.infoRowBorder, pressed && styles.rowPressed]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
    </Pressable>
  );
}

export function AppearanceSelector({
  value,
  onChange,
}: {
  value: AppearanceSetting;
  onChange: (setting: AppearanceSetting) => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.appearanceControl}>
      {appearanceOptions.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${option.label} appearance`}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.appearanceOption,
              selected && styles.appearanceOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.appearanceOptionLabel, selected && styles.appearanceOptionLabelSelected]}>
              {option.label}
            </Text>
            {selected && <Text style={styles.appearanceCheck}>✓</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'DR';
}

export function maskLicense(license: string) {
  if (license.length <= 4) return license;
  return `••••${license.slice(-2)}`;
}
