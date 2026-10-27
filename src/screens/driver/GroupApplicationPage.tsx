import { Pressable, Text, View } from 'react-native';

import { Button, Card, TextField } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { groupOptions } from './data';
import { createStyles } from './styles';
import type { DriverProfile } from './types';

export function GroupApplicationScreen({
  profile,
  group,
  error,
  submitted,
  onChange,
  onGroup,
  onSubmit,
  onBack,
}: {
  profile: DriverProfile;
  group: string;
  error: string;
  submitted: boolean;
  onChange: (profile: DriverProfile) => void;
  onGroup: (group: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  if (submitted) {
    return (
      <View style={styles.pendingBlock}>
        <View style={styles.pendingIcon}><Text style={styles.pendingIconText}>✓</Text></View>
        <Text accessibilityRole="header" style={styles.pendingTitle}>Request previewed</Text>
        <Text style={styles.pendingBody}>{group} · pending chairperson review.{'\n'}The approved sample membership is unchanged; nothing was sent.</Text>
        <Button label="Done" onPress={onBack} />
      </View>
    );
  }
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Join a group</Text>
        <Text style={styles.titleSub}>Preview the application form. A chairperson approves new drivers.</Text>
      </View>

      <Text style={styles.sectionLabel}>Select a group</Text>
      <View style={styles.group}>
        {groupOptions.map((option, index) => {
          const selected = group === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onGroup(option)}
              style={({ pressed }) => [
                styles.infoRow,
                index > 0 && styles.infoRowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowTitle}>{option}</Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Your details</Text>
      <Card style={styles.formCard}>
        <TextField label="Full name" value={profile.name} onChangeText={(name) => onChange({ ...profile, name })} placeholder="Your full name" />
        <TextField label="Contact number" value={profile.contact} onChangeText={(contact) => onChange({ ...profile, contact })} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" />
        <TextField label="Driver's license number" value={profile.license} onChangeText={(license) => onChange({ ...profile, license })} placeholder="License number" autoCapitalize="characters" />
        {error ? <Text style={styles.formError}>{error}</Text> : null}
      </Card>
      <Button label="Submit application" onPress={onSubmit} />
      <Button label="Cancel" variant="ghost" onPress={onBack} />
    </>
  );
}
