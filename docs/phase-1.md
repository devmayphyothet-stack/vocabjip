# Phase 1: privacy and reliable saving

This phase changes app/Studio code and supplies a database migration plus a Supabase function. It does not apply changes to a hosted database or deploy services.

## Included

- Private essay submissions are readable by their owner and signed-in Contributors/admins. The public Contributors directory contains only attribution fields; review totals contain no essay text.
- New users always start with the `user` role. Administrators assign roles through a checked database function. Invitation redemption checks the verified email, expiration, and one-time use in one transaction.
- System Gemini keys are readable only by administrators and the server. Shared dictionary lookups use an authenticated `vocab-lens` function, with 50 uncached lookups per account/day. Public clients can no longer write to the shared dictionary cache.
- UUID draft IDs, durable local changes, retryable cloud operations, and recovered copies for stale draft conflicts. Deletions and bookmark changes are queued as well.
- Account-specific drafts, bookmarks, quiz progress, AI settings/results, review submissions, and streak state. Guest drafts/bookmarks can be explicitly imported from Your Collection.
- Offline review submissions say “Waiting to send”; opening or refreshing the review screen retries signed-in submissions with the same UUID to prevent duplicate delivery.
- Failed OCR and incomplete AI feedback no longer return sample text or invented scores. AI requests have bounded timeouts/retries.
- Visible Teacher/Burmese equivalents are replaced with Contributors. Existing review links redirect to the new Contributors route.
- The misleading deletion action now states that account deletion is unavailable. Actual account deletion and complete personal-statement management remain Phase 2.

## Existing local data

On first launch, legacy device-wide values are moved under the last cached profile ID; without a cached profile they are assigned to guest storage. There is no automatic import into a different signed-in account. Historical device-wide data had no per-item owner, so it cannot be reliably split among multiple people who previously shared a device.

Guest import moves drafts and bookmarks only, through an explicit action. Quiz progress, keys, and review submissions stay in their original account. Legacy review items that were only saved locally are labelled “Saved locally · Resubmit from your draft” and must be resubmitted from the editor; they are not falsely treated as delivered.

## Deployment checklist

1. Back up the database and confirm there is an existing administrator profile. The migration preserves existing roles; it intentionally removes the old email/metadata-based administrator bootstrap. If no administrator exists, assign the initial administrator using the Supabase SQL editor as the database owner.
2. Apply `supabase/migrations/202611090001_phase_1_privacy.sql` using the Supabase SQL editor or your normal migration pipeline. `supabase/schema.sql` also includes the same hardening for fresh installations. Do not rerun an older copy of the schema after this migration.
3. Deploy `supabase/functions/vocab-lens` with `supabase functions deploy vocab-lens --project-ref YOUR_PROJECT_REF`. The standard Supabase URL/service-role environment is provided inside the function. Do not place service-role keys or system Gemini keys in `EXPO_PUBLIC_*` variables.
4. Rotate system Gemini keys that were stored under the earlier publicly readable policy, then save the replacement keys in Studio as an administrator. This repository change cannot revoke keys already downloaded by older clients.
5. Deploy the updated app and Studio together. Existing mobile installations that need updated native dependencies require an appropriate build; `expo-crypto` was added for UUID generation. Old clients will no longer be able to fetch system keys or self-assign Contributor roles.
6. Check real-device sign-in/sign-out, account switching, guest import, offline draft saving/reconnection, Contributors submissions, and invitation redemption against a staging project before production rollout.

No credentials are included in these instructions. The function checks the caller's session itself; keep authentication verification enabled when deploying.

## Verification

- `npm test`: isolated service tests and an in-memory PostgreSQL database with anonymous, authenticated, administrator, and server roles. Tests never use the hosted database.
- `npm run typecheck`: app TypeScript check. Run `npx expo customize tsconfig.json` first on a clean checkout to generate route declarations.
- `npx tsc --noEmit -p supabase/functions/tsconfig.json`: server function TypeScript check using the local declarations for the supplied Deno runtime.
- `npm run lint` and `npm run lint:studio`: lint setup introduced in this phase. Existing React Compiler, copy-escaping, and other advisories remain warnings; they are not represented as resolved.
- `npm run build` in `studio/` and `npm run build:web`: production web builds.

Native device behavior and hosted policies still need staging verification. Sync conflict ordering uses saved timestamps; recovered copies preserve the losing offline version when the server rejects an older write.

## Next phase

Profile editing for app users and Contributors, complete statement documents, automatic writing recovery across all exit paths, and actual account deletion. Phase 1 does not add those features.
