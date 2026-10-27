import { Pressable, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';

import { MaterialIcon, type MaterialIconName } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';

export function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.searchField}><MaterialIcon name="search" size={20} color={colors.muted} /><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} /></View>;
}

export function FormError({ message }: { message: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.formError} accessibilityRole="alert"><Text style={styles.formErrorText}>{message}</Text></View>;
}

export function CoordinateFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const styles = useThemeStyles(createStyles);
  const [latitude = '', longitude = ''] = value.split(',').map((part) => part.trim());
  return <View style={styles.coordinatePicker}>
    <View style={styles.coordinateRow}>
      <View style={styles.coordinateCell}><Input label="Latitude" value={latitude} placeholder="13.4460" onChangeText={(next) => onChange(`${next}, ${longitude}`)} /></View>
      <View style={styles.coordinateCell}><Input label="Longitude" value={longitude} placeholder="121.8400" onChangeText={(next) => onChange(`${latitude}, ${next}`)} /></View>
    </View>
    <Text style={styles.composerHint}>Enter the confirmed terminal coordinates. Latitude: −90 to 90. Longitude: −180 to 180.</Text>
  </View>;
}

export function MetricCard({ wide, label, value, icon, tone }: { wide: boolean; label: string; value: string; icon: MaterialIconName; tone: 'green' | 'blue' | 'purple' | 'orange' }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const iconColor = tone === 'blue' ? colors.blue : tone === 'purple' ? colors.purple : tone === 'orange' ? colors.orange : colors.green;
  return <Card style={[styles.metricCard, wide && styles.metricCardWide]}>
    <View style={[styles.metricIcon, tone === 'blue' && styles.metricBlue, tone === 'purple' && styles.metricPurple, tone === 'orange' && styles.metricOrange]}><MaterialIcon name={icon} size={17} color={iconColor} /></View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </Card>;
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.sectionHeading}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><MaterialIcon name="chevronRight" size={15} color={colors.green} /></Pressable>}
  </View>;
}

export function OperationRow({ icon, title, detail, onPress }: { icon: MaterialIconName; title: string; detail: string; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.operationRow, pressed && styles.pressed]}>
    <View style={styles.operationIcon}><MaterialIcon name={icon} size={17} color={colors.green} /></View>
    <View style={styles.operationCopy}><Text style={styles.operationTitle}>{title}</Text><Text style={styles.operationDetail}>{detail}</Text></View>
    <MaterialIcon name="chevronRight" size={17} color={colors.muted} />
  </Pressable>;
}

export function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.screenTitleBlock}><Text style={styles.screenEyebrow}>{eyebrow}</Text><Text style={styles.screenHeading}>{title}</Text><Text style={styles.screenSubtitle}>{subtitle}</Text></View>;
}

export function MiniAction({ label, icon, onPress }: { label: string; icon: MaterialIconName; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.miniAction}><MaterialIcon name={icon} size={15} color={colors.green} /><Text style={styles.miniActionText}>{label}</Text></Pressable>;
}

export function StatusPill({ label, tone }: { label: string; tone: 'green' | 'orange' | 'gray' }) {
  const styles = useThemeStyles(createStyles);
  return <View style={[styles.statusPill, tone === 'orange' && styles.statusPillOrange, tone === 'gray' && styles.statusPillGray]}><Text style={[styles.statusPillText, tone === 'orange' && styles.statusPillTextOrange, tone === 'gray' && styles.statusPillTextGray]}>{label}</Text></View>;
}

export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.choiceChip, selected && styles.choiceChipSelected]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>;
}

export function Input({
  label, value, placeholder, onChangeText, multiline = false, autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.inputGroup}>
    <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.multilineInput]}
    />
  </View>;
}

export function FormPanel({ children, title, onCancel }: { children: ReactNode; title: string; onCancel: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Card style={styles.formPanel}>
    <View style={styles.formHeadingRow}><Text style={styles.formTitle}>{title}</Text><Pressable onPress={onCancel} style={styles.dismissButton} accessibilityRole="button" accessibilityLabel="Close form"><Text style={styles.formCancel}>Cancel</Text></Pressable></View>
    {children}
    <Text style={styles.localOnly}>Demo changes reset when you leave this workspace</Text>
  </Card>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const styles = useThemeStyles(createStyles);
  return <Card style={styles.emptyState}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></Card>;
}

export function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
