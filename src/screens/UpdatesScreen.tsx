import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip, ScreenHeader } from '../components/ui';
import { demoAlerts } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

const filters = ['All', 'Notices', 'Info'] as const;
type Filter = (typeof filters)[number];

export function UpdatesScreen({ mode }: { mode: AppMode }) {
  const styles = useThemeStyles(createStyles);
  const [filter, setFilter] = useState<Filter>('All');
  const alerts = useMemo(
    () => demoAlerts.filter((a) => filter === 'All' || (filter === 'Notices' ? a.severity === 'notice' : a.severity === 'info')),
    [filter],
  );

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="Service board"
        title={'Island\nupdates.'}
        intro="Local notices can help you adjust your trip before you leave."
      />
      {mode === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You're in Offline mode · showing saved notices from your last sync.</Text>
        </View>
      )}
      <View style={styles.updatesSummary}>
        <View style={styles.updatesPulse} />
        <Text style={styles.updatesSummaryText}>{alerts.length} sample update{alerts.length === 1 ? '' : 's'} for today</Text>
        <Text style={styles.updatesSummaryDate}>DEMO</Text>
      </View>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {alerts.map((alert) => (
        <View style={styles.updateCard} key={alert.id}>
          <View style={[styles.updateIcon, alert.severity === 'notice' && styles.updateIconNotice]}>
            <Text style={[styles.updateIconText, alert.severity === 'notice' && styles.updateIconTextNotice]}>{alert.severity === 'notice' ? '!' : 'i'}</Text>
          </View>
          <View style={styles.updateCopy}>
            <Text style={styles.updateLocality}>{alert.locality} · {alert.time}</Text>
            <Text style={styles.updateTitle}>{alert.title}</Text>
            <Text style={styles.updateDetail}>{alert.detail}</Text>
          </View>
        </View>
      ))}
      {alerts.length === 0 && <Text style={styles.emptyText}>No updates in this category.</Text>}
      <Text style={styles.demoNote}>Sample notices only · updates will come from verified operator or local authority accounts.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 18 },
    offlineBanner: { backgroundColor: colors.orangeLight, borderRadius: radius.sm, padding: 11 },
    offlineBannerText: { color: colors.orange, fontSize: 10, fontWeight: '700' },
    updatesSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenLight, borderRadius: radius.sm, padding: 11, gap: 8 },
    updatesPulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
    updatesSummaryText: { flex: 1, color: colors.greenDark, fontSize: 10, fontWeight: '800' },
    updatesSummaryDate: { color: colors.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    filterRow: { flexDirection: 'row', gap: 8, marginTop: -8 },
    updateCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderColor: colors.line, borderWidth: 1 },
    updateIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    updateIconNotice: { backgroundColor: colors.orangeLight },
    updateIconText: { color: colors.green, fontSize: 12, fontWeight: '900' },
    updateIconTextNotice: { color: colors.orange },
    updateCopy: { flex: 1 },
    updateLocality: { color: colors.muted, fontSize: 9, marginBottom: 5 },
    updateTitle: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
    updateDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
    emptyText: { color: colors.muted, fontSize: 11, textAlign: 'center' },
    demoNote: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  });
}
