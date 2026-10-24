# Changelog

This file records repository changes that are present in Git. The checklist in [CHECKLIST.md](CHECKLIST.md) tracks current implementation status and remaining work.

## 2026-10-24

Current repository snapshot: public GitHub repository, `main` at `4ed2920`.

- **UI and offline demo flow** — Added onboarding, welcome, mock login/sign-up, guest/offline entry, local session persistence, and the main commuter screens. Route and notice content remains sample data. (`45b44d4`)
- **Map view** — Added the Marinduque map view and map interactions using Leaflet. (`0def165`)
- **Project scaffold** — Added the Expo/React Native TypeScript app and initial Supabase scaffold/build plan. (`d86ac73`)

## Changelog notes

- A migration file and Supabase client scaffold are in the repository; a deployed Supabase backend and live app data are not evidenced by repository code.
- Route names, fares, times, vehicle counts, and service notices are demo content until verified with local transport sources.
- Add a dated entry when a user-visible feature or backend milestone lands. Keep unfinished work in `CHECKLIST.md`.

