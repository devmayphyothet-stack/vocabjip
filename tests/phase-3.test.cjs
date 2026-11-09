const { test } = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers.cjs');

test('preferences restore safely and the core language dictionary supports both languages', () => {
  const { parsePreferences, translate } = environment().load('@/lib/learning-preferences');
  assert.deepEqual(
    parsePreferences({ language: 'my', focus: 'quiz', minutes: 10, onboarded: true }),
    { language: 'my', focus: 'quiz', minutes: 10, onboarded: true },
  );
  assert.deepEqual(
    parsePreferences({ language: 'unknown', focus: 'invalid', minutes: -5, onboarded: 'true' }),
    { language: 'en', focus: 'vocab', minutes: 5, onboarded: false },
  );
  for (const key of ['home', 'continueLearning', 'updateFailed', 'resumeQuiz', 'clearFilters']) {
    assert.notEqual(translate('en', key), translate('my', key));
    assert.ok(translate('my', key).length > 0);
  }
});

test('starter lessons remain available after downloading new lessons and every starter quiz is playable', () => {
  const env = environment();
  const { STARTER_VOCABS, STARTER_QUIZ_TOPICS, mergeLessons } = env.load('@/data/starter-lessons');
  const { playableTopics } = env.load('@/lib/quiz-curriculum');
  assert.equal(playableTopics(STARTER_QUIZ_TOPICS).length, 1);
  assert.equal(mergeLessons(STARTER_VOCABS, []).length, 3);
  const merged = mergeLessons(STARTER_VOCABS, [
    { ...STARTER_VOCABS[0], englishMeaning: 'Updated' },
    { ...STARTER_VOCABS[1], id: 'downloaded-one' },
  ]);
  assert.equal(merged.length, 4);
  assert.equal(merged.find((value) => value.id === STARTER_VOCABS[0].id).englishMeaning, 'Updated');
  const step = STARTER_QUIZ_TOPICS[0].steps[0];
  assert.equal(
    playableTopics([{ ...STARTER_QUIZ_TOPICS[0], steps: [{ ...step, questions: [] }] }]).length,
    0,
  );
  assert.equal(
    playableTopics([{ ...STARTER_QUIZ_TOPICS[0], steps: [{ ...step, passingScore: 99 }] }]).length,
    0,
  );
});

test('quiz checkpoints restore submitted answers and score, and reject changed questions or invalid answers', () => {
  const env = environment();
  const { STARTER_QUIZ_TOPICS } = env.load('@/data/starter-lessons');
  const step = STARTER_QUIZ_TOPICS[0].steps[0];
  const { createQuizSession, restoreQuizSession } = env.load('@/lib/quiz-session');
  const session = createQuizSession(step, 1, [0, 1]);
  const restored = restoreQuizSession(session, step);
  assert.equal(restored.index, 1);
  assert.equal(restored.submitted, true);
  assert.equal(restored.score, 2);
  assert.equal(restored.selectedOption, 1);
  assert.equal(restoreQuizSession({ ...session, answers: [0, 99] }, step), null);
  assert.equal(restoreQuizSession({ ...session, questionIndex: 50 }, step), null);
  const changed = {
    ...step,
    questions: step.questions.map((question, index) =>
      index === 0 ? { ...question, correctIndex: 1 } : question,
    ),
  };
  assert.equal(restoreQuizSession(session, changed), null);
  const next = restoreQuizSession(createQuizSession(step, 2, [0, 1]), step);
  assert.equal(next.submitted, false);
  assert.equal(next.selectedOption, null);
});

