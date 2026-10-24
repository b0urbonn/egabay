# eGABAY build plan

## Product direction

Build a commuter-first guide for finding public transport options around Marinduque. The mobile app should make route and service information easy to use even when a rider has limited connectivity. The first release should give riders understandable route choices and clearly show when information was last confirmed.

## MVP scope

### Commuter app

- Browse routes and stops by locality
- Plan a trip between two places and compare estimated time, fare range, and transfers
- View service notices and their source/update time
- See active vehicle positions when operators provide consented, reliable GPS updates
- Save favorite places and recent trips after sign-in
- Show a useful cached route and notice view during weak connectivity

### Operator tools

- Driver sign-in and explicit start/stop trip controls
- Send limited vehicle location updates only while a trip is active
- Operator view to maintain routes, stops, vehicle availability, fares, and notices
- Admin review and audit trail for route and alert changes

## Suggested milestones

### 0. Validate the transport network

Work with local operators and commuters to confirm pilot localities, route variants, stops, transport modes, operating days, fare ranges, transfer points, and common disruptions. Decide who owns each record and how corrections are requested. Set privacy rules and retention for driver location data before enabling tracking.

**Deliverable:** approved pilot route catalog, source/update rules, and measurable commuter problems.

### 1. Build the data foundation

Apply the Supabase migration, seed only verified route and stop records, and assign operator roles through a controlled admin workflow. Add generated database types and data-access functions. Review every row-level security policy with anon, commuter, driver, operator, and admin accounts.

**Deliverable:** secure read-only public route data and authenticated staff maintenance.

### 2. Deliver the commuter MVP

Replace sample arrays with Supabase queries. Add destination search, locality and mode filters, route comparisons, fare ranges, transfer details, freshness labels, empty states, and graceful offline/cached reads. Keep planning deterministic and explain why each route is suggested.

**Deliverable:** commuters can plan and understand a pilot trip from verified data.

### 3. Add service updates and live operations

Give operators a small, auditable workflow to publish notices. Add a driver mode with trip consent, foreground location updates, last-seen state, and a visible stop-sharing action. Subscribe to Supabase Realtime for positions and current alerts; tune update frequency to battery, connectivity, and privacy constraints.

**Deliverable:** authorized operators can publish current notices and participating vehicles appear with an accurate last-updated time.

### 4. Pilot and improve

Pilot on a small number of confirmed routes. Measure successful trip searches, route-data corrections, notice freshness, driver opt-in, battery impact, and rider comprehension. Interview commuters and operators, then prioritize fixes before adding more island coverage.

**Deliverable:** a reviewed pilot, an operator maintenance process, and a rollout decision.

### 5. Add AI assistance after baseline quality

Start with a transparent route-ranking service that considers travel time, transfers, service status, and a rider's chosen preferences. Keep route options available if the AI service is offline, label estimates, log the reasons behind suggestions, and never invent a route or claim live availability without source data. If an LLM is considered, call it from a Supabase Edge Function, send only the minimum necessary trip context, and evaluate outputs against verified routes.

**Deliverable:** optional suggestions that improve the verified, rules-based planner without blocking it.

## Initial Supabase model

| Table | Purpose |
| --- | --- |
| profiles | Authenticated commuter and staff role metadata |
| routes | Route endpoints, mode, fare range, service days, and active state |
| route_stops | Ordered stops with locality and optional coordinates |
| vehicles | Public vehicle label, assigned route, and availability |
| vehicle_driver_assignments | Private mapping between an authenticated driver and a vehicle |
| vehicle_positions | Latest position for an active vehicle, with capture time |
| service_alerts | Time-bounded notices attached to a locality or route |

The first migration enables row-level security, allows public reads for relevant transport data, limits route and alert maintenance to operator/admin roles, limits driver position writes to assigned vehicles, and marks positions and alerts for Realtime.

## Architecture notes

- **Mobile:** Expo + React Native + TypeScript; use Expo-compatible packages and keep screens usable on smaller phones.
- **Backend:** Supabase Auth, Postgres, row-level security, Realtime for positions/alerts, and Edge Functions for trusted server-side work.
- **Maps:** choose a provider after checking Marinduque road/stop coverage, offline needs, licensing, and operating cost.
- **AI:** begin with explainable route ranking. Protect the planner with verified data, deterministic fallbacks, confidence/freshness labels, and a review path for wrong suggestions.
- **Privacy:** avoid continuous background tracking in the first prototype. Collect driver location only during an explicit active trip, with role access, limited retention, and a visible stop-sharing control.

## Success measures

- Riders can find an accurate route for pilot origin/destination pairs.
- Route and fare corrections are acknowledged and resolved by a named data owner.
- Service notices show a source and freshness timestamp.
- Drivers can start and stop sharing without ambiguity; tracking has acceptable battery and data costs.
- Riders understand which details are confirmed, estimated, or unavailable.

## Open decisions

- Which localities and transport modes are in the first pilot?
- Who will verify routes, schedules, fares, and notices?
- Which map provider has sufficient local coverage and an acceptable cost?
- Will driver tracking use a separate driver app, or a restricted mode in this app?
- What location retention period and user consent flow will operators approve?
