import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';

export function TripConsentModal({
  visible,
  checked,
  onToggleCheck,
  onStart,
  onCancel,
}: {
  visible: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.consentSheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.consentTitle}>Share location for this trip?</Text>
          <Text style={styles.consentBody}>
            In the live app, your group sees your vehicle&apos;s location only while the trip is active. You can stop at any time.
          </Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={onToggleCheck}
            style={({ pressed }) => [styles.consentCheckRow, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.consentCheckText}>I consent to location sharing for this trip</Text>
          </Pressable>
          <Button label="Start trip" onPress={onStart} disabled={!checked} />
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
          <Text style={styles.consentFootnote}>Preview — GPS is not accessed.</Text>
        </View>
      </View>
    </Modal>
  );
}
