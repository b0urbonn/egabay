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

import { Button, Card, ErrorBanner, ScreenHeader, TextField } from '../components/ui';
import { mockSignIn } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import { spacing, type ThemeColors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({
  onBack,
  onSignUp,
  onSuccess,
}: {
  onBack: () => void;
  onSignUp: () => void;
  onSuccess: (session: import('../lib/session').Session) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotNote, setForgotNote] = useState(false);
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
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    try {
      onSuccess(await mockSignIn(email, password));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign in failed. Try again.');
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
            eyebrow="Welcome back"
            title="Log in to eGABAY"
            intro="Use your account to unlock live updates and sync your trips."
          />
          <Card style={styles.hintCard}>
            <Text style={styles.hintTitle}>Demo account</Text>
            <Text style={styles.hintBody}>demo@egabay.ph · any password (6+ chars)</Text>
          </Card>
          {formError && <ErrorBanner message={formError} />}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordBlock}>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="6+ characters"
              error={errors.password}
              secure
              autoCapitalize="none"
            />
            <Pressable onPress={() => setForgotNote(true)} style={styles.forgotLink} hitSlop={6}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            {forgotNote && (
              <Text style={styles.forgotNote}>Password reset is not available in this demo build.</Text>
            )}
          </View>
          <Button label={loading ? 'Signing in…' : 'Log in'} loading={loading} onPress={submit} />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New to eGABAY?</Text>
            <Pressable onPress={onSignUp} hitSlop={6}>
              <Text style={styles.switchLink}>Create an account</Text>
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
    hintCard: { gap: 4 },
    hintTitle: { color: colors.greenDark, fontSize: 11, fontWeight: '800' },
    hintBody: { color: colors.muted, fontSize: 11 },
    passwordBlock: { gap: 6 },
    forgotLink: { alignSelf: 'flex-end' },
    forgotText: { color: colors.green, fontSize: 11, fontWeight: '800' },
    forgotNote: { color: colors.muted, fontSize: 10, textAlign: 'right' },
    switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    switchText: { color: colors.muted, fontSize: 12 },
    switchLink: { color: colors.green, fontSize: 12, fontWeight: '800' },
  });
}
