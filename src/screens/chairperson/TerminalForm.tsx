import { Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { TerminalFormState } from './types';
import { CoordinateFields, FormError, FormPanel, Input } from './ui';

export function TerminalForm({
  form, error, onChange, onSave, onCancel,
}: {
  form: TerminalFormState;
  error: string;
  onChange: (form: TerminalFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <FormPanel title={form.id ? 'Edit terminal' : 'Add a terminal'} onCancel={onCancel}>
      <Input label="Terminal name" value={form.name} placeholder="e.g. Boac Town Center" onChangeText={(name) => onChange({ ...form, name })} />
      <Input label="Municipality" value={form.municipality} placeholder="e.g. Boac" onChangeText={(municipality) => onChange({ ...form, municipality })} />
      <Input label="Barangay" value={form.barangay} placeholder="Barangay name" onChangeText={(barangay) => onChange({ ...form, barangay })} />
      <View style={styles.pinPreview}>
        <View style={styles.pinIcon}><MaterialIcon name="location" size={17} color={colors.green} /></View>
        <View style={styles.pinCopy}>
          <Text style={styles.pinTitle}>Map pin</Text>
          <Text style={styles.pinDetail}>Coordinates for the terminal map pin</Text>
        </View>
      </View>
      <CoordinateFields value={form.pin} onChange={(pin) => onChange({ ...form, pin })} />
      {error ? <FormError message={error} /> : null}
      <Button label={form.id ? 'Save terminal details' : 'Add terminal'} onPress={onSave} />
    </FormPanel>
  );
}
