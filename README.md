# eGABAY

React Native starter for an AI-assisted public transportation navigation and monitoring app for Marinduque. It uses Expo for the mobile client and Supabase for Postgres, authentication, and Realtime.

## Current starter

- Guided first-run flow: onboarding slides → welcome → Supabase Google/email sign-in or "Continue offline" → role-aware app
- Four tabs inside the app shell: Home, Trips, Map, and Profile, plus Settings and Terminals sub-screens
- Real Supabase browser authentication with PKCE, session restoration, email confirmation/recovery, and guest browsing; old mock accounts are ignored
- Online/offline connection modes; guests run offline and can create an account later from Profile
- Sample routes and service notices across Marinduque towns, clearly labeled as demo content
- Home dashboard route and service notice previews backed by clearly marked sample data
- Supabase clients with browser session storage and a separate native SQLite adapter
- Initial catalog plus a group-scoped role migration, protected role RPCs, public-safe vehicle view, and isolated database integration checks
- Chairperson console preview opened from the Log in screen, with engineered mobile layouts, five bottom tabs, terminal and vehicle forms, driver approvals, assignments, and announcements; sample data and local preview actions
- Driver workspace preview opened from the Log in screen (Apple HIG layout): grouped lists, segmented availability and System/Light/Dark appearance controls, trip start/stop consent sheet, read-only group announcements, profile editor, and group application flow; sample data only, no GPS or backend
- [Driver mobile wireframes and interaction specification](docs/design/DRIVER_MOBILE_UI.md)
- [Chairperson mobile wireframes and interaction specification](docs/design/CHAIRPERSON_MOBILE_UI.md)
- Staged implementation milestones in BUILD_PLAN.md
- Current fact-based progress checklist in CHECKLIST.md and repository history in CHANGELOG.md

All route names, fares, travel times, vehicle counts, and notices in the UI are mock content. Confirm these with transport operators and local authorities before presenting them as live information.

## Run the app

Use Node.js 22.13 or newer. Install dependencies, then start Expo:

    npm install
    npm run web

This opens the web version in your browser. Use npm run start to choose a platform, or npm run ios and npm run android to open the native simulators.

## Connect Supabase

Follow [the project-specific Supabase setup guide](docs/SUPABASE_AUTH_SETUP.md).

1. Configure `.env.local` using `.env.example`, including the local-only first-owner email.
2. Enable Google and configure the website callback URLs in Google Cloud and Supabase.
3. For an **empty** project, run `npm run build:database` and apply the complete generated `supabase/generated/setup.sql` in the SQL Editor once.
4. Sign in as the verified first owner, then apply `supabase/generated/bootstrap_super_admin.sql` in the SQL Editor and reload the app.
5. Run `npm run web -- --port 8081` for desktop and responsive browser development.

The source migrations and bootstrap template are committed; generated SQL and `.env.local` are ignored. The publishable key belongs in the browser app; secret/service-role keys stay off the frontend. The role workspaces are the first authentication slice; operational group/terminal/vehicle consoles and verified catalog reads are still being built.

Checks: `npm run typecheck`, `npm run test:database`, and `npm run build:map`. The database checks use an isolated in-memory PostgreSQL engine and never modify your live Supabase project.

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
    │   │   ├── LoginScreen.tsx              Supabase Google/email sign-in and password-reset request
    │   │   ├── SignUpScreen.tsx             Supabase signup with email-confirmation handling
    │   │   ├── PasswordRecoveryScreen.tsx  Verified recovery session password form
    │   │   ├── RoleWorkspaceScreen.tsx     Desktop admin / responsive staff entry
    │   │   ├── MainShell.tsx                Bottom tabs (Home, Trips, Map, Profile) + Settings/Terminals sub-screens
    │   │   ├── HomeScreen.tsx               Travel dashboard with sample routes and notices
    │   │   ├── TripsScreen.tsx              Trips tab with compact trip cards
    │   │   ├── TerminalsScreen.tsx          Per-municipality land-transport terminals directory
    │   │   ├── ChairpersonConsoleScreen.tsx  Preview of the planned group-scoped chairperson console
    │   │   ├── DriverWorkspaceScreen.tsx     Preview of the planned driver workspace
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
    │   │   ├── session.ts                   Account role types, guest preference, and onboarding state
    │   │   ├── auth.ts                      Supabase auth operations and protected profile reads
    │   │   ├── useAuthSession.ts            Session subscription, restoration, and profile loading
    │   │   ├── storage.web.ts               Browser-only preference storage
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
    │   ├── migrations/                      Catalog and group-scoped authentication policies
    │   ├── admin/                           First-owner bootstrap SQL template
    │   └── generated/                       Ignored SQL Editor setup and local bootstrap output
    │
    ├── BUILD_PLAN.md                        Product and implementation milestones (incl. RBAC roles)
    ├── CHECKLIST.md                         Current status against the build plan
    └── CHANGELOG.md                         Dated record of repository changes

## Next implementation step

Confirm the first pilot routes, modes, fares, stop coordinates, timetable expectations, and who is allowed to publish service updates. Replace the demo arrays with typed Supabase queries only after those records have a trusted owner and review process.
