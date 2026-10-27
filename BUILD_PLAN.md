# eGABAY build plan

## Product direction

Build a commuter-first guide for finding public transport options around Marinduque, backed by a group-managed registry of the island's tricycle (TODA) and jeepney operators. The mobile app should make route, terminal, and service information easy to use even when a rider has limited connectivity. The first release should give riders understandable route choices and clearly show when information was last confirmed, while giving each operator group the tools to keep its own terminals, vehicles, and drivers accurate.

## MVP scope

### Commuter app (public, sign-in optional)

- Browse terminals by municipality or barangay, with locations on a map
- View public-safe vehicle info per terminal (body number, vehicle type, driver name/photo)
- Browse routes and fares; plan a trip and compare estimated time, fare range, and transfers
- View service notices and their source/update time
- Submit feedback, ratings, or complaints about a driver or vehicle
- See active vehicle positions when operators provide consented, reliable GPS updates
- Save favorite places and recent trips after optional sign-in
- Show a useful cached route and notice view during weak connectivity

### Driver mode

- Self-register and apply to join a TODA or jeepney group (requires chairperson approval)
- Manage own profile: name, contact number, license number, photo
- View the assigned vehicle, terminal, and group
- Set availability status (available / on trip / offline)
- Read-only access to own group's announcements
- Explicit start/stop trip controls; send vehicle location only while a trip is active

### Chairperson console (one per TODA or jeepney group)

- Add, edit, and remove the group's terminals (name, municipality, barangay, address geocoded to map coordinates on create or location change)
- Maintain each terminal's vehicle roster (plate number, body/franchise number, vehicle type, assigned driver, status)
- Approve or reject driver applications to the group
- Assign drivers to vehicles and vehicles to terminals
- Publish group announcements; view the drivers and vehicles in each terminal
- Scoped to own group only — cannot see or modify other groups' data, cannot create groups

### Super admin console

- Create, edit, and deactivate TODA and jeepney groups across Marinduque
- Assign or replace each group's chairperson (one chairperson per group)
- Manage all user accounts, roles, and approvals
- View system-wide reports: groups, terminals, registered vehicles, drivers
- Override edit or remove on any terminal or vehicle record

Current delivery target: super admin in a desktop web panel; chairperson, driver, and commuter in a responsive web interface tested in Android browsers. Google sign-in uses the browser OAuth flow. Native builds and device-specific Google sign-in are a later delivery step.

## Roles and access control

Hierarchy: **Super Admin → Groups (TODA / Jeepney) → Chairperson → Terminals → Vehicles → Drivers**. Commuters sit outside the hierarchy as public users.

### Permissions matrix

| Capability | Super Admin | Chairperson | Driver | Commuter |
| --- | --- | --- | --- | --- |
| Create / edit / deactivate groups | ✓ | — | — | — |
| Assign or replace chairperson | ✓ | — | — | — |
| Manage user accounts and roles | ✓ | — | own profile | own optional account |
| View system-wide reports | ✓ | own group only | — | — |
| Create / edit / remove terminals | ✓ | own group | — | — |
| Maintain vehicle roster per terminal | ✓ | own group | — | — |
| Approve / reject driver applications | ✓ | own group | — | — |
| Assign drivers ↔ vehicles, vehicles ↔ terminals | ✓ | own group | — | — |
| Apply to join a group | — | — | ✓ | — |
| Set own availability status | — | — | ✓ | — |
| Edit own profile (name, contact, license, photo) | any user | own | own | — |
| Read group announcements | ✓ | own group | own group | — |
| Browse terminals, routes, and fares | ✓ | ✓ | ✓ | ✓ |
| View vehicle records | all fields | own group: all fields; other groups: public-safe | public-safe | public-safe only |
| See license numbers and driver contact details | ✓ | own group drivers | own record | — |
| Submit feedback / ratings / complaints | ✓ | ✓ | ✓ | ✓ |
| Writes recorded in audit log | ✓ logged | ✓ logged | — | — |

### Data rules

