# Phase 4: review, revision and learning history

Branch: `codex/phase-4-review-and-progress`, based on Phase 3. No new packages, native dependencies, migrations, or hosted configuration changes.

## Included

- Home, Practice and Profile link to a learning hub with vocabulary review, a mistake notebook, writing feedback and progress history. Saved-word details also link to review.
- Bookmarked vocabulary forms the review deck. New saved words are due immediately. Recall starts with the everyday form and meaning; reveal the academic form and example before rating. Again schedules 10 minutes and resets the stage; Hard schedules one day and backs up a stage; Good progresses through 1/3/7/14/30/60 days; Easy skips a stage. This is a simple schedule, not a calibrated proficiency assessment. Unbookmarking removes a word from the active deck without erasing its past schedule. Previously reviewed word snapshots remain usable if a downloaded lesson is temporarily unavailable.
- Wrong quiz answers enter the mistake notebook with a snapshot of the question, choices, answer and explanation. AI grammar suggestions enter as explicitly labelled AI notes. Quiz notes check the selected answer; writing notes ask learners to rewrite and compare themselves. “Practised” does not mean mastered or independently graded. A new mistake reopens the note.
- Quiz attempts keep a stable ID across checkpoints. Replaying notebook writes or retrying completion cannot duplicate the same attempt's mistakes or score entry. A failed history write keeps the checkpoint available for retry.
- AI feedback is recorded with the original essay, topic, date and original estimate. If saving fails, generated feedback still appears with an explicit warning and a retry through “Save feedback & revise writing”. Older saved feedback can be imported without a fresh AI request. Reviewed Contributors submissions are imported when the learner opens or refreshes their own submissions. Pending and other-account submissions do not enter history.
- A revision workbench keeps original writing, feedback and a separate editable draft. Contributors reference samples appear alongside the original. Individual AI corrections apply only when the exact original phrase occurs once. Missing/repeated/overlapping phrases require manual editing; already-applied suggestions cannot be applied twice. Revisions use the existing immediate local recovery and deferred cloud sync. Saved opens revision drafts in this workbench. Fresh AI or Contributors feedback is an explicit request through the existing consent/submission flow.
- History shows completed vocabulary, quiz, mistake and revision practice. Writing feedback labels AI estimates separately from Contributors scores, preserving Q53 /30 and Q54 /50 scales. Revising creates an activity, not an invented new score. The daily history count deduplicates each word, quiz step, note or revision draft per local calendar day.
- Streaks advance on completed activity rather than opening the app. Stable item IDs prevent repeated practice inflating daily completion. An atomic device snapshot preserves these counters and IDs together; older counter keys remain compatibility mirrors. Historical pre-Phase-4 counters are carried forward; previous app-open days cannot be reconstructed as actual practice.
- English/Myanmar cover the new primary controls and explanations. Content from Contributors and AI keeps its supplied language. Existing advanced-tool copy and some storage error messages remain English. Visible role labels continue to use Contributors.

## Storage and privacy

Review schedules, notebook and learning history are account-scoped on the current device, with a separate guest scope. They are not automatically imported from guest mode or synced across devices. History begins with actual recorded usage; no synthetic historical activity or improvement claims are added.

The device log retains up to 400 practice entries, 200 notes, 30 writing feedback entries and 3,000 recent deduplication keys. Oldest entries are trimmed; past cumulative counts are not a permanent transcript. Schedules are retained by vocabulary ID. Feedback can be reimported after it leaves the 30-entry list without multiplying its notes while its deduplication key remains retained. Practice lists reveal more entries in batches to limit initial rendering work.

Revision drafts include an original/feedback snapshot and applied-suggestion IDs in draft metadata. Like other drafts, they can sync through the existing private draft infrastructure from Phase 2, and remain until deleted from Saved. Deleting a revision draft does not remove its separate retained history entry. The privacy export includes device history and revision source metadata, without API credentials. Existing account deletion removes the account's storage prefix, including logs, schedules and progress snapshots; paused-write guards prevent late writes recreating deleted records. Corrupt log data is preserved and surfaced as an error rather than silently overwritten.

## Verification

- 36 automated tests pass, including nine new suites covering exact review intervals, duplicate taps, failed writes/retry, resumed quiz idempotency and snapshots, AI import/retention, Contributors ownership/score filtering, unambiguous corrections, revision scoring, corrupt storage/deletion guards, and activity-based daily streaks.
- App/server/Studio type checks, app/Studio lint and both production web builds pass. Existing lint advisories and the Studio bundle-size advisory remain.
- Browser smoke check: opened the hub and empty review deck, bookmarked a starter word, revealed/rated it, verified the next-day schedule and resulting history entry.
- Native keyboard/back gestures, screen readers, large system text, clock/day transitions and offline/background flows still need real-device acceptance testing. Myanmar copy should receive native-speaker review before release. No paid AI request or real Contributors submission was made during verification.

## Rollout

Ship the app through the normal build/update process after the existing Phase 1/2 backend prerequisites. This change does not deploy or publish anything and does not change live accounts. Reinstalling the app or clearing its storage loses device-only schedules/history; synced revision drafts follow existing draft recovery behavior.
