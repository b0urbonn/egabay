import { Text, View } from 'react-native';

import type { AppearanceSetting } from '../../lib/appearance';
import { useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { DriverProfile } from './types';
import { ActionRow, AppearanceSelector, InfoRow, initials, maskLicense } from './ui';

export function DriverProfileScreen({
  profile,
  appearance,
  onChangeAppearance,
  onEdit,
  onApply,
}: {
  profile: DriverProfile;
  appearance: AppearanceSetting;
  onChangeAppearance: (setting: AppearanceSetting) => void;
  onEdit: () => void;
  onApply: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Profile</Text>
      </View>

      <View style={styles.identityBlock}>
        <View style={styles.avatar}><Text style={styles.avatarInitials}>{initials(profile.name)}</Text></View>
        <Text style={styles.identityName}>{profile.name}</Text>
        <Text style={styles.identitySub}>Driver · Boac Central TODA</Text>
      </View>

      <Text style={styles.sectionLabel}>Appearance</Text>
      <AppearanceSelector value={appearance} onChange={onChangeAppearance} />
      <Text style={styles.sectionHint}>System follows your device. Light and Dark apply across eGABAY.</Text>

      <Text style={styles.sectionLabel}>Details</Text>
      <View style={styles.group}>
        <InfoRow icon="phone" label="Contact" value={profile.contact} first />
        <InfoRow icon="person" label="License" value={maskLicense(profile.license)} />
        <InfoRow icon="home" label="Membership" value="Approved" />
      </View>

      <Text style={styles.sectionLabel}>Actions</Text>
      <View style={styles.group}>
        <ActionRow label="Edit profile" onPress={onEdit} first />
        <ActionRow label="Preview application" onPress={onApply} />
      </View>

      <Text style={styles.sectionHint}>License and contact details are private to you, your chairperson, and the super admin.</Text>
    </>
  );
}
