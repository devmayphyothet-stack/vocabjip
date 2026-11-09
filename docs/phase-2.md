# Phase 2: profiles and writing recovery

Implementation is on `codex/phase-2-profiles-recovery`, based on Phase 1. Hosted migrations and deployments are separate steps; this work does not change the live database or delete any real accounts.

## Profile management

- App users can edit display name, a selectable avatar, target TOPIK level and daily goal from Profile → Edit profile.
- Contributors/admins can also edit a public bio and Korean/TOPIK background. Studio exposes the same fields from My profile. Background details are explicitly self-reported; roles remain administrator-controlled.
- Avatars use built-in choices rather than uploaded photos, so no photo permissions or storage buckets are required.
- Email changes go through Supabase Auth. The UI reports whether confirmation is pending and has a Refresh email status action. Configure Auth email confirmations and secure email changes before release. The database email mirror updates only when Auth changes the verified address.
- Public attribution follows display-name edits. Private email addresses and learning goals are excluded from the Contributors directory.

## Writing recovery

- Autosaves do not count as completed learning activities.
- Both writing editors save each change to the account's existing local collection. Network sync waits for a short typing pause; saving locally does not wait for the network.
- Backgrounding and navigation attempt to flush the latest writing. Leaving is blocked if the local save fails. Home offers Continue writing and Saved reopens the correct editor.
- A personal statement now has one stable ID and stores all four sections, university/major and the last section being edited. Cloud sync preserves that metadata and recovered copies retain it.
- Existing section-only drafts keep their writing when reopened; sections were never previously stored together, so they cannot be reconstructed automatically. Older clients are prevented from flattening a complete statement into one section.
- Recovery covers completed local writes. No app can guarantee persistence if the operating system terminates it before a device write completes or the device cannot store data. Native back gestures, keyboard behavior, backgrounding and abrupt termination still need real-device verification.

## Account deletion

- App: Account & Privacy. Studio: My profile. Deletion requires the current password, typing DELETE and explicit confirmation.
- The server validates the authenticated caller and verifies the current password. Caller-supplied IDs/emails cannot select another account.
- Auth deletion cascades to private drafts/bookmarks, owned essay submissions, profile and published community essays. A database trigger removes linked feedback and anonymizes retained curriculum/reviews for other learners in the same transaction. Administrator accounts must first be demoted by another administrator.
- Device writes are paused and active local writes drained before app deletion. Late review/AI/progress saves cannot recreate data during cleanup. Only this account's local collection is removed; guest and other accounts' writing remain.
- Local app cleanup runs only after a confirmed server response. A marker allows interrupted cleanup to retry on the next launch. Studio clears its own session; it cannot remove offline copies saved in the app or on other devices.
- If the server response is interrupted, the UI does not claim success or erase local writing. Hosted backups/log retention are controlled by the deployment, not this app.

## Deployment

1. Deploy/apply Phase 1 prerequisites first; preserve the existing administrator account.
2. Back up the database and apply `202611090002_profiles_and_statements.sql`, then `202611090003_account_deletion.sql`. Use migration files for an existing installation; `schema.sql` is the complete fresh-install schema, not a replacement for ordered upgrades.
3. Deploy `supabase/functions/delete-account` with `supabase functions deploy delete-account --project-ref YOUR_PROJECT_REF`. Standard Supabase server environment variables are used. Keep service-role credentials off clients and keep function authentication verification enabled.
4. Ensure Supabase Auth email confirmation/secure email change settings and redirect URLs match the deployed app and Studio.
5. Deploy updated app/Studio builds and verify profile changes across them, email confirmation, legacy/new statements, offline recovery and deletion against a staging project. Never use a production account for deletion testing.

## Verification

Run `npm test`, app/Studio/server TypeScript checks, app/Studio lint and both production web builds. Tests use mocked services plus in-memory PostgreSQL, not the hosted database. Existing lint advisories remain warnings, as documented in Phase 1.
