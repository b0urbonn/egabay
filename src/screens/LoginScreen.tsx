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
import { sendPasswordReset, signInWithEmail, signInWithGoogle } from '../lib/auth';
import { useThemeStyles } from '../lib/theme';
import { spacing, type ThemeColors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({
  onBack,
  onSignUp,
  onChairpersonPreview,
  onDriverPreview,
}: {
  onBack: () => void;
  onSignUp: () => void;
  onChairpersonPreview: () => void;
  onDriverPreview: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotNote, setForgotNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      await signInWithEmail(email, password);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (error) { setFormError(error instanceof Error ? error.message : 'Google sign-in failed.'); }
    finally { setGoogleLoading(false); }
  };

  const resetPassword = async () => {
    if (!EMAIL_RE.test(email.trim())) { setErrors({ email: 'Enter your email address above first.' }); return; }
    setFormError(null);
    setLoading(true);
    try { await sendPasswordReset(email); setForgotNote(true); }
    catch (error) { setFormError(error instanceof Error ? error.message : 'Unable to send the reset email.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Text style={styles.backGlyph}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <ScreenHeader
            eyebrow="Welcome back"
            title="Log in to eGABAY"
            intro="Sign in to access your profile and transport services."
          />
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Workspace previews</Text>
            <Text style={styles.hintBody}>No account needed. Sample changes reset when you leave.</Text>
            <Button label="Open driver preview" variant="secondary" onPress={onDriverPreview} />
            <Button label="Open chairperson preview" variant="secondary" onPress={onChairpersonPreview} />
          </Card>
          <Button label="Continue with Google" variant="secondary" onPress={googleSignIn} loading={googleLoading} disabled={loading} />
          <Text style={styles.separator}>or sign in with email</Text>
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
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password" onPress={resetPassword} disabled={loading || googleLoading} style={styles.forgotLink} hitSlop={6}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            {forgotNote && (
              <Text style={styles.forgotNote}>If an account exists for this email, a password-reset link has been sent. Open it in this browser.</Text>
            )}
          </View>
          <Button label={loading ? 'Signing in…' : 'Log in'} loading={loading} disabled={googleLoading} onPress={submit} />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New to eGABAY?</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Create an account" onPress={onSignUp} hitSlop={6}>
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
    backGlyph: { color: colors.greenDark, fontSize: 18, fontWeight: '700' },
    backText: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
    separator: { color: colors.muted, fontSize: 12, textAlign: 'center' },
    previewCard: { gap: 8 },
    previewTitle: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
    hintBody: { color: colors.muted, fontSize: 11 },
    passwordBlock: { gap: 6 },
    forgotLink: { alignSelf: 'flex-end' },
    forgotText: { color: colors.greenDark, fontSize: 11, fontWeight: '800' },
    forgotNote: { color: colors.muted, fontSize: 10, textAlign: 'right' },
    switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    switchText: { color: colors.muted, fontSize: 12 },
    switchLink: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
  });
}
