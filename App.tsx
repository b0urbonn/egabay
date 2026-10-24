import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

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
    </ColorsContext.Provider>
  );
}
