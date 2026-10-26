# eGABAY

React Native starter for an AI-assisted public transportation navigation and monitoring app for Marinduque. It uses Expo for the mobile client and Supabase for Postgres, authentication, and Realtime.

## Current starter

- Guided first-run flow: onboarding slides → welcome → mock login/sign-up or "Continue offline" → main app
- Four tabs inside the app shell: Home, Trips, Map, and Profile, plus Settings and Terminals sub-screens
- Mock auth and guest sessions persisted locally (expo-sqlite localStorage); demo account `demo@egabay.ph`
- Online/offline connection modes; guests run offline and can create an account later from Profile
- Sample routes and service notices across Marinduque towns, clearly labeled as demo content
- Home dashboard route and service notice previews backed by clearly marked sample data
- Supabase client scaffold with persistent auth storage through expo-sqlite
- Initial Postgres schema with row-level security and Realtime tables
- Staged implementation milestones in BUILD_PLAN.md
- Current fact-based progress checklist in CHECKLIST.md and repository history in CHANGELOG.md

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

    .
    ├── App.tsx                              Stage routing: onboarding → welcome → auth → app shell
    ├── index.ts                             Expo entry point
    ├── app.json                             Expo app config
    ├── metro.config.js                      Bundles .html and .wasm files as app assets
    ├── package.json                         Scripts (start/web/build:map/typecheck) and dependencies
    │
    ├── src/
    │   ├── theme.ts                         Shared visual tokens
    │   ├── screens/
    │   │   ├── OnboardingScreen.tsx         First-run "about the app" slides
    │   │   ├── WelcomeScreen.tsx            Login / sign up / continue offline entry
    │   │   ├── LoginScreen.tsx              Mock login with demo account hint
    │   │   ├── SignUpScreen.tsx             Mock account creation with validation
    │   │   ├── MainShell.tsx                Bottom tabs (Home, Trips, Map, Profile) + Settings/Terminals sub-screens
    │   │   ├── HomeScreen.tsx               Travel dashboard with sample routes and notices
    │   │   ├── TripsScreen.tsx              Trips tab with compact trip cards
    │   │   ├── TerminalsScreen.tsx          Per-municipality land-transport terminals directory
    │   │   ├── ProfileScreen.tsx            Account/guest profile, mode switch, log out
    │   │   └── SettingsScreen.tsx           Appearance picker and reset
    │   ├── components/
    │   │   ├── ui.tsx                       Shared UI kit (Button, TextField, Card, Chip, Badge)
    │   │   ├── MarinduqueMap.tsx            MapLibre map embed (WebView on native)
    │   │   ├── MarinduqueMap.web.tsx        MapLibre map embed (iframe on web)
    │   │   ├── MaterialIcon.tsx             Material-style icons drawn with react-native-svg
    │   │   ├── MapTabIcon.tsx               Folded-map-with-pin tab icon
    │   │   └── RouteCard.tsx                Route summary card
    │   ├── lib/
    │   │   ├── session.ts                   Mock auth, session, and onboarding persistence
    │   │   ├── storage.ts                   Safe localStorage wrappers
    │   │   ├── appMode.ts                   Online/offline mode persistence
    │   │   ├── appearance.ts                Appearance setting persistence
    │   │   ├── theme.ts                     Theme context and hooks (useColors, useThemeStyles)
    │   │   ├── supabase.ts                  Supabase client and session persistence
    │   │   └── supabase.web.ts              Browser Supabase client using localStorage
    │   └── data/
    │       └── demo.ts                      Explicitly non-live sample routes and notices
    │
    ├── assets/
    │   ├── map/
    │   │   ├── index.html                   Map page shell (scripts load in dependency order)
    │   │   ├── js/                          9 feature modules: config, data, helpers, map-core,
    │   │   │                                markers, routes, boundary, search, assistant
    │   │   ├── css/                         3 stylesheets: marinduque-map, features, assistant
    │   │   └── vendor/                      Vendored MapLibre GL (js + css, no CDN dependency)
    │   └── generated/
    │       └── marinduque-map.html          GENERATED map bundle — build output, NOT committed;
    │                                        `npm run build:map` regenerates it (auto on start)
    │
    ├── scripts/
    │   └── build-map.mjs                    Inlines assets/map/* into the bundled map page
    ├── supabase/
    │   └── migrations/                      Database schema, policies, and Realtime setup
    │
    ├── BUILD_PLAN.md                        Product and implementation milestones (incl. RBAC roles)
    ├── CHECKLIST.md                         Current status against the build plan
    └── CHANGELOG.md                         Dated record of repository changes

## Next implementation step

Confirm the first pilot routes, modes, fares, stop coordinates, timetable expectations, and who is allowed to publish service updates. Replace the demo arrays with typed Supabase queries only after those records have a trusted owner and review process.
