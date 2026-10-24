import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, useColorScheme, useWindowDimensions, View } from 'react-native';

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
import { LoginScreen } from './src/screens/LoginScreen';
import { MainShell } from './src/screens/MainShell';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { darkColors, lightColors } from './src/theme';

type Stage = 'onboarding' | 'welcome' | 'login' | 'signup' | 'app';

function initialStage(): Stage {
  if (!isOnboardingDone()) return 'onboarding';
  return getStoredSession() ? 'app' : 'welcome';
}

export default function App() {
  const systemScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [stage, setStage] = useState<Stage>(initialStage);
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [mode, setMode] = useState<AppMode>(() => {
    const stored = getStoredMode();
    if (stored) return stored;
    return getStoredSession()?.kind === 'guest' ? 'offline' : 'online';
  });
  const [appearance, setAppearance] = useState<AppearanceSetting>(() => getStoredAppearance());

  const isDark = appearance === 'dark' || (appearance === 'system' && systemScheme === 'dark');
  const themeColors = isDark ? darkColors : lightColors;
  const isWideWeb = Platform.OS === 'web' && width >= 1024;
  const styles = createAppStyles(themeColors);

  const chooseMode = (next: AppMode) => {
    setStoredMode(next);
    setMode(next);
  };

  const chooseAppearance = (next: AppearanceSetting) => {
    setStoredAppearance(next);
    setAppearance(next);
  };

  const finishOnboarding = () => {
    setOnboardingDone();
    setStage('welcome');
  };

  const enterWithSession = (next: Session, nextMode: AppMode) => {
    setStoredSession(next);
    setStoredMode(nextMode);
    setSession(next);
    setMode(nextMode);
    setStage('app');
  };

  const leaveSession = (target: Stage) => {
    clearStoredSession();
    setSession(null);
    setStage(target);
  };

  const resetApp = () => {
    clearOnboardingDone();
    clearStoredSession();
    clearStoredMode();
    clearStoredAppearance();
    setSession(null);
    setMode('online');
    setAppearance('system');
    setStage('onboarding');
  };

  return (
    <ColorsContext.Provider value={themeColors}>
      <View style={[styles.page, isWideWeb && styles.desktopPage]}>
        {isWideWeb && (
          <View style={styles.introPanel}>
            <View style={styles.introBrandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
              <Text style={styles.brandName}>eGABAY</Text>
            </View>
            <Text style={styles.introEyebrow}>MARINDUQUE, PHILIPPINES</Text>
            <Text style={styles.introTitle}>Getting around the island, made easier.</Text>
            <Text style={styles.introBody}>
              Explore local routes, plan your next ride, and check service updates in one place.
            </Text>
            <View style={styles.introTags}>
              <Text style={styles.introTag}>Route planning</Text>
              <Text style={styles.introTag}>Local updates</Text>
              <Text style={styles.introTag}>Made for commuters</Text>
            </View>
          </View>
        )}
        <View style={[styles.appFrameFill, isWideWeb && styles.appFrame]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {stage === 'onboarding' && <OnboardingScreen onDone={finishOnboarding} />}
          {stage === 'welcome' && (
            <WelcomeScreen
              onLogin={() => setStage('login')}
              onSignUp={() => setStage('signup')}
              onOffline={() => enterWithSession({ kind: 'guest' }, 'offline')}
            />
          )}
          {stage === 'login' && (
            <LoginScreen
              onBack={() => setStage('welcome')}
              onSignUp={() => setStage('signup')}
              onSuccess={(s) => enterWithSession(s, 'online')}
            />
          )}
          {stage === 'signup' && (
            <SignUpScreen
              onBack={() => setStage('welcome')}
              onLogin={() => setStage('login')}
              onSuccess={(s) => enterWithSession(s, 'online')}
            />
          )}
          {stage === 'app' && session && (
            <MainShell
              session={session}
              mode={mode}
              onChangeMode={chooseMode}
              appearance={appearance}
              onChangeAppearance={chooseAppearance}
              onReset={resetApp}
              onLogout={() => leaveSession('welcome')}
              onAuthRequest={() => leaveSession('welcome')}
            />
          )}
        </View>
      </View>
    </ColorsContext.Provider>
  );
}

function createAppStyles(colors: typeof lightColors) {
  return {
    page: { flex: 1, backgroundColor: colors.canvas },
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
    appFrame: { width: 420, flex: 0, height: '94%' as const, maxHeight: 940, borderRadius: 28, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' as const, backgroundColor: colors.canvas, shadowColor: '#173322', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.13, shadowRadius: 30, elevation: 8 },
  };
}
