import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverFilter, DriverRecord, VehicleRecord } from './types';
import { EmptyState, initials, ScreenTitle, StatusPill } from './ui';

export function DriversTab({
  drivers, vehicles, terminalName, driverFilter, setDriverFilter, onDecision, onGoVehicles,
}: {
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
  terminalName: (id: string) => string;
  driverFilter: DriverFilter;
  setDriverFilter: (filter: DriverFilter) => void;
  onDecision: (id: string, status: 'Approved' | 'Rejected') => void;
  onGoVehicles: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const pending = drivers.filter((driver) => driver.status === 'Pending');
  const roster = drivers.filter((driver) => driver.status === 'Approved');
  const decisions = drivers.filter((driver) => driver.decisionAt);
  const selected = driverFilter === 'Applications' ? pending : driverFilter === 'Roster' ? roster : decisions;
  const [decision, setDecision] = useState<{ id: string; status: 'Approved' | 'Rejected' } | null>(null);
  const assignedVehicle = (driver: DriverRecord) => vehicles.find((vehicle) => vehicle.driverId === driver.id);
  return (
    <>
      <ScreenTitle eyebrow="MEMBERSHIP" title="Drivers" subtitle="Review applications and check your group's approved driver roster." />
      <View style={styles.segmented}>
        {(['Applications', 'Roster', 'Decisions'] as const).map((item) => {
          const selectedTab = driverFilter === item;
          const count = item === 'Applications' ? pending.length : item === 'Roster' ? roster.length : decisions.length;
          return <Pressable key={item} onPress={() => setDriverFilter(item)} style={[styles.segment, selectedTab && styles.segmentSelected]} accessibilityRole="tab" accessibilityState={{ selected: selectedTab }}>
            <Text style={[styles.segmentText, selectedTab && styles.segmentTextSelected]}>{item}</Text><Text style={[styles.segmentCount, selectedTab && styles.segmentCountSelected]}>{count}</Text>
          </Pressable>;
        })}
      </View>
      {driverFilter === 'Applications' && pending.length > 0 && <View style={styles.reviewGuidance}><MaterialIcon name="assistant" size={17} color={colors.orangeDark} /><Text style={styles.reviewGuidanceText}>Check membership and license details before approving an application.</Text></View>}
      <Text style={styles.listCount}>{driverFilter === 'Applications' ? `${pending.length} WAITING FOR REVIEW` : driverFilter === 'Roster' ? `${roster.length} APPROVED DRIVERS` : `${decisions.length} APPLICATION DECISIONS`}</Text>
      {selected.length === 0 ? <EmptyState title={driverFilter === 'Applications' ? 'You’re all caught up' : driverFilter === 'Decisions' ? 'No reviewed applications' : 'No approved drivers yet'} body={driverFilter === 'Applications' ? 'New group applications will appear here.' : driverFilter === 'Decisions' ? 'Your approval and rejection decisions will appear here.' : 'Approved members will appear in your roster.'} /> : selected.map((driver) => {
        const assignment = assignedVehicle(driver);
        return <Card key={driver.id} style={styles.driverCard}>
          <View style={styles.driverCardTop}>
            <View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{initials(driver.name)}</Text></View>
            <View style={styles.driverNameCopy}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverApplied}>{driverFilter === 'Applications' ? `Applied ${driver.applied.toLowerCase()}` : driverFilter === 'Decisions' ? `Reviewed ${driver.decisionAt}` : 'Approved group member'}</Text>
            </View>
            <StatusPill label={driver.status} tone={driver.status === 'Pending' ? 'orange' : driver.status === 'Rejected' ? 'gray' : 'green'} />
          </View>
          <View style={styles.driverInfoGrid}>
            <View style={styles.driverInfoCell}><Text style={styles.driverInfoLabel}>CONTACT</Text><Text style={styles.driverInfoValue}>{driver.contact}</Text></View>
            <View style={styles.driverInfoCell}><Text style={styles.driverInfoLabel}>LICENSE</Text><Text style={styles.driverInfoValue}>{driver.license}</Text></View>
          </View>
          {driverFilter === 'Applications' && decision?.id === driver.id ? <View style={styles.deleteConfirm}>
            <Text style={styles.deleteConfirmText}>{decision.status === 'Approved' ? 'Approve' : 'Reject'} {driver.name}’s application to Boac Central TODA?</Text>
            <View style={styles.decisionRow}><Button label="Cancel" variant="ghost" style={styles.decisionButton} onPress={() => setDecision(null)} /><Button label="Confirm" style={styles.decisionButton} onPress={() => { onDecision(driver.id, decision.status); setDecision(null); }} /></View>
          </View> : driverFilter === 'Applications' ? <View style={styles.decisionRow}>
            <Button label="Reject" variant="ghost" onPress={() => setDecision({ id: driver.id, status: 'Rejected' })} style={styles.decisionButton} />
            <Button label="Approve driver" onPress={() => setDecision({ id: driver.id, status: 'Approved' })} style={styles.decisionButton} />
          </View> : driverFilter === 'Decisions' ? <Text style={styles.privacyFootnote}>{driver.status === 'Approved' ? 'Approved for group membership.' : 'Application rejected. This driver cannot be assigned to a vehicle.'}</Text> : <View style={styles.rosterAssignment}>
            <Text style={styles.driverInfoLabel}>VEHICLE ASSIGNMENT</Text>
            {assignment ? <Text style={styles.rosterVehicle}>{assignment.bodyNumber} · {terminalName(assignment.terminalId)}</Text> : <Pressable onPress={onGoVehicles}><Text style={styles.rosterUnassigned}>No vehicle · Assign one</Text></Pressable>}
          </View>}
        </Card>;
      })}
      <Text style={styles.privacyFootnote}>Contact and license details are shown only in this group management preview.</Text>
    </>
  );
}
