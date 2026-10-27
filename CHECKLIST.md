# eGABAY project checklist

**Status snapshot:** 2026-10-27

**Latest committed app state:** merge `ed050ba` of `origin/main` `8bc9a93` (Super Admin sample preview removed, chairperson approval by email via `approve_chairperson`, admin wireframes/layouts) onto local `d60407c` — non-admin desktop layout removed (commuter shell is single-column + bottom tabs on all widths; the Super Admin workspace keeps the full-width treatment), map attribution starts collapsed, and `npm audit fix` applied (13 of 18 advisories resolved; the remaining 5 highs are confined to the dev-only `@expo/cli` toolchain with no patched upstream releases). Earlier: merge of `origin/main` `53d160a` (driver preview appearance selector, Super Admin standby console) onto local work — desktop layout (`62a6f15`), map ↔ `public.terminals` data bridge, and `supabase/seed.sql` (`2b96b57`). Supabase auth integrated earlier via `f756072`. The local workspace adds audited Super Admin group and terminal mutations.

**Current local phase:** implementing Super Admin registry mutations — group create/edit/deactivate, chairperson assignment, and terminal create/edit are wired to Supabase. Live project setup, verified seed data, vehicle overrides, and chairperson/driver operational workflows remain pending. See [Supabase setup](docs/SUPABASE_AUTH_SETUP.md).

