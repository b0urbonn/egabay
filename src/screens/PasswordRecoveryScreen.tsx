import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button, ErrorBanner, ScreenHeader, TextField } from '../components/ui';
import { updatePassword } from '../lib/auth';
import { useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

export function PasswordRecoveryScreen({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const styles = useThemeStyles(createStyles);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (password.length < 8) { setError('Use at least 8 characters for your new password.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError(null);
    try { await updatePassword(password); onDone(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update your password.'); }
    finally { setLoading(false); }
  };
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader eyebrow="Account recovery" title="Choose a new password" />
      <Text style={styles.copy}>Your recovery link has been verified. Set your new password to continue.</Text>
      {error && <ErrorBanner message={error} />}
      <TextField label="New password" value={password} onChangeText={setPassword} secure autoCapitalize="none" placeholder="At least 8 characters" />
      <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secure autoCapitalize="none" />
      <Button label="Save password" onPress={submit} loading={loading} />
      <Button label="Sign out" variant="ghost" onPress={onCancel} disabled={loading} />
    </ScrollView>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({ content: { padding: 24, gap: 18 }, copy: { color: colors.muted, fontSize: 14, lineHeight: 21 } });
}
