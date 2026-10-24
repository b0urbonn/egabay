# eGABAY

React Native starter for an AI-assisted public transportation navigation and monitoring app for Marinduque. It uses Expo for the mobile client and Supabase for Postgres, authentication, and Realtime.

## Current starter

- Guided first-run flow: onboarding slides → welcome → mock login/sign-up or "Continue offline" → main app
- Four tabs inside the app shell: Home, Plan, Updates, and Profile, plus a Settings sub-screen (appearance, two-tap reset)
- Mock auth and guest sessions persisted locally (expo-sqlite localStorage); demo account `demo@egabay.ph`
- Online/offline connection modes; guests run offline and can create an account later from Profile
- Sample routes and service notices across Marinduque towns, clearly labeled as demo content
- Route planning interactions backed by clearly marked sample data
- Supabase client scaffold with persistent auth storage through expo-sqlite
- Initial Postgres schema with row-level security and Realtime tables
- Staged implementation milestones in BUILD_PLAN.md

All route names, fares, travel times, vehicle counts, and notices in the UI are mock content. Confirm these with transport operators and local authorities before presenting them as live information.

## Run the app

Use Node.js 22.13 or newer. Install dependencies, then start Expo:

    npm install
    npm run web

This opens the web version in your browser. Use npm run start to choose a platform, or npm run ios and npm run android to open the native simulators.

## Connect Supabase

1. Create a Supabase project.
2. Copy .env.example to .env.local.
3. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the project API settings.
4. Apply supabase/migrations/20261024000000_initial_schema.sql in the Supabase SQL Editor, or install the Supabase CLI, authenticate, link this folder to your project, and run npx supabase db push.
5. Restart Expo after changing environment variables.

Only the Supabase publishable key belongs in the mobile app. Never put a service-role key in an EXPO_PUBLIC_ variable or ship it in the app.

## Project map

    App.tsx                          Stage routing: onboarding → welcome → auth → app shell
    src/screens/OnboardingScreen.tsx First-run "about the app" slides
    src/screens/WelcomeScreen.tsx    Login / sign up / continue offline entry
    src/screens/LoginScreen.tsx      Mock login with demo account hint
    src/screens/SignUpScreen.tsx     Mock account creation with validation
    src/screens/MainShell.tsx        Header, bottom tabs, Settings sub-screen
    src/screens/HomeScreen.tsx       Greeting, status, search entry, quick actions
    src/screens/ProfileScreen.tsx    Account/guest profile, mode switch, log out
    src/screens/SettingsScreen.tsx   Appearance picker and reset
    src/components/ui.tsx            Shared UI kit (Button, TextField, Card, Chip, Badge)
    src/components/MarinduqueMap.tsx Leaflet map embed (WebView native / iframe web)
    src/components/RouteCard.tsx     Route summary card
    src/lib/session.ts               Mock auth, session, and onboarding persistence
    src/lib/storage.ts               Safe localStorage wrappers
    src/lib/appMode.ts               Online/offline mode persistence
    src/lib/appearance.ts            Appearance setting persistence
    src/lib/supabase.ts              Supabase client and session persistence
    src/data/demo.ts                 Explicitly non-live sample routes and notices
    src/theme.ts                     Shared visual tokens
    assets/marinduque-map.html       Marinduque-only Leaflet page (OSM + Nominatim)
    metro.config.js                  Bundles .html files as app assets
    supabase/migrations/             Database schema, policies, and Realtime setup
    BUILD_PLAN.md                    Product and implementation milestones

## Next implementation step

Confirm the first pilot routes, modes, fares, stop coordinates, timetable expectations, and who is allowed to publish service updates. Replace the demo arrays with typed Supabase queries only after those records have a trusted owner and review process.
