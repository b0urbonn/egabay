import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { Button, ErrorBanner } from './src/components/ui';
import { signOut } from './src/lib/auth';
import { useAuthSession } from './src/lib/useAuthSession';
import { adminPreviewAccount } from './src/data/adminPreview';

import {
  clearStoredAppearance,
  getStoredAppearance,
  setStoredAppearance,
  type AppearanceSetting,
} from './src/lib/appearance';
import { clearStoredMode, getStoredMode, setStoredMode, type AppMode } from './src/lib/appMode';
import {
  clearOnboardingDone,
  clearStoredSession,
  getStoredSession,
  isOnboardingDone,
  setOnboardingDone,
  setStoredSession,
  type Session,
} from './src/lib/session';
import { ColorsContext } from './src/lib/theme';
import { ChairpersonConsoleScreen } from './src/screens/ChairpersonConsoleScreen';
import { DriverWorkspaceScreen } from './src/screens/DriverWorkspaceScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainShell } from './src/screens/MainShell';
import { PasswordRecoveryScreen } from './src/screens/PasswordRecoveryScreen';
import { RoleWorkspaceScreen } from './src/screens/RoleWorkspaceScreen';
import { SuperAdminWorkspaceScreen } from './src/screens/SuperAdminWorkspaceScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { darkColors, lightColors } from './src/theme';

type Stage = 'onboarding' | 'welcome' | 'login' | 'signup' | 'chairperson' | 'driver' | 'admin-preview' | 'app';

function initialStage(): Stage {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'super-admin') return 'admin-preview';
  if (!isOnboardingDone()) return 'onboarding';
  return getStoredSession() ? 'app' : 'welcome';
}

