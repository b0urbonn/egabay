import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, ErrorBanner, ScreenHeader, TextField } from '../components/ui';
import { mockSignUp, type Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { spacing, type ThemeColors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({
  onBack,
  onLogin,
  onSuccess,
}: {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: (session: Session) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const submit = async () => {
    const next: typeof errors = {};
    if (name.trim() === '') next.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    try {
      onSuccess(await mockSignUp(name, email, password));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign up failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Text style={styles.backGlyph}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <ScreenHeader
            eyebrow="Join eGABAY"
            title="Create your account"
            intro="Save favorite places and get live updates across Marinduque."
          />
          {formError && <ErrorBanner message={formError} />}
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Juan Dela Cruz" error={errors.name} autoCapitalize="words" />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" error={errors.email} autoCapitalize="none" keyboardType="email-address" />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="6+ characters" error={errors.password} secure autoCapitalize="none" />
          <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat your password" error={errors.confirm} secure autoCapitalize="none" />
          <Button label={loading ? 'Creating account…' : 'Create an account'} loading={loading} onPress={submit} />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <Pressable onPress={onLogin} hitSlop={6}>
              <Text style={styles.switchLink}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 40, gap: 16 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    backGlyph: { color: colors.green, fontSize: 18, fontWeight: '700' },
    backText: { color: colors.green, fontSize: 12, fontWeight: '800' },
    switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    switchText: { color: colors.muted, fontSize: 12 },
    switchLink: { color: colors.green, fontSize: 12, fontWeight: '800' },
  });
}
