# Supabase authentication setup

This phase connects real sign-in and the protected role/profile foundation. Super
admin has a desktop web workspace. Chairperson and driver have responsive mobile
web workspaces; commuters use the existing travel screens. Roles come from
`public.profiles`, never from viewport width, local preferences, or signup metadata.

Project: https://gbzcbuxnhfqawsyiyedc.supabase.co

The first owner's email is configured locally in `EGABAY_BOOTSTRAP_ADMIN_EMAIL`.
Additional Google testers start as commuters by default.

## 1. Google test accounts

In [Google Auth Platform → Audience](https://console.cloud.google.com/auth/audience),
select the eGABAY Google Cloud project. If it is in Testing, add the designated owner and additional tester email addresses
to **Test users** and save. This list is managed in Google Cloud; application
code and a Supabase publishable key cannot edit it.

Google uses a **Web application** OAuth client for both desktop and Android browser
testing. Its authorized redirect URI is:

```text
https://gbzcbuxnhfqawsyiyedc.supabase.co/auth/v1/callback
```

Keep its Client Secret in the [Supabase Google provider settings](https://supabase.com/dashboard/project/gbzcbuxnhfqawsyiyedc/auth/providers).
It must not be placed in Expo environment variables or frontend code.

## 2. Apply the database setup once

The project was confirmed empty. From the repository root:

```sh
npm run build:database
```

Open `supabase/generated/setup.sql`, copy its entire contents, and run it in the
[project SQL Editor](https://supabase.com/dashboard/project/gbzcbuxnhfqawsyiyedc/sql/new).
It applies both migrations in one transaction. Run it once; it is not a seed or a
reset script. It creates no invented transport records and does not promote an
email address automatically. If it fails, the transaction rolls back; share the
error message before retrying.

The source migrations are:

1. `supabase/migrations/20261024000000_initial_schema.sql`
2. `supabase/migrations/20261026000000_auth_and_group_access.sql`

The second migration upgrades roles, adds groups/terminals/drivers and related
access policies, exposes a restricted public vehicle directory, and adds audited
role-management RPCs. Legacy vehicle-driver assignment table access is retired.
For a populated older deployment, real vehicle terminal assignments must be
prepared before applying its NOT NULL constraint.

The generated SQL is ignored by Git; regenerate it from the committed migrations.
SQL Editor application does not register Supabase CLI migration history. If the
project is later linked to the CLI, reconcile the two applied migration versions
with `supabase migration repair` before using `supabase db push`.

## 3. Configure local browser redirects

In [Supabase Authentication → URL Configuration](https://supabase.com/dashboard/project/gbzcbuxnhfqawsyiyedc/auth/url-configuration):

- Site URL: `http://localhost:8081`
- Allowed Redirect URL: `http://localhost:8081/`

In [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients),
add `http://localhost:8081` to the web client's authorized JavaScript origins.

The local `.env.local` already contains this project's URL and publishable key.
`EGABAY_BOOTSTRAP_ADMIN_EMAIL` selects the verified first owner when generating
local bootstrap SQL; it has no `EXPO_PUBLIC_` prefix and is not bundled into the app.
Those two values are public application configuration; database permissions rely
on RLS. No admin/service-role key is used by the application.

If a preview is already serving port 8081, use that preview or stop it before
starting the development server. Start the app with a stable port:

```sh
npm run web -- --port 8081
```

Complete the introduction, choose **Log in → Continue with Google**, and use the
owner's Google account. Browser PKCE callback processing is handled by Supabase;
the authenticated profile is then read from the database. Email signup and
password reset also work, subject to the project's email delivery settings. Open
confirmation and recovery links in the browser that started the flow.

## 4. Provision the first super admin

After the designated owner has signed in, run the generated file
`supabase/generated/bootstrap_super_admin.sql` in the project's SQL Editor. Its
reusable source template is `supabase/admin/bootstrap_super_admin.sql`.

The script requires an existing verified auth user and a profile. It performs the
promotion on the database side; it is never executed by the frontend. Its final
query displays the owner's email and role; confirm it says `super_admin`, then sign
out and sign back in so the app fetches the updated role. The desktop super-admin
workspace includes group/terminal/driver counts and role management for up to 50
accounts. The last super admin cannot demote themselves.

`supabase/admin/bootstrap_super_admin.sql` is only the source template. Do not run
it directly; it contains an email placeholder. Run the generated file under
`supabase/generated/` instead.

The additional tester remains a commuter unless a super admin explicitly changes
their role. A chairperson role also needs a group chairperson assignment, and a
driver role needs a group membership. Role changes alone do not create either.

## 5. Android browser testing

Use desktop browser device emulation for initial responsive checks. For testing on
an actual phone, deploy the web app to a reachable HTTPS URL. Register its exact
origin in the Google web client, and its site/redirect URLs in Supabase. The app
returns to its current origin and pathname after sign-in. `localhost` on a phone
refers to the phone, not the development computer.

A native Android build and native Google Sign-In are outside this browser phase.

## Verification and remaining phase work

```sh
npm run typecheck
npm run test:database
npm run build:database
npm run build:map
```

Database integration checks run real PostgreSQL policies/triggers in an isolated
PGlite database. They cover role escalation, group isolation, public field
restrictions, driver approvals, audit writes, owner bootstrap, and trip-location
visibility. They do not apply anything to the live project.

After applying SQL, check real Google login, cancellation, refresh, sign-out,
password recovery, and the four roles in the hosted project. Confirm public reads
never expose driver contact/license numbers or vehicle plate numbers.

This phase provides authentication and initial role workspaces, not complete
operational consoles. Group/terminal/vehicle editing, driver application screens,
and replacing commuter demo arrays with verified Supabase data remain the next
milestones. No Google account has been created or signed in by this setup.