export default function App() {
  const systemScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const auth = useAuthSession();
  const [stage, setStage] = useState<Stage>(initialStage);
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [mode, setMode] = useState<AppMode>(() => getStoredMode() ?? (getStoredSession()?.kind === 'guest' ? 'offline' : 'online'));
  const [appearance, setAppearance] = useState<AppearanceSetting>(() => getStoredAppearance());
  const [showCommuterView, setShowCommuterView] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!auth.account || stage === 'admin-preview') return;
    setStoredSession(auth.account);
    setOnboardingDone();
    setSession(auth.account);
    setStage('app');
  }, [auth.account, stage]);

  useEffect(() => {
    if (stage !== 'admin-preview' && !auth.loading && !auth.userId && session?.kind === 'account') {
      clearStoredSession();
      setSession(null);
      setStage('welcome');
    }
  }, [auth.loading, auth.userId, session, stage]);

  const accountId = session?.kind === 'account' ? session.id : null;
  const accountRole = session?.kind === 'account' ? session.role : null;
  useEffect(() => { setShowCommuterView(false); }, [accountId, accountRole]);

  const isDark = appearance === 'dark' || (appearance === 'system' && systemScheme === 'dark');
  const themeColors = isDark ? darkColors : lightColors;
  const isWideWeb = Platform.OS === 'web' && width >= 1024 && stage !== 'chairperson' && stage !== 'driver';
  const staffAccount = session?.kind === 'account' && session.role !== 'commuter' ? session : null;
  // Wide web: landing chrome (intro panel + phone frame) only pre-sign-in;
  // once in the app it renders full-width like a real web app.
  const showLandingChrome = isWideWeb && stage !== 'app' && stage !== 'admin-preview';
  const styles = createAppStyles(themeColors);

  const chooseMode = (next: AppMode) => { setStoredMode(next); setMode(next); };
  const chooseAppearance = (next: AppearanceSetting) => { setStoredAppearance(next); setAppearance(next); };
  const finishOnboarding = () => { setOnboardingDone(); setStage('welcome'); };
  const enterAsGuest = () => {
    const guest = { kind: 'guest' } as const;
    setStoredSession(guest); setSession(guest); chooseMode('offline'); setStage('app');
  };
  const leaveSession = async (): Promise<boolean> => {
    setSigningOut(true);
    setActionError(null);
    try {
      await signOut();
      clearStoredSession(); setSession(null); setStage('welcome'); setShowCommuterView(false);
      return true;
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Sign out failed. Please try again.');
      return false;
    } finally { setSigningOut(false); }
  };
  const resetApp = async () => {
    if (!await leaveSession()) return;
    clearOnboardingDone(); clearStoredMode(); clearStoredAppearance();
    setMode('online'); setAppearance('system'); setStage('onboarding');
  };
  const requestAuth = () => { clearStoredSession(); setSession(null); setStage('login'); };

  return (
    <ColorsContext.Provider value={themeColors}>
      <View style={[styles.page, showLandingChrome && styles.desktopPage]}>
        {showLandingChrome && (
          <View style={styles.introPanel}>
            <View style={styles.introBrandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
              <Text style={styles.brandName}>eGABAY</Text>
            </View>
            <Text style={styles.introEyebrow}>MARINDUQUE, PHILIPPINES</Text>
            <Text style={styles.introTitle}>Getting around the island, made easier.</Text>
            <Text style={styles.introBody}>Explore local routes, plan your next ride, and check service updates in one place.</Text>
            <View style={styles.introTags}>
              <Text style={styles.introTag}>Route planning</Text>
              <Text style={styles.introTag}>Local updates</Text>
              <Text style={styles.introTag}>Made for commuters</Text>
            </View>
          </View>
        )}
        <View style={showLandingChrome ? styles.appFrame : styles.appFrameFill}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {actionError && <ErrorBanner message={actionError} />}
          {stage === 'admin-preview' ? (
            <SuperAdminWorkspaceScreen preview account={adminPreviewAccount} onLogout={() => setStage('login')} onOpenCommuter={() => setStage('login')} onRefreshSession={() => {}} />
          ) : auth.loading ? (
            <View style={styles.authStatus}><ActivityIndicator color={themeColors.greenDark} /><Text style={styles.authStatusCopy}>Connecting your account…</Text></View>
          ) : auth.error ? (
            <View style={styles.authStatus}>
              <Text style={styles.authStatusTitle}>We couldn’t open your account</Text>
              <Text style={styles.authStatusCopy}>{auth.error}</Text>
              <Button label="Retry" onPress={() => { if (!auth.userId) setStage('login'); auth.retry(); }} />
              <Button label="Sign out" variant="ghost" onPress={() => void leaveSession()} loading={signingOut} />
            </View>
          ) : auth.recovering && auth.userId ? (
            <PasswordRecoveryScreen onDone={() => { auth.finishRecovery(); setStage('app'); }} onCancel={() => void leaveSession()} />
          ) : (
            <>
              {stage === 'onboarding' && <OnboardingScreen onDone={finishOnboarding} />}
              {stage === 'welcome' && <WelcomeScreen onLogin={() => setStage('login')} onSignUp={() => setStage('signup')} onOffline={enterAsGuest} />}
              {stage === 'login' && <LoginScreen
                onBack={() => setStage('welcome')}
                onSignUp={() => setStage('signup')}
                onChairpersonPreview={() => setStage('chairperson')}
                onDriverPreview={() => setStage('driver')}
                onAdminPreview={() => setStage('admin-preview')}
              />}
              {stage === 'chairperson' && <ChairpersonConsoleScreen onBack={() => setStage('login')} />}
              {stage === 'driver' && <DriverWorkspaceScreen appearance={appearance} onChangeAppearance={chooseAppearance} onBack={() => setStage('login')} />}
              {stage === 'signup' && <SignUpScreen onBack={() => setStage('welcome')} onLogin={() => setStage('login')} />}
              {stage === 'app' && session && (staffAccount && !showCommuterView ? (
                staffAccount.role === 'super_admin' ? (
                  <SuperAdminWorkspaceScreen account={staffAccount} onLogout={() => void leaveSession()} onOpenCommuter={() => setShowCommuterView(true)} onRefreshSession={auth.retry} />
                ) : (
                  <RoleWorkspaceScreen account={staffAccount} onLogout={() => void leaveSession()} onOpenCommuter={() => setShowCommuterView(true)} onRefreshSession={auth.retry} />
                )
              ) : (
                <>
                  {staffAccount && <Button label="Return to your workspace" variant="secondary" onPress={() => setShowCommuterView(false)} />}
                  <MainShell session={session} mode={mode} onChangeMode={chooseMode} appearance={appearance} onChangeAppearance={chooseAppearance} onReset={() => void resetApp()} onLogout={() => void leaveSession()} onAuthRequest={requestAuth} />
                </>
              ))}
            </>
          )}
        </View>
      </View>
    </ColorsContext.Provider>
  );
}

function createAppStyles(colors: typeof lightColors) {
  return {
    page: { flex: 1, backgroundColor: colors.canvas },
    authStatus: { flex: 1, justifyContent: 'center' as const, padding: 24, gap: 16 },
    authStatusTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' as const },
    authStatusCopy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    desktopPage: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: '7%' as const, gap: 48, backgroundColor: colors.canvas },
    introPanel: { flex: 1, maxWidth: 520 },
    introBrandRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 64 },
    brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center' as const, justifyContent: 'center' as const },
    brandMarkText: { color: colors.lime, fontSize: 22, fontWeight: '900' as const, lineHeight: 25 },
    brandName: { color: colors.ink, fontSize: 16, fontWeight: '900' as const, letterSpacing: 1.1 },
    introEyebrow: { color: colors.green, fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5, marginBottom: 14 },
    introTitle: { color: colors.ink, fontSize: 48, lineHeight: 55, letterSpacing: -1.8, fontWeight: '800' as const, maxWidth: 500 },
    introBody: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 18, maxWidth: 390 },
    introTags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 28 },
    introTag: { color: colors.greenDark, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' as const, paddingVertical: 9, paddingHorizontal: 13, fontSize: 11, fontWeight: '700' as const },
    appFrameFill: { flex: 1, width: '100%' as const },
    appFrame: { width: 420, flexGrow: 0, flexShrink: 0, height: '94%' as const, maxHeight: 940, borderRadius: 28, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' as const, backgroundColor: colors.canvas, shadowColor: '#173322', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.13, shadowRadius: 30, elevation: 8 },
  };
}
