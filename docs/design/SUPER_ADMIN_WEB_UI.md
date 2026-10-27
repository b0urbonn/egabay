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
| 01 Overview | Four registry totals, municipality coverage, task shortcuts | Real registry reads after sign-in; sample counts in preview |
| 02 Groups | Search, status filter, chairperson, status, details | Search/filter and detail panel |
| 03 Create group | Name, transport type, municipality, chairperson, status | Local preview creation with required-name and duplicate-name checks |
| 04 Chairperson assignment | Available account selection and effect of replacement | Selection in the preview group editor; assigned accounts are excluded from other groups |
| 05 Terminals | Group ownership, locality, active status, detail access | Search/filter and read-only details |
| 06 Vehicles | Body number, plate, terminal, driver, service status | Search/filter and read-only details |
| 07 User roles | Account identity, role options, permission review | Explicit confirmation before the existing live role RPC; local changes in preview |
| 08 Reports | Municipality and transport-type coverage; registry counts | Counts and descriptive charts; no unsupported growth arrows |
| 09 Audit log | Actor, action, record, date, recorded changes | Search and read-only event panel |
| 10 Compact layouts | Overview, list, and form at 390px | Responsive versions of the same interface |
| 11 Data states | Loading, no matches, unavailable records | Failure state with Retry; failed reads do not appear as zero totals |

The terminal map picker, vehicle override editor, driver approval actions, and live group
mutations remain later work in the build plan. The wireframes describe the intended
management flow; the preview does not claim those operations reached the database.

## Main flows

1. **Register a group:** Groups → Create group → fill name and type → choose a municipality → optionally choose an available chairperson → Save preview group. The list, active count, and preview audit feed update together.
2. **Change a group:** View → Edit preview group → change fields → Save. Choosing Inactive explains its public visibility and trip-sharing effect. Cancel checks for unsaved changes.
3. **Review a role:** Users & roles → choose a different role → Review change → inspect the account and new access → confirm or cancel. The last Super Admin is protected. Existing group and driver assignments must be resolved before incompatible role changes.
4. **Inspect records:** Search/filter a directory → View → read details → Close. The list and filters remain in place.
5. **Inspect activity:** Audit log → search an actor, record, or operation → open the event → read the stored change details.

## Loading, errors, and limits

- During loading, metric values use a dash and list panels show a loading message.
- If the first read fails, show Retry instead of a dashboard full of zero counts.
- If an update fails after records were loaded, preserve those records and show the error.
- An empty search explains how to recover. Search is shown only on sections that can use it.
- Totals use exact database counts. Directories currently load up to 250 records; users show the latest 50 and the audit feed shows the latest 10. Full server pagination is a follow-up before a larger rollout. Coverage charts describe the loaded group records.
- Errors in a role change stay next to its confirmation controls, and the selection remains available to correct.

## Access and preview boundaries

The real workspace still requires the authenticated profile role `super_admin`.
The design-preview route uses a separate sample account and local state. It never
calls the registry loader, group mutations, or role RPC. Preview edits do not alter
Supabase Auth, `profiles`, or any live registry record.

Dialogs have a named heading, labeled fields, an explicit Close/Cancel action, and
scrollable content. Keyboard focus stays within the modal while it is open. The
native Back/Escape request uses the same close handler, including the unsaved-change check.

The existing embedded commuter map and its theme are outside these layout changes.