- Every terminal belongs to exactly one group; every vehicle belongs to one terminal; every driver belongs to one group.
- One chairperson per group; a chairperson manages only the group they chair.
- A vehicle's group is derived through its terminal; a driver can only be assigned to a vehicle whose terminal belongs to the driver's group.
- Permissions are enforced in Postgres row-level security (and RPC/trigger checks), not just by hiding UI elements.
- Super Admin and Chairperson writes are recorded in an audit log (who changed what, and when).

## Supabase model

| Table | Key fields | Relations / notes |
| --- | --- | --- |
| profiles | id → auth.users, display_name, role, photo_url | role ∈ `commuter`, `driver`, `chairperson`, `super_admin` |
| groups | id, name, kind (`toda` / `jeepney`), municipality, is_active, chairperson_id → profiles (unique, nullable) | one chairperson per group |
| terminals | id, group_id → groups, name, municipality, barangay, latitude, longitude | belongs to exactly one group |
| drivers | profile_id → profiles, group_id → groups, license_number, contact_number, membership_status (`pending`/`approved`/`rejected`), availability (`available`/`on_trip`/`offline`) | belongs to exactly one group; approval decided by its chairperson |
| vehicles | id, terminal_id → terminals, plate_number, body_number, vehicle_type, status, assigned_driver_id → drivers (nullable, unique) | belongs to one terminal; group derived via terminal |
| routes, route_stops | unchanged | public route and stop catalog |
| vehicle_positions | unchanged | latest consented position per active vehicle |
| service_alerts | + group_id → groups (nullable) | null = public notice; set = announcement for that group's drivers |
| feedback | id, author → profiles (nullable), vehicle_id / driver_id, kind (`rating`/`complaint`/`feedback`), rating 1–5, body | commuter submissions about a driver or vehicle |
| audit_log | id, actor → profiles, action, table_name, record_id, detail jsonb, created_at | append-only record of super admin and chairperson writes |

Enforcement notes:

- Row-level security on every table. Helper functions resolve the caller's role and scope: `is_super_admin()`, `chaired_group_id()`, `driver_group_id()`.
- Public (anon) vehicle reads go through a column-restricted view exposing only body number, vehicle type, and driver name/photo — plate numbers, license numbers, and contact details stay off public grants.
- Chairperson policies scope every read/write to rows in `chaired_group_id()` (terminals by `group_id`, vehicles by `terminal.group_id`, drivers by `group_id`); groups and user management stay super-admin-only.
- Driver policies limit writes to their own `drivers` row (profile fields and availability) and their assigned vehicle's position during an active trip.
- Same-group consistency for driver↔vehicle assignment is enforced by a trigger or RPC, since CHECK constraints cannot span tables.
- Audit rows are written by trigger or inside the mutation RPC, never inserted by the client.

## Screens by role

### Commuter

- Home dashboard — route and notice previews (exists, sample data)
- Map — terminal pins layer (exists)
- Terminals directory — browse/filter by municipality and barangay (exists, sample data → Supabase)
- Terminal detail — info, map pin, public-safe vehicle board, routes and fares (exists, extend)
- Feedback form — rate or report a driver or vehicle (new)
- Optional sign-in — saved places and recent trips (exists as mock)

### Driver

- Registration/application — pick a group, submit license and contact, pending state (new)
- Driver home — membership status, assigned vehicle, terminal, and group (new)
- Profile editor — name, contact number, license number, photo (new)
- Availability control — available / on trip / offline, with trip start-stop consent (new)
- Announcements — read-only feed of own group's notices (new)

### Chairperson

- Group dashboard — terminal, vehicle, driver, and pending-application counts (new)
- Terminals manager — list plus create/edit form with map pin picker (new)
- Terminal vehicle roster — add/edit vehicles, set assigned driver and status (new)
- Driver applications inbox — approve or reject (new)
- Assignments — driver → vehicle and vehicle → terminal (new)
- Announcement composer — publish notices to the group's drivers (new)

### Super Admin

