import { Text, View } from 'react-native';

import { Card } from '../../components/ui';
import type { AdminPanelData } from '../../types/admin';
import { municipalities } from './data';
import type { Styles } from './styles';
import { ReportBar } from './ui';

export function ReportsPanel({ data, loading, styles }: { data: AdminPanelData; loading: boolean; styles: Styles }) {
  const groupsInTown = (town: string) => data.groups.filter((group) => group.municipality === town).length;
  const maxGroups = Math.max(1, ...municipalities.map(groupsInTown));
  const jeepney = data.groups.filter((group) => group.kind === 'jeepney').length;
  const toda = data.groups.filter((group) => group.kind === 'toda').length;
  const maxKind = Math.max(1, jeepney, toda);
  return <View style={styles.reportGrid}>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Group coverage</Text><Text style={styles.panelSubtitle}>Registered transport groups by municipality</Text>{municipalities.map((town) => <ReportBar key={town} label={town} value={groupsInTown(town)} max={maxGroups} loading={loading} styles={styles} />)}</Card>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Transport mix</Text><Text style={styles.panelSubtitle}>Groups by operator type</Text><ReportBar label="Jeepney" value={jeepney} max={maxKind} loading={loading} styles={styles} tone="green" /><ReportBar label="TODA" value={toda} max={maxKind} loading={loading} styles={styles} tone="orange" /><View style={styles.reportDivider} /><Text style={styles.reportFact}><Text style={styles.reportFactNumber}>{loading ? '—' : data.counts.routes}</Text> active routes</Text><Text style={styles.reportFact}><Text style={styles.reportFactNumber}>{loading ? '—' : data.counts.approved}</Text> approved drivers</Text></Card>
    <Card style={styles.reportCard}><Text style={styles.panelTitle}>Registry summary</Text><Text style={styles.panelSubtitle}>Current records across all groups</Text>{[
      ['Groups', data.counts.groups], ['Terminals', data.counts.terminals], ['Vehicles', data.counts.vehicles], ['Drivers', data.counts.drivers], ['Pending applications', data.counts.pending],
    ].map(([label, value]) => <View key={label} style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{loading ? '—' : value}</Text></View>)}</Card>
  </View>;
}
