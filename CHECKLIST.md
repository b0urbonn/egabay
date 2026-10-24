# eGABAY project checklist

**Status snapshot:** 2026-10-24, `main` at `4ed2920`  
**Repository:** [b0urbonn/egabay](https://github.com/b0urbonn/egabay) (public)

This checklist compares the build plan with what is present in the repository. “Done” means there is code or documentation for it; it does not imply a deployed or field-tested service. Work in a Supabase dashboard or with local operators may not be visible here.

## Current state

- [x] **Done** — Expo + React Native + TypeScript project scaffold, with an Expo web script (`npm run web`).
- [x] **Done** — Onboarding, welcome, Home, Plan, Updates, Profile, and Settings screens.
- [x] **Done** — Local demo sign-in/guest flow and saved app preferences/session state.
- [x] **Done** — Sample route and service notice data, identified in the app as demo content.
- [x] **Done** — Map view using Leaflet with OpenStreetMap tiles and Nominatim search.
- [x] **Done** — Supabase client scaffold and an initial SQL migration with tables, row-level security policies, and Realtime publication setup.
- [~] **Partial** — Offline mode exists in the app, but route/notice content is still bundled demo data; a Supabase-backed cache and sync flow are not present.
- [~] **Partial** — Supabase schema and client code exist, but this repository does not show a linked/deployed project, verified seed data, or app data queries.
- [~] **Partial** — The map is implemented, but provider suitability for local coverage, offline use, licensing, and cost has not been documented as decided.
- [ ] **Not started** — Real Supabase authentication, operator/admin account workflows, and role verification.
- [ ] **Not started** — Pilot route facts and named owners for fares, schedules, stops, and service notices.
- [ ] **Not started** — Live vehicle location sharing and operator notice publishing.
- [ ] **Not started** — Pilot evaluation and AI-assisted route ranking.

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

- [x] Route planning screen and sample result cards exist.
- [x] Service notice screen and filters exist.
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

1. Confirm the pilot data and its trusted owners (Milestone 0).
2. Configure Supabase, apply and review the migration, then add verified seed records (Milestone 1).
3. Replace demo route and notice arrays with typed Supabase reads and useful cached reads (Milestone 2).
4. Add real sign-in and staff workflows, then consider driver tracking and a field pilot.

