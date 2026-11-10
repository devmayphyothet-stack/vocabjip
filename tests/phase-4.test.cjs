const { test } = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers.cjs');
const word = {
  id: 'word-1',
  spoken: '하지만',
  written: '그러나',
  englishMeaning: 'however',
  myanmarMeaning: 'သို့သော်',
  exampleKorean: '그러나 문제가 있다.',
};
const feedback = (index = 0) => ({
  questionType: 'Q53',
  promptTopic: 'Writing',
  essayText: `Original ${index}`,
  charCount: 10,
  estimatedScore: 20,
  maxScore: 30,
  overallSummary: 'Revise this',
  structureRating: { score: 7, max: 10, comment: 'Structure' },
  contentRating: { score: 7, max: 10, comment: 'Content' },
  languageRating: { score: 6, max: 10, comment: 'Language' },
  strengths: [],
  improvements: ['Revise'],
  grammarCorrections: [
    { original: 'phrase', corrected: 'better phrase', explanation: 'Formal usage' },
  ],
  vocabularySuggestions: [],
  evaluatedAt: new Date(1794254400000 + index * 1000).toISOString(),
});

test('review intervals are deterministic and lapses restart the schedule', () => {
  const { scheduleReview } = environment().load('@/lib/review-scheduling');
  const now = new Date('2026-11-10T00:00:00Z');
  const first = scheduleReview(word, undefined, 'good', now);
  assert.equal(first.dueAt, '2026-11-11T00:00:00.000Z');
  const next = scheduleReview(word, first, 'good', now);
  assert.equal(next.dueAt, '2026-11-13T00:00:00.000Z');
  assert.equal(scheduleReview(word, first, 'easy', now).dueAt, '2026-11-17T00:00:00.000Z');
  const again = scheduleReview(word, next, 'again', now);
  assert.equal(again.dueAt, '2026-11-10T00:10:00.000Z');
  assert.equal(again.lapses, 1);
  assert.equal(again.step, -1);
  assert.equal(scheduleReview(word, again, 'hard', now).dueAt, '2026-11-11T00:00:00.000Z');
  assert.throws(() => scheduleReview(word, first, 'invalid', now));
});

test('simultaneous ratings cannot double-count a card and failed writes leave its schedule intact', async () => {
  const env = environment();
  const service = env.load('@/services/learning-log-service').LearningLogService;
  const results = await Promise.allSettled([
    service.rateWord(word, 'good', 0, 'a'),
    service.rateWord(word, 'easy', 0, 'a'),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await service.read('a')).activities.length, 1);
  assert.equal((await service.read('b')).activities.length, 0);
  const original = env.storage.setItem;
  env.storage.setItem = async () => {
    throw new Error('Disk full');
  };
  await assert.rejects(service.rateWord(word, 'again', 1, 'a'));
  assert.equal((await service.read('a')).schedules[word.id].count, 1);
  env.storage.setItem = original;
  await service.rateWord(word, 'again', 1, 'a');
  assert.equal((await service.read('a')).schedules[word.id].count, 2);
});

test('quiz mistakes and completion are idempotent per resumed attempt and preserve question snapshots', async () => {
  const env = environment();
  const service = env.load('@/services/learning-log-service').LearningLogService;
  const step = env.load('@/data/starter-lessons').STARTER_QUIZ_TOPICS[0].steps[0];
  const wrong = (step.questions[0].correctIndex + 1) % step.questions[0].options.length;
  await Promise.all([
    service.recordQuizAnswer(step, 0, wrong, 'attempt', 'a'),
    service.recordQuizAnswer(step, 0, wrong, 'attempt', 'a'),
  ]);
  let log = await service.read('a');
  assert.equal(Object.values(log.mistakes)[0].occurrences, 1);
  const answers = step.questions.map((question) => question.correctIndex);
  answers[0] = wrong;
  await Promise.all([
    service.completeQuiz(step, answers, 'attempt', 'a'),
    service.completeQuiz(step, answers, 'attempt', 'a'),
  ]);
  log = await service.read('a');
  assert.equal(log.activities.length, 1);
  assert.equal(log.activities[0].score, answers.length - 1);
  assert.deepEqual(Object.values(log.mistakes)[0].options, step.questions[0].options);
  await service.recordQuizAnswer(step, 0, wrong, 'next-attempt', 'a');
  assert.equal(Object.values((await service.read('a')).mistakes)[0].occurrences, 2);
  await assert.rejects(service.completeQuiz(step, [], 'incomplete', 'a'));
  const session = env.load('@/lib/quiz-session').createQuizSession(step, 0, [wrong], 'attempt');
  assert.equal(session.attemptId, 'attempt');
});

test('AI history preserves the original, reimport does not multiply mistakes, and trimmed feedback can be opened again', async () => {
  const env = environment();
  const service = env.load('@/services/learning-log-service').LearningLogService;
  const first = await service.recordAiFeedback(feedback(), 'a');
  assert.equal(first.originalText, 'Original 0');
  assert.equal((await service.recordAiFeedback(feedback(), 'a')).id, first.id);
  for (let i = 1; i <= 30; i++) await service.recordAiFeedback(feedback(i), 'a');
  let log = await service.read('a');
  assert.equal(log.reviews.length, 30);
  assert.equal(Object.values(log.mistakes)[0].occurrences, 31);
  const restored = await service.recordAiFeedback(feedback(), 'a');
  log = await service.read('a');
  assert.ok(log.reviews.some((review) => review.id === restored.id));
  assert.equal(Object.values(log.mistakes)[0].occurrences, 31);
  await assert.rejects(service.recordAiFeedback({ ...feedback(), maxScore: 50 }, 'a'));
  await assert.rejects(service.recordAiFeedback({ ...feedback(), evaluatedAt: 'invalid' }, 'a'));
  assert.equal((await service.read('b')).reviews.length, 0);
});

