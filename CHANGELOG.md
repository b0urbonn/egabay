# Changelog

This file records repository changes visible in local Git history and `origin/main`. The [checklist](CHECKLIST.md) tracks implementation and the branch differences.

## 2026-10-26

- **Super Admin wireframes and web layouts** — Added eleven editable vector layouts and a layout/interaction specification. Refined text sizes, 44px controls, registry columns, compact cards, loading/error states, record inspectors, and role-change review. Added an isolated sample-data preview from Login and `?preview=super-admin`, with local group forms, chairperson selection, status changes, and audit examples. Live group/terminal/vehicle mutation flows remain pending.

- **Merge: driver appearance + terminals bridge (`53d160a` → local)** — Pulled `origin/main` (driver preview appearance selector); conflicts in `CHANGELOG.md`/`CHECKLIST.md` resolved by keeping the union of both sides' entries.
- **Map connected to the `terminals` table (`2b96b57`)** — The app now streams live terminal rows into the map: `src/lib/terminals.ts` queries `public.terminals` (anon-readable via the `terminals_public` RLS policy) and subscribes to `postgres_changes`; both `MarinduqueMap` wrappers push `{ type: 'egabay:terminals', terminals }` into the embedded page — WebView `postMessage` on native, `contentWindow.postMessage` on web — when the page announces `egabay:ready`. New `assets/map/js/terminals.js` receives the payload, replaces the sample transport-hub POIs with lime-ringed `terminal-dot` markers (popups keep Directions / Set as start), and shows a count toast. Map falls back to sample POIs when the payload is empty or Supabase is unconfigured. Requires `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env` — not yet present locally.
- **Terminal seed data (`2b96b57`)** — `supabase/seed.sql` inserts six municipality transport groups (jeepney/TODA) and seven terminals: four OSM-derived real locations (Boac Jeepney Terminal, Boac–Balanacan on Magsaysay Drive, Mogpog–Boac on Rizal St, Torrijos tricycle terminal on the Circumferential Rd) plus town-center placeholders for Gasan/Buenavista/Santa Cruz flagged "needs verification". Applies on `supabase db reset` or via SQL editor on the hosted project.
- **Merge: driver/chairperson previews + desktop layout (`0664c57` → `7b95273`)** — Pulled `origin/main`; conflicts in `MainShell.tsx` (kept the animated hidable rail), `CHANGELOG.md`, and `CHECKLIST.md` (kept the union of both sides' entries).
- **Responsive web app layout for the commuter shell (`62a6f15`)** — Wide web (≥1024 px) no longer shows the phone frame inside the app: the landing chrome (intro panel + framed card) now applies only to onboarding/welcome/login/signup, and the signed-in app renders full-width. `MainShell` swaps the bottom tab bar for a left navigation rail (brand mark + icon/label rows); list screens render in a centered 1240 px column while the Map tab takes the full content area. Narrow web and native are unchanged.
- **Wide-web space utilization (`62a6f15`)** — Screens now use the horizontal space instead of a single narrow column: Home places the search field beside the greeting and splits into quick-access + banner (left) and Recent Routes (right); Trips and Terminals lists become two-column card grids; Profile and Terminal details go two-column (terminal map grows to 300 px beside contact + routes); Settings shows Appearance and Reset side-by-side. Powered by a new shared `useWideLayout()` hook (`src/lib/useWideLayout.ts`).
- **Hidable navigation rail (`62a6f15`)** — The rail's eGABAY brand mark doubles as the collapse toggle: tapping it slides the sidebar closed (220 ms `Animated` width + fade), and a floating logo card fading in at top-left brings it back. No hamburger icon by design.
- **Merge: Supabase auth branch + map routing updates (`f756072`)** — Merged `origin/main` (`643b638`: Supabase auth and role workspaces merged with the map routing/ETA/palette commits). Only `CHECKLIST.md`/`CHANGELOG.md` conflicted; resolved by keeping upstream's auth entries and the map entries with commit refs. `npm install` pulled the new auth dependency; `tsc` clean.
- **Supabase browser auth and group-access foundation (committed in `bbc391b`; live setup pending)** — Replaced mock accounts with Google/email authentication, PKCE callbacks, session/profile restoration, password recovery, role-specific initial workspaces, and Google profile photos. Added a group-scoped RBAC migration, protected role-management RPCs, public-safe vehicle projection, first-owner bootstrap template, setup guide, and 13 isolated PostgreSQL policy checks. Applying the schema and completing live Google sign-in remain pending.
- **Super Admin standby console (`0664c57`/`3318d21`)** — Added responsive navigation for overview, groups, terminals, vehicles, users and roles, reports, and audit history. Counts and directories read Supabase records; role updates use the checked admin RPC. Group, terminal, and vehicle mutation workflows remain staged for the next build-plan step. The owner bootstrap now returns the assigned role and clearly rejects the unfilled source template.
- **Driver workspace UI preview (`0664c57`, UI preview)** — Added `DriverWorkspaceScreen`, reachable from the Log in screen next to the chairperson preview. Organized around three bottom tabs (Home, Updates, Profile), a centered navigation bar, large system-font titles, grouped list rows, and controls at least 44 pt high. Home shows Available/On trip/Offline and the assigned group, vehicle, and terminal. Starting a trip requires consent; an always-visible Stop sharing action remains available while active. Updates are read-only and group-scoped. Profile includes contact/license editing, a photo entry point, and a group-application preview with a pending-review state. Six editable mobile wireframes and an interaction spec are in `docs/design/`. Data stays local; GPS is not accessed and no Supabase calls are made pending backend role access.
- **Driver appearance setting (`53d160a`, UI preview)** — Added a compact System/Light/Dark selector to the driver Profile tab. System remains the default and follows the device; explicit Light and Dark choices update eGABAY's shared appearance preference and persist with the existing app setting.
- **Chairperson mobile UI and wireframes (`0664c57`, UI preview)** — Implemented five mobile bottom tabs, contextual back/cancel actions, searchable terminal and vehicle lists, coordinate and roster validation, explicit driver/terminal/status selection, a dedicated Assignments screen, application confirmation/history, and a group announcement composer. Populated terminals must have their vehicles moved before removal. Added keyboard handling, readable controls, a wider web console, and an eight-screen SVG wireframe board with interaction notes under `docs/design/`. The preview opens from the Log in screen and is removed from the commuter Profile menu. Data remains local preview state; authenticated role routing, interactive geographic map picking, and Supabase reads/writes remain pending.
- **Interactive road routing on the map page (`1781ac9`)** — The routing origin is no longer hardcoded to Boac: it defaults to Boac, switches to the user's GPS position through locate-me, or to any marker via a new "Set as start" popup action. Every POI popup also gained a "Directions" button that routes from the current origin to the tapped place, and Nominatim search results still route from the current origin.
- **Route-details panel slimmed to an ETA card (`1781ac9`)** — Replaced the full panel (scrolling turn-by-turn list + disclaimer note, ~370×350 px) with a compact auto-sized card showing road distance, drive time, and estimated arrival time (clock time = now + OSRM duration). The OSRM request no longer fetches `steps`.
- **Map palette unified to the project scheme (`236e61c`, `9d8e9c9`)** — Route line, POI dots, and the search-result dot moved from orange (`#E9813F`) to the system green (`#176B4B`); the user-location marker became a lime (`#C6F06A`) dot with a dark-green border and pulsing ring so it's distinguishable from POI markers, and the route's start dot matches it. Sea/mask colors kept their original per-basemap blues. Basemap picker trimmed to General (VersaTiles vector) and Standard (OSM raster); Transport, Dark, and Satellite were removed.
- **Ant-colony route-ordering prototype (`1781ac9`)** — `scripts/route-aco-demo.mjs` reads the sample town coordinates out of `assets/map/js/data.js`, builds a haversine distance matrix, and uses a seeded ACO to find the optimal visit order from a chosen start town (default Boac), verified against exhaustive search (6 towns → 120 orders). Finds the global optimum on the sample data. Demo only — not wired into the map.
- **Map zoom floor fix (`5cb71e9`)** — The initial island fit uses `ISLAND_BOUNDS` with `homePadding()` and the minimum zoom was lowered from 10 to 8, so the whole island fits the frame on small screens instead of clipping to z10.
- **Build plan: four-role access model** — `BUILD_PLAN.md` specifies the hierarchy Super Admin → Groups (TODA/Jeepney) → Chairperson → Terminals → Vehicles → Drivers, with commuters outside the operator hierarchy. The RBAC migration, access policies, role RPCs, audit foundation, and initial role workspaces are now implemented; live database setup and operational management flows remain pending.
- **Web SVG icon fix (uncommitted)** — `MaterialIcon` passed `accessibilityElementsHidden` (an iOS-only RN prop) to `<Svg>`; on web, react-native-svg's `WebShape` forwards every prop to the DOM element through `unstable_createElement`, so React flagged the unrecognized DOM prop at `WebShape.js:74` in the dev overlay. Switched to `aria-hidden`, which react-native-web maps to the DOM `aria-hidden` attribute and RN maps to native accessibility hiding.
- **Docs (uncommitted)** — README "Project map" reformatted as a directory tree and corrected to the four-tab shell (Home, Trips, Map, Profile); `CHECKLIST.md` realigned to the updated build plan's milestones and role names.
- **Merge: MapLibre map + Terminals/land-transport branch (`f3abd0d`)** — Merged `origin/main` (`ffcc59e`) into local `main`. Upstream had again edited the generated `assets/marinduque-map.html` (deleted locally); their real changes — per-town land-transport hub POIs replacing the ferry-port markers, and the matching assistant reply — were ported into `assets/map/js/` sources and the bundle regenerated. Upstream also added the Terminals directory screen (from the Home explore banner), inland-transport banner imagery, Quick Access dark-mode icons, and new theme tokens. Fixed an upstream type error (`StyleSheet.absoluteFillObject` not in the installed RN types) in `8e8af40`.
- **Generated map bundle moved to `assets/generated/` and no longer committed (`9f1643a`)** — The bundled map page (inlined sources + vendored MapLibre, ~930 KB) is build output, not a source file. It now lives at `assets/generated/marinduque-map.html` with a prominent do-not-edit banner, `scripts/build-map.mjs` + both `MarinduqueMap` components were updated to match, and `assets/generated/` is gitignored — the `prestart`/`preweb`/`preandroid`/`preios` hooks regenerate it automatically (run `npm run build:map` before `expo export`/EAS builds). The file was deleted in `6495672` while the app still required it; regenerating restored the app build.
- **Lime commute route lines removed (`6495672`)** — The five lime-green demo commute polylines, their OSRM pre-fetch, the "Commute routes" basemap toggle, and dead CSS were removed. The orange selected-route line from search and the route-details panel remain.
- **Map page re-modularized + sea mask blended (`d5c2b65`, `9d05346`)** — The map page sources under `assets/map/` were split so no file exceeds ~500 lines and grouped by kind: `js/` (`config`, `data`, `helpers`, `map-core`, `markers`, `routes`, `boundary`, `search`, `assistant`) and `css/` (`marinduque-map`, `features`, `assistant`), with `vendor/` for MapLibre. Plain scripts share top-level scope, so `index.html` lists them in dependency order; `npm run build:map` inlines everything into the single-file bundle the app embeds. The sea mask now blends at the island border: its fill matches each basemap's actual ocean colour (`#bfd9f2` for the VersaTiles style) and the old hairline was replaced with a feathered `line-blur` band, so the rendered sea dissolves into the mask and the island's land transport stays the visual focus.
- **Default basemap switched to OpenMapTiles vector tiles (`d5c2b65`)** — The map render now defaults to OpenMapTiles vector tiles hosted by VersaTiles (`tiles.versatiles.org`, free, no key, CORS-enabled), labelled "General" in the basemap picker, keeping the layer separation: MapLibre GL for engine/interactions, OpenStreetMap for data (Nominatim + OSRM), OpenMapTiles for the render. The OSM-family raster fallbacks (CyclOSM "Transport", Standard, Dark, Satellite) remain in the basemap picker, and an `error` fallback drops to Standard raster if the vector style never becomes usable.
- **Merge: MapLibre rebuild + public feature branch** — Merged `origin/main` (`00193e7`) into local `main`. The public map additions were built on the old Leaflet page, so they were ported onto the MapLibre sources instead of taken verbatim: transport filter chips, the OSRM route-details panel with turn-by-turn from Boac, the preview AI-assistant chat, and the bottom-right control/toast offsets for the assistant FAB. Town pin markers were dropped to match the public design. (`f1dabcb`)
- **Map rebuilt on MapLibre GL** — Replaced the Leaflet page with MapLibre GL 4.7.1, vendored under `assets/map/vendor/` and inlined into the bundled page (no CDN/SRI dependency). Fixed porting bugs found in review: `LngLatBounds.pad()` is Leaflet-only (added `padBounds`), `tile.memomaps.de` sends no CORS header so its tiles can never load under MapLibre (replaced with CyclOSM for the Transport style), and a Nominatim no-feature path could leave the sea mask covering the world (now reveals the basemap). (`03c97f5`, uncommitted fix-ups after)
- **Profile menu and map markers** — Updated the profile menu and map markers, and added the map page's transport filters, route-details panel, and assistant chat UI. (`00193e7`, Raphael Dale Ogbac)
- **Trips tab** — Added a Trips tab and compact trip cards; bottom navigation is now Home, Trips, Map, Profile. (`f2b1a88`, Raphael Dale Ogbac)
- **Travel dashboard + map assistant UI** — Built the travel dashboard and map assistant UI. (`292786f`, Raphael Dale Ogbac)

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

- Supabase authentication and group-access migrations and client code are in the repository; a deployed backend and live app data are not evidenced by repository code.
- Route names, fares, times, vehicle counts, and service notices are demo content until verified with local transport sources.
- The nested `CHECKLIST.md/CHECKLIST.md` path is fixed on public `origin/main`; the checklist and changelog are at the repository root.
- Public `origin/main` includes every commit in the log below. Check `git status` for anything newer.
- Add a dated entry when a user-visible feature or backend milestone lands. Keep unfinished work in `CHECKLIST.md`.

## Commit log

Every commit on `main`, newest first (from `git log`). Times are +0800. The commit that updates this table can't list itself; it is added by the next docs update.

| Commit | Date | Author | Message |
| --- | --- | --- | --- |
| `53d160a` | 2026-10-26 16:00 | Raphael Dale Ogbac | feat: add appearance selector to driver preview |
| `3318d21` | 2026-10-26 15:53 | Raphael Dale Ogbac | Merge remote-tracking branch 'origin/main' |
| `4aa8cd2` | 2026-10-26 15:52 | Raphael Dale Ogbac | feat: add super admin console and clarify owner bootstrap |
| `2b96b57` | 2026-10-26 16:07 | TeskiBoi | Added some stuff crap |
| `7b95273` | 2026-10-26 15:48 | Devin | Merge origin/main (driver/chairperson previews) into desktop layout |
| `62a6f15` | 2026-10-26 15:43 | TeskiBoi | Added desktop mode |
| `0664c57` | 2026-10-26 15:40 | Raphael Dale Ogbac | feat: add driver and chairperson preview workspaces |
| `f756072` | 2026-10-26 15:23 | TeskiBoi | Merge branch 'main' of https://github.com/b0urbonn/egabay |
| `6778c3c` | 2026-10-26 15:19 | TeskiBoi | added new updates in the checklist and the changelogs |
| `643b638` | 2026-10-26 15:16 | Raphael Dale Ogbac | Merge remote-tracking branch 'origin/main' |
| `bbc391b` | 2026-10-26 15:16 | Raphael Dale Ogbac | feat: add Supabase auth and role workspaces |
| `9d8e9c9` | 2026-10-26 14:59 | TeskiBoi | alright.. i give up on the color fuck this |
| `236e61c` | 2026-10-26 14:52 | TeskiBoi | changed color of the route discovery |
| `1781ac9` | 2026-10-26 14:46 | TeskiBoi | added routing using ant algo, and added estimated time of arrival |
| `5cb71e9` | 2026-10-26 14:28 | TeskiBoi | fixed the map zoom |
| `905e0ed` | 2026-10-26 13:05 | TeskiBoi | Merge branch 'main' of https://github.com/b0urbonn/egabay |
| `3fcf50f` | 2026-10-26 13:03 | TeskiBoi | fixed the error about the material icon. updated the build plan and checklist to reflect the new update |
| `63d6f7a` | 2026-10-26 12:02 | Raphael Dale Ogbac | Remove map title panel |
| `d878126` | 2026-10-26 11:58 | TeskiBoi | updated the checklist and the changelogs |
| `8e8af40` | 2026-10-26 11:55 | TeskiBoi | Fix absoluteFillObject not in RN type defs |
| `f3abd0d` | 2026-10-26 11:54 | TeskiBoi | Merge remote-tracking branch 'origin/main' |
| `9f1643a` | 2026-10-26 11:44 | TeskiBoi | fixed whatever crap just happend |
| `ffcc59e` | 2026-10-26 11:19 | Raphael Dale Ogbac | Use inland transport imagery in Explore banner |
| `b0fa8af` | 2026-10-26 11:10 | Raphael Dale Ogbac | Add land transport terminals screen |
| `d2ac96c` | 2026-10-26 10:50 | Raphael Dale Ogbac | Improve Quick Access dark mode icons |
| `6495672` | 2026-10-26 11:30 | TeskiBoi | fixed whatever i fixed last WHICH I FUDGING FORGOT |
| `9d05346` | 2026-10-26 11:16 | TeskiBoi | blended the sea with the border and then removed the unnecessary files |
| `d5c2b65` | 2026-10-26 11:14 | TeskiBoi | readded the open street map for the data, and then added the open map tile for rendering. maplibre gl js is now for interactivity. also modularized the map |
| `f1dabcb` | 2026-10-26 10:55 | TeskiBoi | Merge branch 'main' of https://github.com/b0urbonn/egabay |
| `00193e7` | 2026-10-26 10:44 | Raphael Dale Ogbac | Update profile menu and map markers |
| `03c97f5` | 2026-10-26 10:43 | TeskiBoi | replaced the openstreet map and leaflet with maplibregl js |
| `f2b1a88` | 2026-10-26 10:28 | Raphael Dale Ogbac | Add Trips tab and compact trip cards |
| `292786f` | 2026-10-26 09:54 | Raphael Dale Ogbac | Build travel dashboard and map assistant UI |
| `48b5c1a` | 2026-10-24 16:06 | Raphael Dale Ogbac | Log the merge and docs commits in the changelog |
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

