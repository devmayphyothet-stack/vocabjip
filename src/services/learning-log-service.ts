import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountKey, setAccountItem } from '@/lib/account-storage';
import { createDraftId } from '@/lib/draft-utils';
import { fingerprintText, scheduleReview } from '@/lib/review-scheduling';
import { validateEssayEvaluation } from '@/lib/ai-validation';
import type {
  LearningLog,
  LearningMistake,
  WritingReview,
  LearningActivity,
  ReviewWord,
  RecallRating,
} from '@/types/learning';
import type { AiEvaluationResult } from '@/types/ai';
import type { QuizStepItem } from '@/data/quiz-data';
import type { ContributorEssaySubmission } from '@/services/essay-review-service';
const KEY = 'learning_log_v1';
export const emptyLearningLog = (): LearningLog => ({
  version: 1,
  schedules: {},
  mistakes: {},
  reviews: [],
  activities: [],
  seen: [],
});
const queues = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<(log: LearningLog) => void>>();
async function load(userId?: string): Promise<LearningLog> {
  const raw = await AsyncStorage.getItem(accountKey(KEY, userId));
  if (!raw) return emptyLearningLog();
  const value = JSON.parse(raw);
  if (
    value?.version !== 1 ||
    !value.schedules ||
    !value.mistakes ||
    !Array.isArray(value.reviews) ||
    !Array.isArray(value.activities) ||
    !Array.isArray(value.seen)
  )
    throw new Error('Learning history could not be opened. Your saved data has been kept.');
  if (!validLearningLog(value))
    throw new Error('Learning history is incomplete. Your saved data has been kept.');
  return value;
}
function validLearningLog(log: LearningLog) {
  const text = (value: unknown): value is string => typeof value === 'string';
  const date = (value: unknown) => text(value) && Number.isFinite(Date.parse(value));
  const count = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;
  const record = (value: unknown) => !!value && typeof value === 'object' && !Array.isArray(value);
  return (
    record(log.schedules) &&
    record(log.mistakes) &&
    log.seen.every(text) &&
    Object.values(log.schedules).every(
      (item) =>
        item &&
        record(item.word) &&
        ['id', 'spoken', 'written', 'englishMeaning', 'myanmarMeaning', 'exampleKorean'].every(
          (key) => text((item.word as unknown as Record<string, unknown>)[key]),
        ) &&
        count(item.count) &&
        count(item.lapses) &&
        Number.isInteger(item.step) &&
        item.step >= -1 &&
        item.step <= 5 &&
        date(item.dueAt) &&
        date(item.reviewedAt),
    ) &&
    Object.values(log.mistakes).every(
      (item) =>
        item &&
        ['id', 'title', 'original', 'corrected', 'explanation'].every((key) =>
          text((item as unknown as Record<string, unknown>)[key]),
        ) &&
        (item.source === 'quiz' || item.source === 'ai') &&
        (item.status === 'open' || item.status === 'practised') &&
        count(item.occurrences) &&
        count(item.practiceCount) &&
        date(item.updatedAt) &&
        (item.source !== 'quiz' ||
          (Array.isArray(item.options) &&
            item.options.every(text) &&
            count(item.correctIndex) &&
            item.correctIndex! < item.options.length)),
    ) &&
    log.reviews.every(
      (item) =>
        item &&
        ['id', 'sourceId', 'topic', 'originalText', 'summary'].every((key) =>
          text((item as unknown as Record<string, unknown>)[key]),
        ) &&
        (item.source === 'ai' || item.source === 'contributors') &&
        (item.questionType === 'Q53' || item.questionType === 'Q54') &&
        item.maxScore === (item.questionType === 'Q53' ? 30 : 50) &&
        Number.isFinite(item.score) &&
        item.score >= 0 &&
        item.score <= item.maxScore &&
        date(item.reviewedAt) &&
        Array.isArray(item.corrections) &&
        item.corrections.every(
          (correction) =>
            correction &&
            text(correction.original) &&
            text(correction.corrected) &&
            text(correction.explanation),
        ),
    ) &&
    log.activities.every(
      (item) =>
        item &&
        ['id', 'title', 'creditKey'].every((key) =>
          text((item as unknown as Record<string, unknown>)[key]),
        ) &&
        ['quiz', 'vocab', 'mistake', 'revision'].includes(item.kind) &&
        date(item.at),
    )
  );
}
function serial<T>(userId: string | undefined, operation: () => Promise<T>): Promise<T> {
  const key = accountKey(KEY, userId);
  const task = (queues.get(key) || Promise.resolve()).then(operation);
  queues.set(
    key,
    task.then(
      () => undefined,
      () => undefined,
    ),
  );
  return task;
}
function remember(log: LearningLog, id: string) {
  log.seen = [id, ...log.seen.filter((value) => value !== id)].slice(0, 3000);
}
function addActivity(log: LearningLog, activity: LearningActivity) {
  log.activities = [activity, ...log.activities].slice(0, 400);
}
function addMistake(
  log: LearningLog,
  input: Omit<LearningMistake, 'occurrences' | 'practiceCount' | 'status'>,
) {
  const previous = log.mistakes[input.id];
  log.mistakes[input.id] = {
    ...input,
    occurrences: (previous?.occurrences || 0) + 1,
    practiceCount: previous?.practiceCount || 0,
    status: 'open',
  };
  log.mistakes = Object.fromEntries(
    Object.values(log.mistakes)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 200)
      .map((item) => [item.id, item]),
  );
}
async function mutate<T>(userId: string | undefined, update: (log: LearningLog) => T): Promise<T> {
  return serial(userId, async () => {
    const log = await load(userId);
    const result = update(log);
    if (!validLearningLog(log))
      throw new Error('Learning records are incomplete and could not be saved.');
    await setAccountItem(KEY, JSON.stringify(log), userId);
    listeners.get(accountKey(KEY, userId))?.forEach((listener) => listener(log));
    return result;
  });
}
function addReview(log: LearningLog, review: WritingReview) {
  const existing = log.reviews.find((item) => item.sourceId === review.sourceId);
  if (existing) return existing;
  const alreadySeen = log.seen.includes(review.sourceId);
  log.reviews = [review, ...log.reviews].slice(0, 30);
  remember(log, review.sourceId);
  if (!alreadySeen)
    review.corrections.forEach((correction) =>
      addMistake(log, {
        id: `writing:${fingerprintText(correction.original + '\n' + correction.corrected)}`,
        source: 'ai',
        title: review.topic,
        ...correction,
        updatedAt: review.reviewedAt,
      }),
    );
  return review;
}
export const LearningLogService = {
  read(userId?: string) {
    return serial(userId, () => load(userId));
  },
  subscribe(userId: string | undefined, listener: (log: LearningLog) => void) {
    const key = accountKey(KEY, userId);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    return () => {
      listeners.get(key)?.delete(listener);
    };
  },
  rateWord(word: ReviewWord, rating: RecallRating, expectedCount: number, userId?: string) {
    return mutate(userId, (log) => {
      const previous = log.schedules[word.id];
      if ((previous?.count || 0) !== expectedCount)
        throw new Error('This card has already been reviewed. Refresh the queue.');
      const next = scheduleReview(word, previous, rating);
      log.schedules[word.id] = next;
      addActivity(log, {
        id: createDraftId(),
        kind: 'vocab',
        title: word.written,
        at: next.reviewedAt,
        creditKey: `vocab:${word.id}`,
      });
      return next;
    });
  },
  recordQuizAnswer(
    step: QuizStepItem,
    index: number,
    answer: number,
    attemptId: string,
    userId?: string,
  ) {
    return mutate(userId, (log) => {
      const question = step.questions[index];
      if (!question || !Number.isInteger(answer) || answer < 0 || answer >= question.options.length)
        throw new Error('Invalid quiz answer');
      const action = `answer:${attemptId}:${index}`;
      if (log.seen.includes(action)) return;
      remember(log, action);
      if (answer !== question.correctIndex)
        addMistake(log, {
          id: `quiz:${step.id}:${fingerprintText(JSON.stringify([question.questionText, question.options, question.correctIndex]))}`,
          source: 'quiz',
          title: step.title,
          original: question.questionText,
          corrected: question.options[question.correctIndex],
          explanation: question.explanation,
          options: [...question.options],
          correctIndex: question.correctIndex,
          updatedAt: new Date().toISOString(),
        });
    });
  },
  completeQuiz(step: QuizStepItem, answers: number[], attemptId: string, userId?: string) {
    return mutate(userId, (log) => {
      const id = `quiz:${attemptId}`;
      if (log.seen.includes(id)) return;
      if (
        answers.length !== step.questions.length ||
        answers.some(
          (answer, index) =>
            !Number.isInteger(answer) ||
            answer < 0 ||
            answer >= step.questions[index].options.length,
        )
      )
        throw new Error('Finish every question first.');
      const score = answers.reduce(
        (sum, answer, index) => sum + Number(answer === step.questions[index].correctIndex),
        0,
      );
      addActivity(log, {
        id,
        kind: 'quiz',
        title: step.title,
        at: new Date().toISOString(),
        creditKey: `quiz:${step.id}`,
        score,
        maxScore: step.questions.length,
      });
      remember(log, id);
    });
  },
  recordAiFeedback(result: AiEvaluationResult, userId?: string): Promise<WritingReview> {
    if (
      (result.questionType !== 'Q53' && result.questionType !== 'Q54') ||
      !validateEssayEvaluation(result, result.questionType) ||
      result.maxScore !== (result.questionType === 'Q53' ? 30 : 50) ||
      typeof result.essayText !== 'string' ||
      !result.essayText.trim() ||
      typeof result.promptTopic !== 'string' ||
      !Number.isFinite(Date.parse(result.evaluatedAt))
    )
      return Promise.reject(new Error('Incomplete feedback cannot be recorded.'));
    return mutate(userId, (log) => {
      const sourceId = `ai:${result.evaluatedAt}:${fingerprintText(result.essayText + result.questionType + result.promptTopic)}`;
      const review: WritingReview = {
        id: createDraftId(),
        source: 'ai',
        sourceId,
        questionType: result.questionType as 'Q53' | 'Q54',
        topic: result.promptTopic,
        originalText: result.essayText,
        score: result.estimatedScore,
        maxScore: result.maxScore,
        summary: result.overallSummary,
        reviewedAt: result.evaluatedAt,
        corrections: result.grammarCorrections.map((item) => ({ ...item })),
      };
      return addReview(log, review);
    });
  },
  importContributorReviews(items: ContributorEssaySubmission[], userId?: string) {
    if (!userId) return Promise.resolve();
    return mutate(userId, (log) => {
      for (const item of items) {
        if (
          item.student_id !== userId ||
          item.status !== 'reviewed' ||
          typeof item.score !== 'number' ||
          !Number.isFinite(item.score) ||
          item.score < 0 ||
          item.max_score !== (item.question_type === 'Q53' ? 30 : 50) ||
          item.score > item.max_score
        )
          continue;
        addReview(log, {
          id: createDraftId(),
          source: 'contributors',
          sourceId: `contributors:${item.id}:${item.reviewed_at || item.created_at}`,
          questionType: item.question_type,
          topic: item.prompt_title,
          originalText: item.content,
          score: item.score,
          maxScore: item.max_score,
          summary: item.overall_comment || item.improvements || item.strengths || '',
          reviewedAt: item.reviewed_at || item.created_at,
          corrections: [],
          referenceText: item.corrected_sample || undefined,
        });
      }
    });
  },
  practiseMistake(id: string, correct: boolean, userId?: string) {
    return mutate(userId, (log) => {
      const item = log.mistakes[id];
      if (!item) throw new Error('This note is no longer available.');
      item.practiceCount++;
      item.status = correct ? 'practised' : 'open';
      item.updatedAt = new Date().toISOString();
      if (correct)
        addActivity(log, {
          id: createDraftId(),
          kind: 'mistake',
          title: item.title,
          at: item.updatedAt,
          creditKey: `mistake:${id}`,
        });
    });
  },
  completeRevision(review: WritingReview, draftId: string, text: string, userId?: string) {
    return mutate(userId, (log) => {
      if (!text.trim() || text.trim() === review.originalText.trim())
        throw new Error('Make a revision before finishing.');
      const id = `revision:${draftId}:${fingerprintText(text)}`;
      if (log.seen.includes(id)) return;
      addActivity(log, {
        id,
        kind: 'revision',
        title: review.topic,
        at: new Date().toISOString(),
        creditKey: `revision:${draftId}`,
        draftId,
        reviewId: review.id,
      });
      remember(log, id);
    });
  },
};
