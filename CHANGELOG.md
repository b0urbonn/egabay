# Changelog

This file records repository changes visible in local Git history and `origin/main`. The [checklist](CHECKLIST.md) tracks implementation and the branch differences.

## 2026-10-26

- **Interactive road routing on the map page (uncommitted working-tree edits)** — The routing origin is no longer hardcoded to Boac: it defaults to Boac, switches to the user's GPS position through locate-me, or to any marker via a new "Set as start" popup action. Every POI popup also gained a "Directions" button that routes from the current origin to the tapped place, and Nominatim search results still route from the current origin.
- **Route-details panel slimmed to an ETA card (uncommitted)** — Replaced the full panel (scrolling turn-by-turn list + disclaimer note, ~370×350 px) with a compact auto-sized card showing road distance, drive time, and estimated arrival time (clock time = now + OSRM duration). The OSRM request no longer fetches `steps`.
- **Map palette unified to the project scheme (uncommitted)** — Route line, POI dots, and the search-result dot moved from orange (`#E9813F`) to the system green (`#176B4B`); the user-location marker became a lime (`#C6F06A`) dot with a dark-green border and pulsing ring so it's distinguishable from POI markers, and the route's start dot matches it. Sea/mask colors kept their original per-basemap blues. Basemap picker trimmed to General (VersaTiles vector) and Standard (OSM raster); Transport, Dark, and Satellite were removed.
- **Ant-colony route-ordering prototype (uncommitted)** — `scripts/route-aco-demo.mjs` reads the sample town coordinates out of `assets/map/js/data.js`, builds a haversine distance matrix, and uses a seeded ACO to find the optimal visit order from a chosen start town (default Boac), verified against exhaustive search (6 towns → 120 orders). Finds the global optimum on the sample data. Demo only — not wired into the map.
- **Build plan: four-role access model (uncommitted working-tree edit)** — `BUILD_PLAN.md` now specifies role-based access control for the Marinduque transport system: Super Admin → Groups (TODA/Jeepney) → Chairperson → Terminals → Vehicles → Drivers, with commuters as public users outside the hierarchy. Added the permissions matrix, data rules (one group per terminal/vehicle/driver, one chairperson per group, RLS enforcement, super admin + chairperson audit logging), the group-scoped Supabase tables and relations (`groups`, `terminals`, `drivers`, `feedback`, `audit_log`, plus `vehicles.terminal_id` and `service_alerts.group_id`), screens per role, the backend/app changes required before implementing, and updated milestones 0–3 to match. No RBAC code or migration exists yet — this is the plan only.
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

- A migration file and Supabase client scaffold are in the repository; a deployed Supabase backend and live app data are not evidenced by repository code.
- Route names, fares, times, vehicle counts, and service notices are demo content until verified with local transport sources.
- The nested `CHECKLIST.md/CHECKLIST.md` path is fixed on public `origin/main`; the checklist and changelog are at the repository root.
- Public `origin/main` includes every commit in the log below. Check `git status` for anything newer.
- Add a dated entry when a user-visible feature or backend milestone lands. Keep unfinished work in `CHECKLIST.md`.

## Commit log

Every commit on `main`, newest first (from `git log`). Times are +0800. The commit that updates this table can't list itself; it is added by the next docs update.

| Commit | Date | Author | Message |
| --- | --- | --- | --- |
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

