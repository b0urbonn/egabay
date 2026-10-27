import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../../components/MaterialIcon';
import { Chip } from '../../components/ui';
import type { ThemeColors } from '../../theme';
import type { AdminAuditEvent } from '../../types/admin';
import { shortDate } from './api';
import type { Styles } from './styles';
import type { Section } from './types';

export function NavigationItem({ item, selected, onPress, styles, colors, compact = false }: {
  item: { id: Section; label: string; icon: MaterialIconName }; selected: boolean; onPress: () => void;
  styles: Styles; colors: ThemeColors; compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[compact ? styles.mobileNavItem : styles.navItem, selected && (compact ? styles.mobileNavSelected : styles.navSelected)]}>
    <MaterialIcon name={item.icon} size={18} color={selected ? colors.greenDark : colors.muted} />
    <Text style={[compact ? styles.mobileNavLabel : styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
    {!compact && selected && <View style={styles.navIndicator} />}
  </Pressable>;
}

export function QuickLink({ label, detail, icon, onPress, styles }: { label: string; detail: string; icon: MaterialIconName; onPress: () => void; styles: Styles }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickLink}><View style={styles.quickIcon}><MaterialIcon name={icon} size={17} color={styles.colors.green} /></View><View style={styles.quickCopy}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickDetail}>{detail}</Text></View><MaterialIcon name="chevronRight" size={18} color={styles.colors.muted} /></Pressable>;
}

export function RegistryHeader({ labels, styles }: { labels: string[]; styles: Styles }) {
  if (!styles.wide) return null;
  return <View style={styles.registryHeader}><Text style={styles.registryPrimary}>{labels[0]}</Text><Text style={styles.registrySecondary}>{labels[1]}</Text><Text style={styles.registryStatus}>Status</Text><Text style={styles.registryAction}>Details</Text></View>;
}

export function RecordAction({ onPress, label, styles }: { onPress: () => void; label: string; styles: Styles }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.recordAction}><Text style={styles.panelAction}>View</Text><MaterialIcon name="chevronRight" size={17} color={styles.colors.greenDark} /></Pressable>;
}

export function ListToolbar({ title, count, filter, setFilter, options, styles }: { title: string; count: number; filter: string; setFilter: (value: string) => void; options: string[]; styles: Styles }) {
  return <View style={styles.listToolbar}><View><Text style={styles.panelTitle}>{title}</Text><Text style={styles.panelSubtitle}>{count} record{count === 1 ? '' : 's'} shown</Text></View><ScrollView horizontal style={styles.filterScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{options.map((option) => <Chip comfortable key={option} label={option} selected={filter === option} onPress={() => setFilter(option)} />)}</ScrollView></View>;
}

export function StandbyNotice({ text, styles }: { text: string; styles: Styles }) {
  return <View style={styles.standbyNotice}><MaterialIcon name="info" size={16} color={styles.colors.blue} /><Text style={styles.standbyText}>{text}</Text></View>;
}

export function StatusPill({ label, tone, styles }: { label: string; tone: 'green' | 'orange' | 'neutral'; styles: Styles }) {
  return <View style={[styles.statusPill, tone === 'orange' ? styles.statusOrange : tone === 'neutral' ? styles.statusNeutral : styles.statusGreen]}><Text style={[styles.statusText, tone === 'orange' ? styles.statusTextOrange : tone === 'neutral' ? styles.statusTextNeutral : styles.statusTextGreen]}>{label}</Text></View>;
}

export function EmptyState({ title, body, styles }: { title: string; body: string; styles: Styles }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><MaterialIcon name="search" size={22} color={styles.colors.muted} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

export function LoadingRows({ styles }: { styles: Styles }) {
  return <View style={styles.loadingRows}><ActivityIndicator color={styles.colors.green} /><Text style={styles.panelSubtitle}>Loading verified records…</Text></View>;
}

export function ActivityRow({ event, actor, styles, detailed = false }: { event: AdminAuditEvent; actor?: string; styles: Styles; detailed?: boolean }) {
  return <View style={styles.activityRow}><View style={styles.activityMark}><MaterialIcon name="history" size={15} color={styles.colors.green} /></View><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.action.replaceAll('_', ' ')} <Text style={styles.activityTable}>· {event.table_name.replaceAll('_', ' ')}</Text></Text><Text style={styles.activityMeta}>{actor ?? 'Administrator'} · {shortDate(event.created_at)}{detailed && event.record_id ? ` · Record ${event.record_id.slice(0, 8)}` : ''}</Text></View></View>;
}

export function ReportBar({ label, value, max, loading, styles, tone = 'green' }: { label: string; value: number; max: number; loading: boolean; styles: Styles; tone?: 'green' | 'orange' }) {
  return <View style={styles.reportBarRow}><View style={styles.reportBarHeader}><Text style={styles.coverageName}>{label}</Text><Text style={styles.coverageCount}>{loading ? '—' : value}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, tone === 'orange' && styles.barFillOrange, { width: `${(value / max) * 100}%` }]} /></View></View>;
}
