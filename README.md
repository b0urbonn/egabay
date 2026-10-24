# eGABAY

React Native starter for an AI-assisted public transportation navigation and monitoring app for Marinduque. It uses Expo for the mobile client and Supabase for Postgres, authentication, and Realtime.

## Current starter

- Four local prototype tabs: Home, Plan, Updates, and Profile
- Sample Boac, Gasan, and Santa Cruz route cards and service notices
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

    App.tsx                          Mobile prototype and local tab navigation
    src/components/MarinduqueMap.tsx Leaflet map embed (WebView native / iframe web)
    src/data/demo.ts                 Explicitly non-live sample routes and notices
    src/lib/supabase.ts              Supabase client and session persistence
    src/theme.ts                     Shared visual tokens
    assets/marinduque-map.html       Marinduque-only Leaflet page (OSM + Nominatim)
    metro.config.js                  Bundles .html files as app assets
    supabase/migrations/             Database schema, policies, and Realtime setup
    BUILD_PLAN.md                    Product and implementation milestones

## Next implementation step

Confirm the first pilot routes, modes, fares, stop coordinates, timetable expectations, and who is allowed to publish service updates. Replace the demo arrays with typed Supabase queries only after those records have a trusted owner and review process.