- Admin dashboard — system-wide group/terminal/vehicle/driver reports (standby dashboard implemented with live Supabase counts)
- Groups manager — create, edit, deactivate TODA and jeepney groups (live Supabase mutations with audit logging implemented)
- Chairperson assignment — assign or replace one eligible chairperson per group (live mutation implemented)
- User management — accounts, roles, approvals (latest 50 accounts, checked role updates, and chairperson approval by sign-in email implemented; driver approvals remain)
- Global terminal/vehicle browser — search and filter records (terminal creation and editing use Supabase; address geocoding captures coordinates on create or location change; vehicle override edits remain)
- Audit log viewer — who changed what, and when (implemented)

All role surfaces live in the same Expo app behind role-gated navigation after Supabase sign-in; the web build covers the wider admin tables.

The [Super Admin web layout specification](docs/design/SUPER_ADMIN_WEB_UI.md) links eleven editable wireframes and desktop/compact layout rules. Super admin accounts open the live console after sign-in.

## RBAC implementation and deployment

Backend — `supabase/migrations/20261026000000_auth_and_group_access.sql` now implements the foundation below. It follows the original migration, passes isolated database policy checks, and is prepared for the confirmed empty project. Applying it to the live project and provisioning the first owner remain pending.

- `profiles.role`: replace `operator`/`admin` with `chairperson`/`super_admin`.
- New tables: `groups`, `terminals`, `drivers`, `feedback`, `audit_log`.
- `vehicles`: add `terminal_id`, `plate_number`, `body_number`, `vehicle_type`, `assigned_driver_id`; fold `public_label` into `body_number`.
- `service_alerts`: add nullable `group_id` for group-scoped announcements.
- Rewrite RLS: role/scope helper functions, per-table policies for all four roles, column-restricted public vehicle view, updated grants.
- Pending later: private Supabase Storage for uploaded driver photos. Google profile photos are currently loaded from provider metadata; upload/signed-URL handling is not implemented.
- Audit triggers (or mutation RPCs) on tables writable by super admin and chairperson.

App:

- Implemented locally: Supabase Google/email browser auth, session recovery, and protected profile/role resolution; old mock accounts are ignored.
- Implemented locally: role-gated workspaces in `App.tsx`, including a responsive Super Admin panel with overview, groups, terminals, vehicles, users/roles, reports, and audit log. It reads live Supabase records, uses the checked role-management RPC, and supports audited group and terminal create/edit flows; terminal addresses are geocoded on create or location change and coordinates are stored; vehicle override edits and the chairperson/driver consoles remain upcoming.
- Wire `TerminalsScreen` to the `terminals` table; add the vehicle board, feedback form, and the new role screens listed above.
- Keep demo arrays until verified group and terminal seed data exists.

## Suggested milestones

### 0. Validate the transport network and the operator registry

Work with local operators and commuters to confirm pilot localities, route variants, stops, transport modes, operating days, fare ranges, transfer points, and common disruptions. Identify the pilot TODA and jeepney groups, their chairpersons, and their terminals. Decide who owns each record, who holds the super admin account, and how corrections are requested. Set privacy rules and retention for driver location data before enabling tracking.

**Deliverable:** approved pilot route catalog, a list of pilot groups with named chairpersons, source/update rules, and measurable commuter problems.

### 1. Build the data foundation and access model

Apply the Supabase migrations (initial schema plus the RBAC migration), seed only verified groups, terminals, routes, and stops, and provision the super admin and chairperson accounts through a controlled workflow. Add generated database types and data-access functions. Review every row-level security policy with anon, commuter, driver, chairperson, and super admin accounts, including the public-safe vehicle view and the audit log.

**Deliverable:** secure public reads, group-scoped chairperson writes, super admin management, and audited privileged actions.

### 2. Deliver the commuter MVP

Replace sample arrays with Supabase queries. Power the Terminals directory and terminal detail from real terminal records with a public-safe vehicle board. Add destination search, locality and mode filters, route comparisons, fare ranges, transfer details, freshness labels, the feedback form, empty states, and graceful offline/cached reads. Keep planning deterministic and explain why each route is suggested.

