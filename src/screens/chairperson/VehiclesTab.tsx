import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverRecord, TerminalRecord, VehicleRecord } from './types';
import { ChoiceChip, EmptyState, MiniAction, ScreenTitle, SearchField, StatusPill } from './ui';

export function VehiclesTab({
  vehicles, terminals, terminalFilter, onTerminalFilter, driverName, terminalName, availableDrivers, assigningVehicleId, onAdd, onEdit, onAssign, onChooseDriver, onAssignments,
}: {
  vehicles: VehicleRecord[];
  terminals: TerminalRecord[];
  terminalFilter: string | null;
  onTerminalFilter: (id: string | null) => void;
  driverName: (id: string | null) => string;
  terminalName: (id: string) => string;
  availableDrivers: DriverRecord[];
  assigningVehicleId: string | null;
  onAdd: () => void;
  onEdit: (vehicle: VehicleRecord) => void;
  onAssign: (id: string) => void;
  onChooseDriver: (vehicleId: string, driverId: string | null) => void;
  onAssignments: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const filtered = vehicles.filter((vehicle) =>
    (filter === 'All' || vehicle.type === filter) &&
    (!terminalFilter || vehicle.terminalId === terminalFilter) &&
    `${vehicle.bodyNumber} ${vehicle.plateNumber} ${driverName(vehicle.driverId)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <ScreenTitle eyebrow="FLEET MANAGEMENT" title="Vehicle roster" subtitle="Manage group vehicles and their terminal and driver assignments." />
      <SearchField label="Search vehicles" value={query} onChange={setQuery} placeholder="Body number, plate, or driver" />
      <Button label="Add vehicle" glyph="+" disabled={terminals.length === 0} onPress={onAdd} />
      {terminals.length === 0 && <EmptyState title="Add a terminal first" body="Every vehicle must belong to a group terminal. Create a location in Terminals before registering a vehicle." />}
      <View style={styles.chipRow}>
        {['All', 'Tricycle', 'Jeepney'].map((item) => <ChoiceChip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />)}
      </View>
      {terminalFilter && <View style={styles.chipRow}><ChoiceChip label={`Terminal: ${terminalName(terminalFilter)} ×`} selected onPress={() => onTerminalFilter(null)} /></View>}
      <Text style={styles.listCount}>{filtered.length} PREVIEW RECORDS</Text>
      {filtered.length === 0 ? <EmptyState title="No vehicles in this view" body="Add a group vehicle to start its roster." /> : filtered.map((vehicle) => (
        <Card key={vehicle.id} style={styles.vehicleCard}>
          <View style={styles.vehicleCardTop}>
            <View style={styles.vehicleIcon}><MaterialIcon name="liveTrips" size={19} color={colors.green} /></View>
            <View style={styles.vehicleTitleCopy}>
              <Text style={styles.vehicleBodyNumber}>{vehicle.bodyNumber}</Text>
              <Text style={styles.vehicleType}>{vehicle.type} · plate {vehicle.plateNumber}</Text>
            </View>
            <StatusPill label={vehicle.status} tone={vehicle.status === 'Active' ? 'green' : vehicle.status === 'Offline' ? 'gray' : 'orange'} />
          </View>
          <View style={styles.vehicleMetaRow}>
            <MaterialIcon name="terminals" size={14} color={colors.muted} />
            <Text style={styles.vehicleMetaText}>{terminalName(vehicle.terminalId)}</Text>
          </View>
          <View style={styles.assignmentBox}>
            <View style={styles.assignmentPerson}><View style={styles.smallAvatar}><MaterialIcon name="person" size={14} color={colors.green} /></View><Text style={styles.assignmentName}>{driverName(vehicle.driverId)}</Text></View>
            <Pressable onPress={() => onAssign(vehicle.id)} style={styles.assignLink} accessibilityRole="button">
              <Text style={styles.assignLinkText}>{vehicle.driverId ? 'Change' : 'Assign'}</Text>
            </Pressable>
          </View>
          {assigningVehicleId === vehicle.id && <View style={styles.driverPicker}>
            <Text style={styles.driverPickerTitle}>Choose an approved, unassigned driver</Text>
            {vehicle.driverId && <Pressable style={styles.driverChoice} onPress={() => onChooseDriver(vehicle.id, null)}><Text style={styles.driverChoiceText}>Unassign current driver</Text></Pressable>}
            {availableDrivers.map((driver) => <Pressable key={driver.id} style={styles.driverChoice} onPress={() => onChooseDriver(vehicle.id, driver.id)}><Text style={styles.driverChoiceText}>{driver.name}</Text><Text style={styles.driverChoiceMeta}>Approved</Text></Pressable>)}
            {availableDrivers.length === 0 && !vehicle.driverId && <Text style={styles.emptyPickerText}>No approved drivers are available to assign.</Text>}
          </View>}
          <View style={styles.vehicleActions}>
            <MiniAction label="Edit vehicle" icon="settings" onPress={() => onEdit(vehicle)} />
          <MiniAction label="Assignments" icon="route" onPress={onAssignments} />
          </View>
        </Card>
      ))}
      <Text style={styles.privacyFootnote}>Plate numbers are visible to the group chairperson and are not part of public vehicle listings.</Text>
      <Text style={styles.hiddenMeta}>{terminals.length} terminals configured for this sample group.</Text>
    </>
  );
}
