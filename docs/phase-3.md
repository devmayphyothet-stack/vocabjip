# Phase 3: a clearer learning flow

Branch: `codex/phase-3-learning-flow`, based on Phase 2. No database changes, new packages, or native dependencies are introduced.

## Included

- Optional learning setup from Home and Profile → Learning preferences. Learners choose English/Myanmar for core controls, vocabulary/quiz/writing focus, and a 5/10/15-minute preference. Existing deep links continue working; setup is not a forced sign-up flow.
- Continue learning on Home chooses the most recent unfinished quiz or saved draft. With no unfinished work, it suggests an action for the chosen focus. Writing suggestions can start a short timed practice; completed quizzes keep their existing best scores.
- One unfinished quiz checkpoint per account/device, including the current question and submitted answers. Starting another quiz asks before replacing that checkpoint. Finishing clears it only after the step score is saved. Scores are recalculated from validated answers on restoration.
- Quiz checkpoints are checked against current question IDs, text, options and correct answers. Changed questions cannot restore stale answers. A temporarily missing lesson does not erase its checkpoint.
- Built-in starter vocabulary, writing patterns, a five-question quiz and two writing prompts. These are clearly attributed as starter lessons, not official exam content or downloaded Contributor submissions. They remain available after other lessons are downloaded.
- A single shared curriculum store replaces per-screen downloads. Simultaneous update requests share one operation. Cache failures keep starter content usable; partial cloud failures do not advance the last-successful timestamp or erase the failed section's cache.
- Shared lesson status and retry controls, English vocabulary search as well as Korean/Myanmar search, and a clear search/filter reset. Missing lesson links show an explicit unavailable state rather than a different lesson.
- Larger touch targets for core actions, separate lesson/bookmark buttons, selected/checked accessibility states, radio semantics for quiz answers, progress announcements, higher-contrast muted text, and navigation height that responds to larger system text.

## Language coverage

English/Myanmar preferences cover setup, tab navigation, Continue learning, lesson-update status, search and vocabulary meanings, important quiz controls and starter-question explanations, and selected Home/Profile/Saved labels. Korean examples remain Korean. Contributor-authored lesson text keeps its supplied language when a translation is unavailable. Authentication, advanced editing/review tools and Studio retain existing copy; this is not a claim of complete app-wide translation.

Preferences and quiz checkpoints are account-scoped and stored on the current device. They are not synced across devices or automatically imported from guest mode. Choosing a focus is a simple suggestion, not a proficiency assessment or an adaptive study plan.

## Verification

- `npm test` covers preference validation, starter content, playable quiz validation, resume/scoring and changed questions, account isolation, ordered checkpoint clearing, next-action priority, concurrent updates and partial failures, plus all previous regression suites.
- App/server/Studio type checks, app/Studio lint and both production web builds are checked. Existing lint advisories remain warnings.
- Native VoiceOver/TalkBack, large-text layouts, back gestures and airplane-mode transitions still require real-device verification. Myanmar copy should receive native-speaker review before release.

## Rollout

Deploy the updated app normally after the Phase 1/2 prerequisites. This phase does not apply hosted migrations, publish a build, or change live accounts. No extra server or Auth configuration is required for these additions.

## Next

Phase 4: spaced vocabulary review, a mistake notebook, writing revision practice and progress history. Full translation of the remaining advanced tools is a separate follow-up.
