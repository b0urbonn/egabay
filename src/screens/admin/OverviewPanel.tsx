import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Card } from '../../components/ui';
import type { AdminPanelData, AdminUser } from '../../types/admin';
import { municipalities } from './data';
import type { Styles } from './styles';
import type { Section } from './types';
import { ActivityRow, QuickLink } from './ui';

export function OverviewPanel({ data, users, loading, styles, onNavigate }: { data: AdminPanelData; users: Map<string, AdminUser>; loading: boolean; styles: Styles; onNavigate: (section: Section) => void }) {
  const metrics = [
    { label: 'Transport groups', value: data.counts.groups, icon: 'groups' as const, note: `${data.counts.activeGroups} active` },
    { label: 'Terminals', value: data.counts.terminals, icon: 'terminals' as const, note: 'Across all municipalities' },
    { label: 'Registered vehicles', value: data.counts.vehicles, icon: 'liveTrips' as const, note: `${data.counts.onTrip} currently on route` },
    { label: 'Drivers', value: data.counts.drivers, icon: 'person' as const, note: `${data.counts.pending} application${data.counts.pending === 1 ? '' : 's'} pending` },
  ];
  const groupsInTown = (town: string) => data.groups.filter((group) => group.municipality === town).length;
  const maxGroups = Math.max(1, ...municipalities.map(groupsInTown));
  return <>
    <View style={styles.hero}>
      <View style={styles.heroContent}><View style={styles.heroKicker}><View style={styles.heroDot} /><Text style={styles.heroKickerText}>NETWORK OVERVIEW</Text></View><Text style={styles.heroTitle}>Marinduque transport, at a glance</Text><Text style={styles.heroCopy}>Keep local groups, terminals, vehicles, and account access organized in one place.</Text><Pressable accessibilityRole="button" onPress={() => onNavigate('groups')} style={styles.heroLink}><Text style={styles.heroLinkText}>View transport groups</Text><MaterialIcon name="arrowForward" size={17} color="#FFFFFF" /></Pressable></View>
      <View style={styles.heroIconWrap}><MaterialIcon name="map" size={64} color="rgba(255,255,255,0.88)" /></View>
    </View>
    <View style={[styles.metrics, !styles.wide && styles.metricsCompact]}>
      {metrics.map((metric) => <Card key={metric.label} style={styles.metricCard}><View style={styles.metricTop}><View style={styles.metricIcon}><MaterialIcon name={metric.icon} size={20} color={styles.colors.greenDark} /></View></View><Text style={styles.metricValue}>{loading ? '—' : metric.value.toLocaleString()}</Text><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricNote}>{loading ? 'Loading records…' : metric.note}</Text></Card>)}
    </View>
    <View style={[styles.dashboardColumns, !styles.wide && styles.dashboardColumnsCompact]}>
      <Card style={styles.coverageCard}>
        <View style={styles.panelHeading}><View><Text style={styles.panelTitle}>Network coverage</Text><Text style={styles.panelSubtitle}>Registered groups by municipality</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('reports')}><Text style={styles.panelAction}>View report</Text></Pressable></View>
        {municipalities.map((town) => <View key={town} style={styles.coverageRow}><View style={styles.coverageTown}><Text style={styles.coverageName}>{town}</Text><Text style={styles.coverageCount}>{groupsInTown(town)} group{groupsInTown(town) === 1 ? '' : 's'}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { width: `${(groupsInTown(town) / maxGroups) * 100}%` }]} /></View></View>)}
        {!loading && data.counts.groups === 0 && <Text style={styles.emptyCaption}>No verified groups have been added yet.</Text>}
      </Card>
      <View style={styles.overviewAside}>
        <Card style={styles.actionsCard}><Text style={styles.panelTitle}>Quick access</Text><Text style={styles.panelSubtitle}>Jump to a common admin task</Text>
          <QuickLink label="Manage transport groups" detail="Review group coverage and chairs" icon="groups" onPress={() => onNavigate('groups')} styles={styles} />
          <QuickLink label="Manage user access" detail="Review roles and account status" icon="person" onPress={() => onNavigate('users')} styles={styles} />
          <QuickLink label="Review admin activity" detail="See privileged changes" icon="history" onPress={() => onNavigate('audit')} styles={styles} />
        </Card>
        <Card style={styles.activityCard}><View style={styles.panelHeading}><View><Text style={styles.panelTitle}>Recent activity</Text><Text style={styles.panelSubtitle}>Latest privileged changes</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('audit')}><Text style={styles.panelAction}>All activity</Text></Pressable></View>
          {loading ? <ActivityIndicator color={styles.colors.green} /> : data.audit.length ? data.audit.slice(0, 4).map((event) => <ActivityRow key={event.id} event={event} actor={event.actor_id ? users.get(event.actor_id)?.display_name || users.get(event.actor_id)?.email || 'Administrator' : 'System'} styles={styles} />) : <Text style={styles.emptyCaption}>No admin activity recorded yet.</Text>}
        </Card>
      </View>
    </View>
  </>;
}
