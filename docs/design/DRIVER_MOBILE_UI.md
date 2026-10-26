# Driver mobile UI

The [wireframe board](driver-mobile-wireframes.svg) shows the driver preview at a 390 × 844 reference viewport. Open it in the app from **Log in → Driver & chairperson demos → Open driver preview**. The Expo implementation is `src/screens/DriverWorkspaceScreen.tsx`.

## Layout and navigation

- **Home:** large greeting, current availability, the assigned group/vehicle/terminal, and the latest group update.
- **Updates:** read-only announcements from the driver's own group.
- **Profile:** own contact and license details, a System/Light/Dark appearance selector, profile editing, and a group application preview.
- The bottom tab bar stays visible while moving between these top-level sections. On wide screens, it becomes a sidebar.
- A trip can start only after a separate consent sheet. When active, a persistent banner keeps **Stop sharing** available from every section.

## Driver workflows

- The Home segmented control offers **Available**, **On trip**, and **Offline**. Selecting **On trip** opens the consent sheet first.
- The assigned vehicle and terminal are display-only. The driver can edit their own name, contact number, license number, and photo entry point.
- Announcements are read-only and labeled with the sample group.
- The group application form collects group choice, name, contact, and license, then shows a pending-chairperson-review state. The current approved sample profile remains unchanged because this is only a preview of the new-driver flow.

## Apple platform conventions

The mobile layout uses a small set of tab destinations, a navigation bar, large page titles, grouped list rows, sentence-case actions, and system fonts. Touch controls are at least 44 points high. The appearance control is a compact single-choice segmented control; System follows the device by default, with explicit Light and Dark overrides that update eGABAY throughout. The consent sheet explains the sharing scope before the driver can start a trip. Text uses React Native's default font scaling.

References: [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios/), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## Backend handoff

Driver profile and application records are local component state and reset when the preview closes. The appearance choice uses the app's existing device preference and persists on this device. The preview does not access GPS, upload profile photos, or call Supabase. The live driver role still needs group-scoped application and profile writes, chairperson approval, a read-only own-group announcement query, and availability updates. Location should be shared only during an explicitly consented active trip, with an always-visible stop-sharing action; enforce the driver's group and record access in Supabase policies.
