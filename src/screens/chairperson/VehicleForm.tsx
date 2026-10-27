import { Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverRecord, TerminalRecord, VehicleFormState, VehicleRecord } from './types';
import { ChoiceChip, FormError, FormPanel, Input } from './ui';

export function VehicleForm({
  form, error, terminals, drivers, vehicles, onChange, onSave, onCancel,
}: {
  form: VehicleFormState;
  error: string;
  terminals: TerminalRecord[];
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
  onChange: (form: VehicleFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const eligibleDrivers = drivers.filter((driver) => driver.status === 'Approved' && !vehicles.some((vehicle) => vehicle.id !== form.id && vehicle.driverId === driver.id));
  return (
    <FormPanel title={form.id ? 'Edit vehicle' : 'Add a vehicle'} onCancel={onCancel}>
      <Input label="Body / franchise number" value={form.bodyNumber} placeholder="e.g. BC-051" onChangeText={(bodyNumber) => onChange({ ...form, bodyNumber })} />
      <Input label="Plate number · group only" value={form.plateNumber} placeholder="Enter plate number" autoCapitalize="characters" onChangeText={(plateNumber) => onChange({ ...form, plateNumber })} />
      <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
      <View style={styles.choiceRow}>
        {['Tricycle', 'Jeepney'].map((type) => <ChoiceChip key={type} label={type} selected={form.type === type} onPress={() => onChange({ ...form, type })} />)}
      </View>
      <Text style={styles.fieldLabel}>ASSIGN TO TERMINAL</Text>
      <View style={styles.choiceStack}>
        {terminals.map((terminal) => <ChoiceChip key={terminal.id} label={`${terminal.name} · ${terminal.municipality}`} selected={form.terminalId === terminal.id} onPress={() => onChange({ ...form, terminalId: terminal.id })} />)}
      </View>
      <Text style={styles.fieldLabel}>ASSIGNED DRIVER</Text>
      <View style={styles.choiceRow}>
        <ChoiceChip label="Unassigned" selected={!form.driverId} onPress={() => onChange({ ...form, driverId: null })} />
        {eligibleDrivers.map((driver) => <ChoiceChip key={driver.id} label={driver.name} selected={form.driverId === driver.id} onPress={() => onChange({ ...form, driverId: driver.id })} />)}
      </View>
      <Text style={styles.fieldLabel}>VEHICLE STATUS</Text>
      <View style={styles.choiceRow}>
        {(['Active', 'Needs review', 'Offline'] as const).map((status) => <ChoiceChip key={status} label={status} selected={form.status === status} onPress={() => onChange({ ...form, status })} />)}
      </View>
      {error ? <FormError message={error} /> : null}
      <Button label={form.id ? 'Save vehicle details' : 'Add vehicle to preview'} onPress={onSave} />
    </FormPanel>
  );
}
