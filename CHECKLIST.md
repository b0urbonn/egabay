# eGABAY project checklist

**Status snapshot:** 2026-10-26

**Latest app change:** `f3abd0d` (merge: MapLibre map + Terminals screen + land-transport hubs)

**Public GitHub branch:** `origin/main` — merged locally through `ffcc59e`; local `main` additionally has the MapLibre map rebuild and both merges

**Repository:** [b0urbonn/egabay](https://github.com/b0urbonn/egabay) (public)

Local `main` is ahead of `origin/main` (MapLibre rebuild + merge); push when ready. See the commit log in [CHANGELOG.md](CHANGELOG.md) for per-commit details. “Done” means code exists; it does not imply a deployed or field-tested service. Work in a Supabase dashboard or with local operators may not be visible here.

## Current state

- [x] **Done in local workspace** — Expo + React Native + TypeScript scaffold; `npm run web` is the web start command.
- [x] **Done in current local workspace** — Onboarding, welcome, Home travel dashboard, Map, Trips, Profile tabs plus Settings (from Profile) and Terminals (from Home) sub-screens. (Profile redesigned and the top app header removed in `0097625`; Settings simplified in `5e10e85`; Home redesigned in `874abe8`; Terminals directory added in `b0fa8af`.)
- [x] **Done in local workspace** — Local demo sign-in/guest flow and persisted session/preferences.
- [x] **Done in local workspace** — Sample routes and service notices, explicitly marked as demo content.
- [x] **Done in local workspace** — Map view: MapLibre GL (vendored) for engine/interactions, OpenMapTiles vector tiles (VersaTiles) as the default "General" render with OSM raster fallbacks, and OpenStreetMap data (Nominatim boundary + search, OSRM routing). Sources modularized under `assets/map/` (`js/` + `css/`, ≤500 lines/file); `npm run build:map` emits the single-file bundle `assets/generated/marinduque-map.html` the app embeds (generated output, gitignored — auto-rebuilt on start).
- [x] **Done in local workspace** — Map features merged from public branch: transport filter chips (Terminal group live; Jeepney/Tricycle show "not verified" toast), OSRM road route-details panel with turn-by-turn from Boac, and a preview AI-assistant chat (canned replies, no backend). POI markers are now per-town land-transport service areas (approximate, unverified) rather than ferry ports.
- [x] **Done in local workspace** — Terminals directory screen (from Home explore banner): per-municipality land-transport terminals with locality filter and search, backed by sample/approximate data — not verified terminal records.
- [x] **Done in current local workspace** — Native and browser Supabase client scaffolds plus initial migration defining tables, row-level security, and Realtime publication entries.
- [~] **Partial** — Offline mode is a saved app mode; route and notice content remains demo data, with no Supabase-backed cache/sync flow.
- [~] **Partial** — Supabase clients/schema are scaffolded, but the code does not evidence a connected project, verified seed rows, or live queries.
- [~] **Partial** — Map provider is implemented, but local coverage, offline support, licensing, and cost are not documented as evaluated.
- [ ] **Not started** — Supabase-backed authentication and real operator/admin role workflows.
- [ ] **Not started** — Verified pilot route data and named data/update owners.
- [ ] **Not started** — Live vehicle sharing and operator notice publishing.
- [ ] **Not started** — Field pilot, measures, and AI route ranking.

### Latest public app changes (merged and pushed)

- [x] **Done** — Terminals directory screen, inland-transport Explore banner, and land-transport hub POIs added publicly in `b0fa8af`/`ffcc59e`; Quick Access dark-mode icons fixed in `d2ac96c`.
- [x] **Done** — Public branch merged into local `main` in `f3abd0d`; the public map-page edits (land-transport hub POIs, assistant reply) were ported into the MapLibre sources since the generated page is build output.
- [x] **Done** — Trips tab and compact trip cards added publicly in `f2b1a88`; navigation is now Home, Map, Trips, Profile.
- [x] **Done** — Profile menu, map markers, and the map assistant/filters/route-details UI added publicly in `00193e7`.
- [x] **Done** — Public branch merged into local `main` in `f1dabcb`; the public Leaflet map additions were ported onto the MapLibre page.
- [x] **Done** — Home travel dashboard and browser-specific Supabase client (`src/lib/supabase.web.ts`) were added in `3121b49`.
- [x] **Done** — Plan and Updates tabs/screens were removed in `b874c4e`; Trips now covers trip browsing.
- [x] **Confirmed** — `HomeScreen` imports `demoRoutes` and `demoAlerts`; dashboard counts and previews are sample data, not Supabase results.

### Public documentation path status

- [x] **Local workspace** — `CHECKLIST.md`, `CHANGELOG.md`, and README links are at the repository root.
- [x] **Public `origin/main`** — `CHECKLIST.md` and `CHANGELOG.md` are at the repository root (the nested `CHECKLIST.md/CHECKLIST.md` is gone), and the public README links both.
- [x] Push the local merge and root documentation commits so the public repo matches this workspace. (Pushed in `392bd4b`; `origin/main` is now at `0097625`.)

## Build plan progress

### 0. Validate the transport network — Not started

- [ ] Choose pilot localities, transport modes, and routes.
- [ ] Confirm stops, route variants, schedules, fares, transfers, and common disruptions with local sources.
- [ ] Name the people responsible for verifying route data and publishing corrections/notices.
- [ ] Agree on driver location consent, access, and retention before adding tracking.

### 1. Build the data foundation — Partial

- [x] Initial Supabase schema and row-level security policy definitions are in `supabase/migrations/`.
- [x] Supabase client initialization is scaffolded in `src/lib/supabase.ts`.
- [ ] Create/configure a Supabase project and apply the migration there.
- [ ] Add only verified route and stop records; demo arrays are not verified seed data.
- [ ] Generate database types and add typed data-access functions.
- [ ] Verify policies for public riders, commuters, drivers, operators, and admins.

### 2. Deliver the commuter MVP — Partial

- [x] Home dashboard presents sample route and service notice previews.
- [ ] No separate Plan or Updates screen exists in current code; add/restore them if needed for the MVP.
- [ ] Replace sample routes and notices with Supabase reads.
- [ ] Add destination search and locality/mode filtering backed by verified route records.
- [ ] Add confirmed fare ranges, transfers, and source/freshness details.
- [ ] Add useful cached reads and clear loading, empty, and stale-data states.
- [ ] Keep suggested routes explainable and available without an AI service.

### 3. Add service updates and live operations — Not started

- [ ] Build an auditable operator workflow for publishing time-bounded notices.
- [ ] Add driver trip start/stop controls and explicit location-sharing consent.
- [ ] Send location only during an active trip and show its last-updated time.
- [ ] Subscribe to Supabase Realtime for authorized live positions and current alerts.
- [ ] Set and document location access, retention, battery, and connectivity behavior.

### 4. Pilot and improve — Not started

- [ ] Run a pilot on confirmed routes with commuters and operators.
- [ ] Track successful trip searches, correction turnaround, notice freshness, driver opt-in, battery impact, and rider comprehension.
- [ ] Review feedback and decide whether/how to expand coverage.

### 5. Add AI assistance after baseline quality — Not started

- [ ] Establish a reliable rules-based planner over verified route data first.
- [ ] Evaluate optional ranking against that baseline; label estimates and explain suggestions.
- [ ] If using an LLM, keep it server-side and evaluate outputs against verified routes.

## Next work in dependency order

1. Decide whether to keep the current Home/Map/Profile navigation or restore separate planning and updates screens.
2. Confirm pilot route data and its trusted owners (Milestone 0).
3. Configure Supabase, apply/review the migration, and add verified seed records (Milestone 1).
4. Replace demo content with typed Supabase reads and add useful cached reads (Milestone 2).
5. ~~Push the local merge and root docs so public `main` matches the workspace.~~ Done in `392bd4b`.
6. Add real sign-in and staff workflows, then consider driver tracking and a field pilot.

