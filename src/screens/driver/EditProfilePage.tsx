import { Text, View } from 'react-native';

import { Button, Card, TextField } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverProfile } from './types';
import { ActionRow } from './ui';

export function EditProfileScreen({
  profile,
  error,
  onChange,
  onSave,
  onPhoto,
  onCancel,
}: {
  profile: DriverProfile;
  error: string;
  onChange: (profile: DriverProfile) => void;
  onSave: () => void;
  onPhoto: () => void;
  onCancel: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Edit profile</Text>
        <Text style={styles.titleSub}>Visible to your chairperson and super admin.</Text>
      </View>
      <Card style={styles.formCard}>
        <TextField label="Full name" value={profile.name} onChangeText={(name) => onChange({ ...profile, name })} placeholder="Your full name" />
        <TextField label="Contact number" value={profile.contact} onChangeText={(contact) => onChange({ ...profile, contact })} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" />
        <TextField label="Driver's license number" value={profile.license} onChangeText={(license) => onChange({ ...profile, license })} placeholder="License number" autoCapitalize="characters" />
        {error ? <Text style={styles.formError}>{error}</Text> : null}
      </Card>
      <View style={styles.group}>
        <ActionRow label="Change profile photo" onPress={onPhoto} first />
      </View>
      <Button label="Save" onPress={onSave} />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </>
  );
}
