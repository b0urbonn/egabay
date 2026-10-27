import { Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type {
  AnnouncementRecord,
  ConsoleTab,
  DriverRecord,
  TerminalRecord,
} from './types';
import { initials, MetricCard, OperationRow, SectionHeading } from './ui';

export function OverviewTab({
  wide, terminalCount, vehicleCount, activeDriverCount, pendingCount, assignedCount, drivers, terminals, announcements, onReview, onGo,
}: {
  wide: boolean;
  terminalCount: number;
  vehicleCount: number;
  activeDriverCount: number;
  pendingCount: number;
  assignedCount: number;
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  announcements: AnnouncementRecord[];
  onReview: () => void;
  onGo: (tab: ConsoleTab) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const pending = drivers.filter((driver) => driver.status === 'Pending').slice(0, 2);
  return (
    <>
      <Text style={styles.pageTitle}>Group overview</Text>
      <Text style={styles.pageSubtitle}>Keep your terminals, roster, and driver applications up to date.</Text>

      <View style={styles.metricGrid}>
        <MetricCard wide={wide} label="Terminals" value={String(terminalCount)} icon="terminals" tone="green" />
        <MetricCard wide={wide} label="Vehicles" value={String(vehicleCount)} icon="liveTrips" tone="blue" />
        <MetricCard wide={wide} label="Approved drivers" value={String(activeDriverCount)} icon="person" tone="purple" />
        <MetricCard wide={wide} label="Pending applications" value={String(pendingCount)} icon="person" tone="orange" />
      </View>

      <Card style={styles.reviewCard}>
        <View style={styles.reviewTop}>
          <View style={styles.reviewIcon}><MaterialIcon name="person" size={19} color={colors.orangeDark} /></View>
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>Driver applications</Text>
            <Text style={styles.reviewDetail}>{pendingCount === 0 ? 'No applications waiting' : `${pendingCount} waiting for your review`}</Text>
          </View>
          <View style={styles.pendingPill}><Text style={styles.pendingPillText}>{pendingCount}</Text></View>
        </View>
        {pending.map((driver) => <View key={driver.id} style={styles.pendingPreviewRow}>
          <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{initials(driver.name)}</Text></View>
          <Text style={styles.pendingName}>{driver.name}</Text>
          <Text style={styles.pendingApplied}>{driver.applied}</Text>
        </View>)}
        <Button label={pendingCount === 0 ? 'View driver roster' : 'Review applications'} variant="secondary" onPress={onReview} />
      </Card>

      <SectionHeading title="Group operations" action="Manage" onAction={() => onGo('Terminals')} />
      <Card style={styles.operationsCard}>
        <OperationRow icon="terminals" title="Terminals" detail={`${terminals.length} locations · review map pins`} onPress={() => onGo('Terminals')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="liveTrips" title="Vehicle roster" detail={`${vehicleCount} vehicles · ${vehicleCount - assignedCount} unassigned`} onPress={() => onGo('Vehicles')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="route" title="Assignments" detail="Assign drivers and move vehicles between terminals" onPress={() => onGo('Assignments')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="notifications" title="Group updates" detail={`${announcements.length} recent announcement${announcements.length === 1 ? '' : 's'}`} onPress={() => onGo('Updates')} />
      </Card>

    </>
  );
}
