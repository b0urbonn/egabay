# Changelog

This file records repository changes visible in local Git history and `origin/main`. The [checklist](CHECKLIST.md) tracks implementation and the branch differences.

## 2026-10-24

The repository is public. Every commit below is on public `origin/main`.

- **Unused import cleanup** — Removed the unused `spacing` import from `src/components/ui.tsx` (left over since `45b44d4`), and recorded the Home redesign in the docs. (`6e18cfb`)
- **Merge of the Home redesign** — Merged `874abe8` into local `main` alongside the docs commit `68ca474`; no conflicts. (`b869e8c`)
- **Home screen redesigned (Apple HIG layout)** — Replaced the stacked dashboard cards with a large-title header (today's date and "Good …, name"), a "Where to?" search field, quick-place pills, and inset grouped lists for **Routes** (first 3 sample routes, "See All") and **Service Updates** (first 2 sample notices). The search field, place pills, and route rows open the Map tab. When offline, a "You're offline · Showing saved routes and fares" card appears with a "Manage" link to Profile; there is no longer an "Online" status line. Added `fill` colors to the theme. Content is still sample data ("Sample data — live information coming soon."). (`874abe8`, Raphael Dale R. Ogbac)
- **Docs fix** — Moved the map/Map-tab entries out of "Unreleased" now that they were pushed in `497cad7`. (`68ca474`)
- **Settings screen simplified** — The Settings sub-screen now has a "‹ Back" button (labelled "Back to profile" for screen readers), a plain "Settings" title, and an Appearance card with System/Light/Dark rows and radio buttons (the ◐/☀/☾ glyphs were removed). The reset option is now a "Reset app" section with a "Reset eGABAY" button; it still needs a second tap within 3 seconds to confirm. The "eGABAY · v1.0.0 · Marinduque pilot" footer was removed. (`5e10e85`, Lyka Tolosa)
- **Map markers and controls** — Town markers are now map pins (teardrop pin with a white centre) whose tip sits on the town's coordinate, replacing the green diamonds. Every map control — zoom, layer switcher, expand, compass, locate button, scale bar, attribution, and toast messages — now uses the same floating white card, border, and shadow as the search bar. The map's edge shading was moved inside the map so it no longer darkens the controls. The layer switcher's "Waypoints" overlay was renamed to "Towns". (`497cad7`)
- **Map tab icon** — The navbar's Map tab now shows a folded map with the same location pin used on the map page, replacing the `◈` glyph. It follows the tab's selected/unselected colors. Added `react-native-svg` (15.16.0) to draw it. (`497cad7`)
- **Unused import cleanup** — Removed the `spacing` import from `MainShell.tsx`; nothing used it after the app header was removed in `0097625`. The README's `MainShell.tsx` description no longer mentions a header. (`497cad7`)
- **Profile redesign + app header removed** — Removed the top app header from `MainShell` (eGABAY brand, OFFLINE/MARINDUQUE badges, and the ⚙ settings button). Settings is now opened from Profile → Preferences → Settings; online/offline status is still shown on the Home status line. The Profile screen now has a "Profile" title, an identity card (initials, name and email, or "Guest mode"), an Online/Offline travel-mode switch for signed-in accounts, a sign-in card for guests, and a Preferences group (Settings, Service area). The old "Supabase ready / Backend not connected" row was removed. (`0097625`, Lyka Tolosa)
- **Docs update** — Updated the changelog, checklist, and README after the merges. (`392bd4b`)
- **Mobile navigation fix** — The app container had no flex style on narrow screens, so it collapsed to its content height and pushed the bottom tab bar off-screen. It now always fills the screen; the wide-web phone frame is unchanged. (`97c44de`)
- **Local merge of the mobile fix** — Pulled `97c44de` into local `main`. (`972a8e6`)
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
- The nested `CHECKLIST.md/CHECKLIST.md` path is fixed on public `origin/main`; the checklist and changelog are at the repository root.
- Public `origin/main` includes every commit in the log below. Check `git status` for anything newer.
- Add a dated entry when a user-visible feature or backend milestone lands. Keep unfinished work in `CHECKLIST.md`.

## Commit log

Every commit on `main`, newest first (from `git log`). Times are +0800. The commit that updates this table can't list itself; it is added by the next docs update.

| Commit | Date | Author | Message |
| --- | --- | --- | --- |
| `6e18cfb` | 2026-10-24 16:04 | Raphael Dale Ogbac | Track Home redesign in docs and drop unused import |
| `b869e8c` | 2026-10-24 16:03 | Raphael Dale Ogbac | Merge branch 'main' of https://github.com/b0urbonn/egabay |
| `68ca474` | 2026-10-24 16:03 | Raphael Dale Ogbac | fixed whatever the heck happened |
| `874abe8` | 2026-10-24 16:02 | Raphael Dale R. Ogbac | Simplify home screen using Apple HIG layout |
| `5e10e85` | 2026-10-24 15:57 | Lyka Tolosa | Simplify settings screen |
| `497cad7` | 2026-10-24 15:56 | Raphael Dale Ogbac | change the ui in the map and map button |
| `0097625` | 2026-10-24 15:48 | Lyka Tolosa | Refine profile and remove app header |
| `392bd4b` | 2026-10-24 15:33 | Raphael Dale Ogbac | added changelogs and checklist |
| `972a8e6` | 2026-10-24 15:32 | Raphael Dale Ogbac | Merge branch 'main' of https://github.com/b0urbonn/egabay |
| `97c44de` | 2026-10-24 15:31 | Raphael Dale Ogbac | Fix bottom navigation hidden on mobile |
| `93a6bda` | 2026-10-24 15:25 | Raphael Dale Ogbac | Merge origin/main; restore CHECKLIST.md as a root file |
| `00a1107` | 2026-10-24 15:23 | Raphael Dale Ogbac | Merge remote-tracking branch 'origin/main' |
| `d22d789` | 2026-10-24 15:22 | Raphael Dale Ogbac | added the checklist and changelogs |
| `b874c4e` | 2026-10-24 15:22 | Raphael Dale Ogbac | Remove Plan and Updates tabs |
| `47c1639` | 2026-10-24 15:21 | Raphael Dale R. Ogbac | docs: add current project checklist |
| `3121b49` | 2026-10-24 15:00 | Lyka Tolosa | Add travel dashboard and web Supabase client |
| `4ed2920` | 2026-10-24 14:49 | Raphael Dale Ogbac | Merge remote-tracking branch 'origin/main' |
| `45b44d4` | 2026-10-24 14:48 | Raphael Dale Ogbac | Rebuild UI/UX with onboarding, mock auth, and offline flow |
| `0def165` | 2026-10-24 14:44 | Raphael Dale Ogbac | Added map and functions of the map |
| `d86ac73` | 2026-10-24 13:44 | Raphael Dale Ogbac | init the repo and created the scaffold for react native and supabase |

