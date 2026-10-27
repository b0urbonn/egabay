# Super Admin web layouts

Open the [wireframe board](super-admin-web-wireframes.svg) for all eleven layouts.
Each [individual screen](super-admin/) is an editable SVG at its full reference size.
Regenerate the artwork with `npm run build:admin-wireframes`.

The live console opens automatically after sign-in for accounts with the
super admin role. Its records come from the configured Supabase registry.

## Layout rules

| Area | Desktop, 1024px and wider | Below 1024px |
| --- | --- | --- |
| Navigation | Persistent 248px sidebar | Horizontal section navigation in the top area |
| Main area | Centered, maximum 1440px; 34px side padding | 18px side padding; content fills the screen |
| Top bar | Breadcrumb, section search, refresh, account avatar | Short section label, search on list screens, refresh |
| Summary cards | Four columns | Two columns |
| Registry | Named columns, consistent status and detail columns | Stacked records with visible labels and View action |
| Reports | Wrapping columns, minimum 260px per card | One column |
| Forms and details | Right panel, up to 580px wide | Full-height panel inside a small outer margin |
| Actions | Sticky panel footer with Cancel and a named action | Footer wraps when needed; body scrolls above it |

The base body text is 14–16px. Supporting text is at least 12px. Main controls have
44px targets. Status uses words as well as color. Material icons support the labels;
important actions have visible text.

## Screens and handoff

| Wireframe | What it contains | Working app behavior |
| --- | --- | --- |
| 01 Overview | Four registry totals, municipality coverage, task shortcuts | Live registry reads after sign-in |
| 02 Groups | Search, status filter, chairperson, status, details | Search/filter and detail panel with group actions |
| 03 Create group | Name, transport type, municipality, chairperson, status | Live create/edit form with required-name and duplicate checks |
| 04 Chairperson assignment | Available account selection and effect of replacement | Live assignment; only chairperson-role accounts not assigned elsewhere are selectable |
| 05 Terminals | Group ownership, locality, active status, detail access | Search/filter, live create/edit, and full location/contact details |
| 06 Vehicles | Body number, plate, terminal, driver, service status | Search/filter and read-only details |
| 07 User roles | Account identity, role options, permission review | Explicit confirmation before the existing live role RPC |
| 08 Reports | Municipality and transport-type coverage; registry counts | Counts and descriptive charts; no unsupported growth arrows |
| 09 Audit log | Actor, action, record, date, recorded changes | Search and read-only event panel |
| 10 Compact layouts | Overview, list, and form at 390px | Responsive versions of the same interface |
| 11 Data states | Loading, no matches, unavailable records | Failure state with Retry; failed reads do not appear as zero totals |

The vehicle override editor, driver approval actions, and the chairperson/driver consoles
remain later work in the build plan. Super Admin terminal forms geocode the entered
address on create or location change and save the returned coordinates; unrelated edits
reuse the stored coordinates. A map pin picker remains future work for the chairperson console.

## Main flows

1. **Register a group:** Transport groups → Add transport group → fill name and type → choose a municipality → optionally choose an available chairperson → Create group. The live registry and audit log update together.
2. **Change a group:** View → Edit group → change fields or replace the chairperson → Save group. Choosing Inactive explains that the group and its terminals leave public listings.
3. **Register or update a terminal:** Terminals → Add terminal, or View → Edit terminal → choose its responsible group → enter the barangay, address, and contact phone → Save. Municipality follows the selected group; OpenStreetMap looks up the address on create or location changes, and the returned coordinates are stored for the map.
4. **Review a role:** Users & roles → choose a different role → Review change → inspect the account and new access → confirm or cancel. The last Super Admin is protected. Existing group and driver assignments must be resolved before incompatible role changes.
5. **Inspect records:** Search/filter a directory → View → read details → Close. The list and filters remain in place.
6. **Inspect activity:** Audit log → search an actor, record, or operation → open the event → read the stored change details.

## Loading, errors, and limits

- During loading, metric values use a dash and list panels show a loading message.
- If the first read fails, show Retry instead of a dashboard full of zero counts.
- If an update fails after records were loaded, preserve those records and show the error.
- An empty search explains how to recover. Search is shown only on sections that can use it.
- Totals use exact database counts. Directories currently load up to 250 records; users show the latest 50 and the audit feed shows the latest 10. Full server pagination is a follow-up before a larger rollout. Coverage charts describe the loaded group records.
- Errors in a role change stay next to its confirmation controls, and the selection remains available to correct.

## Access and audit boundaries

The workspace requires the authenticated profile role `super_admin`. Group and
terminal writes go through the authenticated Supabase client, where row-level
security restricts them to super admins and database audit triggers record changes.
Chairperson assignment is limited to accounts with the chairperson role; the database
also enforces one group per chairperson.

Dialogs have a named heading, labeled fields, an explicit Close/Cancel action, and
scrollable content. Keyboard focus stays within the modal while it is open. The
native Back/Escape request uses the same close handler, including the unsaved-change check.

The existing embedded commuter map and its theme are outside these layout changes.