**Deliverable:** commuters can browse verified terminals and vehicles, plan and understand a pilot trip, and submit feedback.

### 3. Deliver the role consoles, service updates, and live operations

Build the driver flow (application, profile, availability, announcements), the chairperson console (terminals, vehicle roster, approvals, assignments, announcements), and the super admin console (groups, chairperson assignment, user management, reports, override edits, audit log). Add driver trip consent with foreground location updates, last-seen state, and a visible stop-sharing action. Subscribe to Supabase Realtime for positions and current alerts; tune update frequency to battery, connectivity, and privacy constraints.

**Deliverable:** each role can do its job through enforced backend permissions; participating vehicles appear with an accurate last-updated time.

### 4. Pilot and improve

Pilot on a small number of confirmed routes with at least one TODA and one jeepney group. Onboard the chairpersons and their drivers, and measure successful trip searches, route-data corrections, notice freshness, driver opt-in, approval turnaround, battery impact, and rider comprehension. Interview commuters and operators, then prioritize fixes before adding more island coverage.

**Deliverable:** a reviewed pilot, working group self-management, and a rollout decision.

### 5. Add AI assistance after baseline quality

Start with a transparent route-ranking service that considers travel time, transfers, service status, and a rider's chosen preferences. Keep route options available if the AI service is offline, label estimates, log the reasons behind suggestions, and never invent a route or claim live availability without source data. If an LLM is considered, call it from a Supabase Edge Function, send only the minimum necessary trip context, and evaluate outputs against verified routes.

**Deliverable:** optional suggestions that improve the verified, rules-based planner without blocking it.

## Architecture notes

- **Mobile:** Expo + React Native + TypeScript; use Expo-compatible packages and keep screens usable on smaller phones. One app serves all roles — the web build (`npm run web`) covers the wider chairperson/admin tables.
- **Backend:** Supabase Auth, Postgres, row-level security, Realtime for positions/alerts, and Edge Functions for trusted server-side work. RLS is the enforcement boundary for the four roles; UI hiding is only convenience.
- **Auth and roles:** profiles carry a single role; chairperson scope comes from `groups.chairperson_id`, driver scope from `drivers.group_id`. Cross-table rules (same-group assignment, one chairperson per group) are enforced by triggers/RPCs.
- **Maps:** choose a provider after checking Marinduque road/stop coverage, offline needs, licensing, and operating cost. Terminal editing needs a pin/coordinate picker for chairpersons.
- **AI:** begin with explainable route ranking. Protect the planner with verified data, deterministic fallbacks, confidence/freshness labels, and a review path for wrong suggestions.
- **Privacy:** avoid continuous background tracking in the first prototype. Collect driver location only during an explicit active trip, with role access, limited retention, and a visible stop-sharing control. License numbers and driver contact details are never exposed to public/anonymous reads.

## Success measures

- Riders can find an accurate route and real terminal/vehicle info for pilot origin/destination pairs.
- A chairperson can register a terminal, its vehicles, and approve a driver without super admin help.
- Public/anonymous responses never include license numbers or contact details.
- Every super admin and chairperson change is visible in the audit log with actor and timestamp.
- Route and fare corrections are acknowledged and resolved by a named data owner.
- Service notices show a source and freshness timestamp.
- Drivers can start and stop sharing without ambiguity; tracking has acceptable battery and data costs.
- Riders understand which details are confirmed, estimated, or unavailable.

## Open decisions

- Which localities, TODA groups, jeepney groups, and transport modes are in the first pilot?
- Who holds the super admin account — the project team, an LGU office, or a provincial transport body?
- Who will verify routes, schedules, fares, terminals, and notices?
- Is anonymous feedback allowed, or does submitting require a (free) commuter account? How are complaints moderated and routed to the right chairperson?
- Do chairpersons publish their group's announcements, or is a separate group staff role needed?
- Which map provider has sufficient local coverage and an acceptable cost, including the terminal pin picker?
- Will driver tracking use a separate driver app, or a restricted mode in this app? (Default: restricted mode, same app.)
- What location retention period and user consent flow will operators approve?
