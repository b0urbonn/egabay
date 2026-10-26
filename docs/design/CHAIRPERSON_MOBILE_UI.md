# Chairperson mobile UI

The [wireframe board](chairperson-mobile-wireframes.svg) defines eight layouts at a 390 × 844 reference viewport. The working Expo implementation is `src/screens/ChairpersonConsoleScreen.tsx`; open it from **Log in → Chairperson demo → Open chairperson preview**.

## Navigation and layout

- **Five persistent mobile tabs:** Dashboard, Terminals, Fleet, Drivers, Updates.
- **Assignments** opens from Dashboard or Fleet. The back action returns to Fleet.
- Creating or editing a terminal or vehicle replaces its list with a form. Back or Cancel returns to that list.
- The header identifies the assigned group. All lists and selectors contain that group's sample records only.
- Content scrolls above the bottom navigation. On native phones, the navigation hides while the keyboard is open; iOS forms use keyboard avoidance.
- The web console uses a sidebar and wider content at 900 pixels or more. The commuter phone frame is removed while this console is open.

## Build plan mapping

| Wireframe | Layout and behavior |
| --- | --- |
| Dashboard | Terminal, vehicle, approved-driver, and pending-application counts; review queue; shortcuts to group operations. |
| Terminal directory | Search by name or locality; expandable location cards; coordinates; vehicle counts; edit and terminal roster actions. |
| Terminal create/edit | Required name, municipality, barangay, latitude, and longitude. Coordinate range checks and duplicate-name validation. |
| Vehicle roster | Search body number, plate, or driver; type filters; terminal filter from the terminal directory; driver assignment and status. |
| Driver applications | Applications, Roster, and Decisions views. Approval/rejection confirmation and local decision timestamps. Approved drivers show their assigned vehicle and terminal. |
| Assignments | Select vehicle → select approved, unassigned driver → select group terminal → save. A driver may be assigned to only one vehicle. |
| Announcements | Fixed group-driver audience, title, message, publish action, and a feed with source and timestamp. Draft fields survive section changes within the workspace. |
| Vehicle create/edit | Body/franchise number, plate, type, group terminal, approved driver, and explicit status selection. Duplicate plates/body numbers are rejected. |

## Interaction requirements

- Main controls use at least 44-point targets; inputs and primary actions use approximately 48–52 points.
- Empty lists and unsuccessful searches have explicit messages.
- A terminal with vehicles cannot be removed. Move its vehicles through Assignments first, then confirm removal of the empty terminal.
- Counts and terminal rosters are derived from the same vehicle state used by assignment controls.
- Contact, license, and plate values appear only in this management preview, with fictional sample identifiers.
- Feedback uses an accessible message with a dismiss action. Forms show actionable validation beside their save control.

## Backend handoff

This is the standby UI requested while the backend is built. Records live in screen state and reset when the workspace closes. The preview does not authorize a chairperson account or claim that writes have reached Supabase.

Replace the demo state through group-scoped reads and mutations once authentication and database types are ready. Resolve the chaired group from the signed-in profile; enforce RLS, same-group assignments, unique assignments, and audit logging on the backend. Replace the Login screen demo launch with the authenticated, role-gated chairperson route. The terminal form currently provides validated coordinate entry; an interactive geographic map-pin picker remains a follow-up integration.