test('quiz sessions are account-specific and finishing a session cannot be undone by an earlier queued save', async () => {
  const env = environment();
  const { LearningSessionService } = env.load('@/services/learning-session-service');
  const { createQuizSession } = env.load('@/lib/quiz-session');
  const { STARTER_QUIZ_TOPICS } = env.load('@/data/starter-lessons');
  const session = createQuizSession(STARTER_QUIZ_TOPICS[0].steps[0], 0, []);
  const first = LearningSessionService.write(session, 'a');
  const finish = LearningSessionService.write(null, 'a');
  await Promise.all([first, finish]);
  assert.equal(await LearningSessionService.read('a'), null);
  assert.equal(await LearningSessionService.read('b'), null);
  await LearningSessionService.write(session, 'a');
  assert.equal((await LearningSessionService.read('a')).stepId, session.stepId);
  assert.equal(await LearningSessionService.read('b'), null);
});

test('Continue learning chooses the latest unfinished activity and otherwise follows the chosen focus', () => {
  const { nextLearningAction } = environment().load('@/lib/next-learning-action');
  const draft = {
    id: 'draft-a',
    type: 'statement',
    title: 'Statement',
    updatedAt: '2026-11-09T12:00:00Z',
  };
  const quiz = { title: 'Quiz', updatedAt: '2026-11-09T13:00:00Z' };
  assert.equal(nextLearningAction([draft], quiz, 'vocab', 5).label, 'resumeQuiz');
  assert.equal(
    nextLearningAction([draft], { ...quiz, updatedAt: '2026-11-09T11:00:00Z' }, 'quiz', 5).pathname,
    '/modal/statement-editor',
  );
  assert.equal(nextLearningAction([], null, 'vocab', 5, 'word-id').params.id, 'word-id');
  assert.equal(nextLearningAction([], null, 'writing', 10).params.durationMinutes, '10');
});

test('shared curriculum updates use one request for simultaneous screens and retain starter lessons', async () => {
  let calls = 0;
  let finish;
  let downloaded = [];
  const service = {
    getCurriculumVocabs: async () => downloaded,
    getCurriculumPatterns: async () => [],
    getCurriculumQuizTopics: async () => [],
    getCurriculumEssayPrompts: async () => [],
    getCurriculumLastSync: async () => null,
    syncCurriculumFromCloud: () => {
      calls++;
      return new Promise((resolve) => {
        finish = () => {
          downloaded = [{ id: 'cloud-word', spoken: 'a', written: 'b' }];
          resolve({ synced: true });
        };
      });
    },
  };
  const { CurriculumStore } = environment({ '@/services/curriculum-sync-service': service }).load(
    '@/services/curriculum-store',
  );
  const first = CurriculumStore.initialize();
  const second = CurriculumStore.initialize();
  const manual = CurriculumStore.syncNow();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(CurriculumStore.getSnapshot().isSyncing, true);
  finish();
  await Promise.all([first, second, manual]);
  assert.equal(CurriculumStore.getSnapshot().vocabularies.length, 4);
  assert.equal(CurriculumStore.getSnapshot().isSyncing, false);
  assert.equal(CurriculumStore.getSnapshot().hasDownloadedContent, true);
  assert.equal(CurriculumStore.getServerSnapshot().vocabularies.length, 3);
});

test('partial curriculum failure keeps the last successful timestamp and the failed section cache', async () => {
  const supabase = {
    from: (table) => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      then(resolve) {
        resolve(
          table === 'sentence_patterns'
            ? { error: { message: 'offline' } }
            : { data: [], error: null },
        );
      },
    }),
  };
  const env = environment({ '@/lib/supabase': { supabase, isSupabaseConfigured: true } });
  env.values.set('@vocabjip_curriculum_last_sync', '2026-11-01T00:00:00Z');
  env.values.set('@vocabjip_dynamic_patterns', '[{"id":"saved-pattern"}]');
  const { syncCurriculumFromCloud } = env.load('@/services/curriculum-sync-service');
  const result = await syncCurriculumFromCloud(true);
  assert.equal(result.synced, false);
  assert.ok(result.error);
  assert.equal(env.values.get('@vocabjip_curriculum_last_sync'), '2026-11-01T00:00:00Z');
  assert.equal(env.values.get('@vocabjip_dynamic_patterns'), '[{"id":"saved-pattern"}]');
});