**Repository:** [b0urbonn/egabay](https://github.com/b0urbonn/egabay) (public). “Done” means code exists; it does not imply a deployed or field-tested service.

## Current state

- [x] **Done in local workspace** — Expo + React Native + TypeScript scaffold; `npm run web` is the web start command.
- [x] **Done in current local workspace** — Onboarding, welcome, Home travel dashboard, Map, Trips, Profile tabs plus Settings (from Profile) and Terminals (from Home) sub-screens. (Profile redesigned and the top app header removed in `0097625`; Settings simplified in `5e10e85`; Home redesigned in `874abe8`; Terminals directory added in `b0fa8af`.)
- [x] **Source complete** — Supabase Google/email browser sign-in, session restoration, recovery, protected profile reads, guest preferences, and initial role workspaces. Live project verification is pending.
- [x] **Done in local workspace** — Signed-in app layout: the commuter shell renders the same single-column layout with the bottom tab bar on every screen width — `d60407c` removed the `62a6f15` wide-web treatment (left navigation rail with brand-mark collapse animation, centered 1240 px column, per-screen wide grids) and deleted `useWideLayout`. On ≥1024 px web the intro/phone-frame landing chrome now wraps every stage except the Super Admin workspace, which renders full-width.
- [x] **Done in local workspace** — Sample routes and service notices, explicitly marked as demo content.
- [x] **Done in local workspace** — Map view: MapLibre GL (vendored) for engine/interactions, OpenMapTiles vector tiles (VersaTiles) as the default "General" render with an OSM Standard raster fallback, and OpenStreetMap data (Nominatim boundary + search, OSRM routing). Sources modularized under `assets/map/` (`js/` + `css/`, ≤500 lines/file); `npm run build:map` emits the single-file bundle `assets/generated/marinduque-map.html` the app embeds (generated output, gitignored — auto-rebuilt on start).
- [x] **Done in local workspace** — Map features merged from public branch: transport filter chips (Terminal group live; Jeepney/Tricycle show "not verified" toast), OSRM road routing with a compact details card (distance, drive time, ETA), and a preview AI-assistant chat (canned replies, no backend). The routing origin is no longer fixed to Boac: it follows locate-me GPS or a "Set as start" marker action, and every POI popup has a "Directions" action. POI markers are per-town land-transport service areas (approximate, unverified).
- [x] **Done in local workspace** — Terminals directory screen (from Home explore banner): per-municipality land-transport terminals with locality filter and search, backed by sample/approximate data — not verified terminal records.
- [x] **Done in current local workspace** — Native and browser Supabase clients plus catalog and group-access migrations defining tables, row-level security, role RPCs, and audit records; 14 isolated database integration checks pass.
- [~] **Partial** — Offline mode is a saved app mode; route and notice content remains demo data, with no Supabase-backed cache/sync flow.
- [x] **Done in local workspace** — Map consumes live terminal data: `src/lib/terminals.ts` reads `public.terminals` (anon `terminals_public` policy) + realtime; both `MarinduqueMap` wrappers push rows into the map on `egabay:ready`; `assets/map/js/terminals.js` swaps sample hubs for lime-ringed `terminal-dot` markers with Directions/Set-as-start popups. `supabase/seed.sql` seeds 6 groups + 7 terminals (4 OSM-derived, 3 flagged approximate). Needs `EXPO_PUBLIC_SUPABASE_*` in `.env` to go live.
- [~] **Partial** — Supabase clients/schema are scaffolded, but the code does not evidence a connected project, verified seed rows, or live queries.
- [~] **Partial** — Map provider is implemented, but local coverage, offline support, licensing, and cost are not documented as evaluated.
- [x] **Done in local workspace** — Build plan defines the four-role access model: Super Admin → Groups (TODA/Jeepney) → Chairperson → Terminals → Vehicles → Drivers, plus commuters as public users. Includes the permissions matrix, group-scoped Supabase tables/relations, per-role screens, and the backend/app changes needed before implementing.
- [~] **Partial** — Supabase auth source and initial role workspaces are implemented. Live migration/bootstrap and full driver/chairperson/super-admin operational workflows remain pending.
- [~] **UI preview only** — Chairperson console is reachable from the Login screen with five mobile bottom tabs, contextual forms, a dedicated assignment flow, application decisions/history, coordinate validation, and announcements. Eight mobile wireframes are documented in `docs/design/`. Its records and actions are local demo state; it is not role-gated or connected to Supabase.
- [~] **UI preview only** — Driver workspace is reachable from the Login screen with three bottom tabs (Home, Updates, Profile) in an Apple-HIG-style layout: segmented availability and System/Light/Dark appearance controls, grouped-list assignment rows, trip start/stop consent sheet, read-only group announcements, a validated profile editor, and a group application flow with a pending-review state. Six mobile wireframes and interaction notes are documented in `docs/design/`. All records are sample/local state; no GPS access or Supabase calls.
- [ ] **Not started** — Verified pilot route, group, and terminal data and named data/update owners.
- [ ] **Not started** — Live vehicle sharing and group announcement publishing.
- [ ] **Not started** — Field pilot, measures, and AI route ranking.

### Latest public app changes (merged and pushed)

- [x] **Done** — Terminals directory screen, inland-transport Explore banner, and land-transport hub POIs added publicly in `b0fa8af`/`ffcc59e`; Quick Access dark-mode icons fixed in `d2ac96c`.
- [x] **Done** — Public branch merged into local `main` in `f3abd0d`; the public map-page edits (land-transport hub POIs, assistant reply) were ported into the MapLibre sources since the generated page is build output.
- [x] **Done** — Trips tab and compact trip cards added publicly in `f2b1a88`; navigation is now Home, Map, Trips, Profile.
- [x] **Done** — Supabase browser authentication, password recovery, group-scoped access foundation, and initial role workspaces added in `bbc391b`; pulled into local `main` at `643b638`. Live Supabase setup remains pending.
- [x] **Done** — Profile menu, map markers, and the map assistant/filters/route-details UI added publicly in `00193e7`.
- [x] **Done** — Public branch merged into local `main` in `f1dabcb`; the public Leaflet map additions were ported onto the MapLibre page.
- [x] **Done** — Home travel dashboard and browser-specific Supabase client (`src/lib/supabase.web.ts`) were added in `3121b49`.
- [x] **Done** — Plan and Updates tabs/screens were removed in `b874c4e`; Trips now covers trip browsing.
- [x] **Confirmed** — `HomeScreen` imports `demoRoutes` and `demoAlerts`; dashboard counts and previews are sample data, not Supabase results.

### Public documentation path status

- [x] **Local workspace** — `CHECKLIST.md`, `CHANGELOG.md`, and README links are at the repository root.
- [x] **Public `origin/main`** — `CHECKLIST.md` and `CHANGELOG.md` are at the repository root (the nested `CHECKLIST.md/CHECKLIST.md` is gone), and the public README links both.
- [x] Push the local merge and root documentation commits so the public repo matches this workspace. (Pushed in `392bd4b`; later updates are now included through `643b638`.)

## Build plan progress

### 0. Validate the transport network and the operator registry — Not started

- [ ] Choose pilot localities, transport modes, and routes.
- [ ] Identify the pilot TODA and jeepney groups, their chairpersons, and their terminals.
- [ ] Confirm stops, route variants, schedules, fares, transfers, and common disruptions with local sources.
- [ ] Name the people responsible for verifying route data, publishing corrections/notices, and holding the super admin account.
- [ ] Agree on driver location consent, access, and retention before adding tracking.

### 1. Build the data foundation and access model — Partial

- [x] Initial Supabase schema and row-level security policy definitions are in `supabase/migrations/`.
- [x] Supabase client initialization is scaffolded in `src/lib/supabase.ts`.
- [x] RBAC data model is specified in `BUILD_PLAN.md` (groups, terminals, drivers, feedback, audit_log; role helpers; public-safe vehicle view).
- [x] Prepare and locally test the RBAC changes in `20261026000000_auth_and_group_access.sql`: `profiles.role` → `commuter`/`driver`/`chairperson`/`super_admin`, new `groups`/`terminals`/`drivers`/`feedback`/`audit_log` tables, `vehicles.terminal_id`, `service_alerts.group_id`, group-scoped RLS policies, audit triggers.
- [ ] Create/configure a Supabase project and apply the migrations there.
- [ ] Add only verified groups, terminals, routes, and stops; demo arrays are not verified seed data.
- [ ] Provision super admin and chairperson accounts through a controlled workflow.
- [ ] Generate database types and add typed data-access functions.
- [ ] Verify policies with anon, commuter, driver, chairperson, and super admin accounts.

### 2. Deliver the commuter MVP — Partial

- [x] Home dashboard presents sample route and service notice previews.
- [x] Terminals directory screen exists, backed by sample data.
- [x] Map page routes interactively: any POI marker or search result can be the destination, and the origin is the GPS position (locate-me), a "Set as start" marker, or Boac by default — drawn via OSRM driving with distance, duration, and ETA.
- [x] Ant-colony optimization prototype for stop ordering exists as `scripts/route-aco-demo.mjs` (haversine matrix over the sample towns, seeded, verified against exhaustive search). Not wired to the map; needs a road-distance matrix (OSRM `/table`) and a transit graph before it means anything to commuters.
- [ ] Wire the Terminals directory and terminal detail to the `terminals` table, with a public-safe vehicle board.
- [ ] Replace sample routes and notices with Supabase reads.
- [ ] Add destination search and locality/mode filtering backed by verified route records.
- [ ] Add confirmed fare ranges, transfers, and source/freshness details.
- [ ] Add the commuter feedback form (rating/complaint about a driver or vehicle).
- [ ] Add useful cached reads and clear loading, empty, and stale-data states.
- [ ] Keep suggested routes explainable and available without an AI service.

### 3. Deliver the role consoles, service updates, and live operations — Partial

- [x] Replace mock auth with Supabase Auth; resolve profile and role at sign-in (live project setup remains pending).
- [x] Add role-gated browser workspaces for the four roles.
- [x] Add the Super Admin standby console: overview, group/terminal/vehicle directories, user roles, reports, audit log, search, filters, and responsive navigation.
- [x] Engineer Super Admin desktop/compact layouts, eleven editable wireframes, accessible record panels, and role-change confirmation. (The earlier sample-data preview was removed once the console went live for super admin sign-ins.)
- [x] Load Super Admin counts and records from Supabase; role changes use the checked RPC, and chairperson access is granted by approving the account's sign-in email via `approve_chairperson`.
- [x] **Done in current local workspace** — Super Admin can create, edit, and deactivate TODA/jeepney groups, assign or replace an eligible chairperson, and leave a group unassigned. Group writes use the existing audit trigger; chairperson selection is limited to accounts with the Chairperson role and the database enforces one group per chairperson.
- [x] **Done in current local workspace** — Super Admin can add and edit terminals in Supabase with a responsible group, group-derived municipality, barangay, address, contact phone, automatically geocoded map coordinates, and active status. Address and locality changes trigger one OpenStreetMap lookup; unrelated edits reuse stored coordinates. Terminal writes use the audited table triggers; the directory search and inspector include location and contact details.
- [~] **UI preview implemented** — Driver flow: group application with pending state, profile editor, segmented availability control on Home, read-only announcements, and trip start/stop consent sheet. Six Apple-HIG mobile wireframes cover the primary screens. Sample data only; no GPS, role gating, or Supabase writes.
- [~] **UI preview implemented** — Chairperson group dashboard, searchable terminal/vehicle lists, validated coordinate and roster forms, assignments, driver approval/rejection with confirmation/history, and announcement composer. Mobile bottom navigation, keyboard handling, desktop adaptation, and eight wireframes are implemented. All records/actions are sample/local state.
- [ ] Connect driver application, profile, availability, and announcements to group-scoped Supabase reads/writes.
- [ ] Connect chairperson screens to group-scoped Supabase reads and writes, including audit-log-backed mutations and the terminal map-pin picker.
- [ ] Connect Super Admin vehicle override forms and driver approval actions.
- [ ] Send location only during an active trip and show its last-updated time.
- [ ] Subscribe to Supabase Realtime for authorized live positions and current alerts.
- [ ] Set and document location access, retention, battery, and connectivity behavior.

### 4. Pilot and improve — Not started

- [ ] Run a pilot on confirmed routes with at least one TODA and one jeepney group; onboard chairpersons and drivers.
- [ ] Track successful trip searches, correction turnaround, notice freshness, driver opt-in, approval turnaround, battery impact, and rider comprehension.
- [ ] Review feedback and decide whether/how to expand coverage.

### 5. Add AI assistance after baseline quality — Not started

- [ ] Establish a reliable rules-based planner over verified route data first.
- [ ] Evaluate optional ranking against that baseline; label estimates and explain suggestions.
- [ ] If using an LLM, keep it server-side and evaluate outputs against verified routes.

## Next work in dependency order

1. Confirm pilot route data, pilot TODA/jeepney groups and their chairpersons, and trusted data owners (Milestone 0).
2. Apply the migrations in Supabase, provision the first super admin, verify policies, and add only confirmed seed records (Milestone 1).
3. Replace demo content with typed Supabase reads; wire the Terminals screens to real records and add the feedback form (Milestone 2).
4. Finish Super Admin vehicle overrides and connect the driver/chairperson previews to authorized group data (Milestone 3).
5. Add authorized live positions and service alerts after registry data and location consent are verified.

