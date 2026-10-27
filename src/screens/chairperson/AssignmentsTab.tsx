import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverRecord, TerminalRecord, VehicleRecord } from './types';
import { ChoiceChip, EmptyState, ScreenTitle } from './ui';

export function AssignmentsTab({ vehicles, drivers, terminals, onSave }: {
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  onSave: (vehicleId: string, driverId: string | null, terminalId: string) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [selectedId, setSelectedId] = useState(vehicles[0]?.id ?? '');
  const vehicle = vehicles.find((item) => item.id === selectedId) ?? vehicles[0];
  return <>
    <ScreenTitle eyebrow="GROUP OPERATIONS" title="Assignments" subtitle="Assign one approved driver to a vehicle and place that vehicle at a group terminal." />
    <Card style={styles.formPanel}>
      <Text style={styles.fieldLabel}>1. SELECT A VEHICLE</Text>
      <View style={styles.choiceRow}>{vehicles.map((item) => <ChoiceChip key={item.id} label={item.bodyNumber} selected={vehicle?.id === item.id} onPress={() => setSelectedId(item.id)} />)}</View>
      {!vehicle && <EmptyState title="No vehicles to assign" body="Add a terminal and register a vehicle from the Vehicles section first." />}
    </Card>
    {vehicle && <AssignmentEditor key={`${vehicle.id}:${vehicle.driverId}:${vehicle.terminalId}`} vehicle={vehicle} vehicles={vehicles} drivers={drivers} terminals={terminals} onSave={onSave} />}
    <Card style={styles.tipCard}><Text style={styles.tipTitle}>One driver, one vehicle</Text><Text style={styles.tipBody}>Only approved members of this group can be assigned. Move a driver by unassigning their current vehicle first.</Text></Card>
  </>;
}

function AssignmentEditor({ vehicle, vehicles, drivers, terminals, onSave }: {
  vehicle: VehicleRecord;
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  onSave: (vehicleId: string, driverId: string | null, terminalId: string) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [driverId, setDriverId] = useState(vehicle.driverId);
  const [terminalId, setTerminalId] = useState(vehicle.terminalId);
  const candidates = drivers.filter((driver) => driver.status === 'Approved' && !vehicles.some((item) => item.id !== vehicle.id && item.driverId === driver.id));
  const unchanged = driverId === vehicle.driverId && terminalId === vehicle.terminalId;
  return <Card style={styles.formPanel}>
    <Text style={styles.formTitle}>{vehicle.bodyNumber} · {vehicle.type}</Text>
    <Text style={styles.fieldLabel}>2. ASSIGN A DRIVER</Text>
    <View style={styles.choiceRow}>
      <ChoiceChip label="Unassigned" selected={!driverId} onPress={() => setDriverId(null)} />
      {candidates.map((driver) => <ChoiceChip key={driver.id} label={driver.name} selected={driverId === driver.id} onPress={() => setDriverId(driver.id)} />)}
    </View>
    {candidates.length === 0 && <Text style={styles.composerHint}>No approved, unassigned drivers are available. Review pending applications in Drivers.</Text>}
    <Text style={styles.fieldLabel}>3. ASSIGN TO A TERMINAL</Text>
    <View style={styles.choiceStack}>{terminals.map((terminal) => <ChoiceChip key={terminal.id} label={`${terminal.name} · ${terminal.municipality}`} selected={terminalId === terminal.id} onPress={() => setTerminalId(terminal.id)} />)}</View>
    <Button label="Save assignments" disabled={unchanged} onPress={() => onSave(vehicle.id, driverId, terminalId)} />
    <Text style={styles.localOnly}>{unchanged ? 'Select a different driver or terminal to make a change.' : 'Updates apply to the demo workspace.'}</Text>
  </Card>;
}
