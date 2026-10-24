# Changelog

This file records repository changes visible in local Git history and `origin/main`. The [checklist](CHECKLIST.md) tracks implementation and the branch differences.

## 2026-10-24

The repository is public. Local `main` is `93a6bda`; public `origin/main` is `00a1107`. Local `main` is 2 commits ahead and has not been pushed.

- **Public travel dashboard + web Supabase client** — Redesigned the Home screen as a travel dashboard and added a browser-specific Supabase client using browser `localStorage`. Dashboard routes and notices still come from demo arrays. (`3121b49`)
- **Public navigation change** — Removed the Plan and Updates tabs/screens. Public navigation now contains Home, Map, and Profile, with Settings as a sub-screen. (`b874c4e`)
- **Public branch merge** — Merged the newer public dashboard/navigation changes to the current public `main`. (`00a1107`)
- **Local merge** — Merged `origin/main` into the workspace and restored the checklist to a root file. The local branch now contains the dashboard, Home/Map/Profile navigation, and web Supabase client. (`93a6bda`)
- **UI and offline demo flow** — Added onboarding, welcome, mock login/sign-up, guest/offline entry, local session persistence, and the main commuter screens. Route and notice content remains sample data. (`45b44d4`)
- **Map view** — Added the Marinduque map view and map interactions using Leaflet. (`0def165`)
- **Project scaffold** — Added the Expo/React Native TypeScript app and initial Supabase scaffold/build plan. (`d86ac73`)
- **Local status docs** — Added the root checklist and changelog and linked them from the local README. (`d22d789`)
- **Public checklist path** — A public commit added the checklist at `CHECKLIST.md/CHECKLIST.md`, one directory below the repository root. It did not add a changelog or update the README links. (`47c1639`)

## Changelog notes

- A migration file and Supabase client scaffold are in the repository; a deployed Supabase backend and live app data are not evidenced by repository code.
- Route names, fares, times, vehicle counts, and service notices are demo content until verified with local transport sources.
- Public `origin/main` still has the checklist nested at `CHECKLIST.md/CHECKLIST.md`; this workspace has the restored root checklist.
- Push the two local commits before assuming the public repo has the same docs and source state as this workspace.
- Add a dated entry when a user-visible feature or backend milestone lands. Keep unfinished work in `CHECKLIST.md`.

