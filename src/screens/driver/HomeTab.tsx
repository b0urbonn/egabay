import { Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { availabilityOptions } from './data';
import { createStyles } from './styles';
import type { Availability, DriverProfile } from './types';
import { InfoRow } from './ui';

export function DriverHome({
  profile,
  availability,
  onChangeAvailability,
  onStartTrip,
  onAnnouncements,
}: {
  profile: DriverProfile;
  availability: Availability;
  onChangeAvailability: (next: Availability) => void;
  onStartTrip: () => void;
  onAnnouncements: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.titleEyebrow}>BOAC CENTRAL TODA</Text>
        <Text accessibilityRole="header" style={styles.largeTitle}>Hello, {profile.name.split(' ')[0]}</Text>
      </View>

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.segmented}>
        {availabilityOptions.map((option) => {
          const selected = availability === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${option} availability`}
              accessibilityState={{ selected }}
              onPress={() => onChangeAvailability(option)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <View style={[styles.segmentDot, option === 'On trip' && styles.segmentDotTrip, option === 'Offline' && styles.segmentDotOffline, !selected && styles.segmentDotFaded]} />
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {availability === 'On trip' ? (
        <Text style={styles.sectionHint}>Trip active in preview. GPS is not being used.</Text>
      ) : availability === 'Available' ? (
        <Button label="Start trip" onPress={onStartTrip} />
      ) : (
        <Text style={styles.sectionHint}>Set status to Available to start a trip.</Text>
      )}

      <Text style={styles.sectionLabel}>Assignment</Text>
      <View style={styles.group}>
        <InfoRow icon="person" label="Group" value="Boac Central TODA · Approved" first />
        <InfoRow icon="liveTrips" label="Vehicle" value="BC-014 · Tricycle" />
        <InfoRow icon="location" label="Terminal" value="Boac Town Center" />
      </View>

      <Text style={styles.sectionLabel}>Latest update</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open announcements"
        onPress={onAnnouncements}
        style={({ pressed }) => [styles.linkRow, pressed && styles.rowPressed]}
      >
        <View style={styles.rowIcon}><MaterialIcon name="notifications" size={18} color={colors.orange} /></View>
        <View style={styles.linkRowCopy}>
          <Text style={styles.rowTitle}>Roster check this week</Text>
          <Text style={styles.rowMeta}>Oct 24 · from your chairperson</Text>
        </View>
        <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
      </Pressable>
    </>
  );
}