test('Contributors history imports only completed own reviews with valid scores', async () => {
  const service = environment().load('@/services/learning-log-service').LearningLogService;
  const item = {
    id: 'submission',
    student_id: 'a',
    question_type: 'Q53',
    prompt_title: 'Topic',
    content: 'Original writing',
    status: 'reviewed',
    score: 22,
    max_score: 30,
    overall_comment: 'Feedback',
    corrected_sample: 'Reference',
    created_at: '2026-11-10T00:00:00Z',
  };
  await service.importContributorReviews(
    [
      item,
      { ...item, id: 'other', student_id: 'b' },
      { ...item, id: 'pending', status: 'pending' },
      { ...item, id: 'invalid', score: 60 },
    ],
    'a',
  );
  await service.importContributorReviews([item], 'a');
  const log = await service.read('a');
  assert.equal(log.reviews.length, 1);
  assert.equal(log.reviews[0].source, 'contributors');
  assert.equal(log.reviews[0].referenceText, 'Reference');
  assert.equal(log.activities.length, 0);
  assert.equal(Object.keys(log.mistakes).length, 0);
  await service.importContributorReviews([item]);
  assert.equal((await service.read()).reviews.length, 0);
});

test('revision corrections reject repeated, absent, or ambiguous phrases and keep unrelated text', () => {
  const { applyWritingCorrection } = environment().load('@/lib/review-scheduling');
  assert.equal(
    applyWritingCorrection('A phrase here.', 'phrase', 'better phrase'),
    'A better phrase here.',
  );
  assert.throws(() => applyWritingCorrection('phrase phrase', 'phrase', 'new'));
  assert.throws(() => applyWritingCorrection('aaaa', 'aa', 'b'));
  assert.throws(() => applyWritingCorrection('text', 'missing', 'new'));
  assert.throws(() => applyWritingCorrection('text', '', 'new'));
});

test('revision history records edits once, never invents a new score, and preserves mistake history', async () => {
  const env = environment();
  const service = env.load('@/services/learning-log-service').LearningLogService;
  const review = await service.recordAiFeedback(feedback(), 'a');
  await assert.rejects(service.completeRevision(review, 'draft', review.originalText, 'a'));
  await Promise.all([
    service.completeRevision(review, 'draft', 'Revised', 'a'),
    service.completeRevision(review, 'draft', 'Revised', 'a'),
  ]);
  let log = await service.read('a');
  assert.equal(log.activities.length, 1);
  assert.equal(log.activities[0].score, undefined);
  assert.equal(log.reviews[0].score, 20);
  const note = Object.values(log.mistakes)[0];
  await service.practiseMistake(note.id, true, 'a');
  log = await service.read('a');
  assert.equal(log.mistakes[note.id].status, 'practised');
  assert.equal(log.mistakes[note.id].occurrences, 1);
  await service.practiseMistake(note.id, false, 'a');
  assert.equal((await service.read('a')).mistakes[note.id].status, 'open');
});

test('corrupt learning history is retained and account deletion pauses late learning writes', async () => {
  const env = environment();
  const { accountKey, pauseAccountWrites } = env.load('@/lib/account-storage');
  const service = env.load('@/services/learning-log-service').LearningLogService;
  const key = accountKey('learning_log_v1', 'a');
  const corrupt = JSON.stringify({
    version: 1,
    schedules: { bad: {} },
    mistakes: {},
    reviews: [],
    activities: [],
    seen: [],
  });
  env.values.set(key, corrupt);
  await assert.rejects(service.read('a'));
  await assert.rejects(service.rateWord(word, 'good', 0, 'a'));
  assert.equal(env.values.get(key), corrupt);
  env.values.delete(key);
  await pauseAccountWrites('a');
  await assert.rejects(service.rateWord(word, 'good', 0, 'a'));
  assert.equal(env.values.has(key), false);
  await service.rateWord(word, 'good', 0, 'b');
  assert.equal((await service.read('b')).activities.length, 1);
});

test('streaks credit real activity once per item per day and opening the app alone does not advance them', async () => {
  const env = environment({
    '@/lib/supabase': {
      supabase: { from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }) },
    },
  });
  const { accountKey } = env.load('@/lib/account-storage');
  const service = env.load('@/services/streak-service').StreakService;
  const today = env.load('@/lib/review-scheduling').localDay();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const last = env.load('@/lib/review-scheduling').localDay(yesterday);
  env.values.set(
    accountKey('progress_v2', 'a'),
    JSON.stringify({
      streakDays: 4,
      dailyGoal: 3,
      dailyCompleted: 2,
      lastActiveDate: last,
      completedDate: last,
      activityIds: ['word'],
    }),
  );
  const initial = await service.initStreak('a');
  assert.equal(initial.streakDays, 4);
  assert.equal(initial.lastActiveDate, last);
  assert.equal(initial.dailyCompleted, 0);
  await Promise.all([service.recordActivity('a', 'word'), service.recordActivity('a', 'word')]);
  assert.equal(service.getState('a').dailyCompleted, 1);
  assert.equal(service.getState('a').streakDays, 5);
  assert.equal(service.getState('a').lastActiveDate, today);
  assert.equal((await service.initStreak('b')).streakDays, 0);
  await service.recordActivity('b', 'word');
  assert.equal(service.getState('b').streakDays, 1);
});
