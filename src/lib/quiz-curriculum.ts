import type { QuizTopicItem, QuizStepItem } from '@/data/quiz-data';
export function isPlayableStep(step: QuizStepItem): boolean {
  return (
    !!step &&
    typeof step.id === 'string' &&
    Array.isArray(step.questions) &&
    step.questions.length > 0 &&
    Number.isInteger(step.passingScore) &&
    step.passingScore >= 1 &&
    step.passingScore <= step.questions.length &&
    step.questions.every(
      (question) =>
        question &&
        typeof question.questionText === 'string' &&
        Array.isArray(question.options) &&
        question.options.length >= 2 &&
        question.options.every((option) => typeof option === 'string') &&
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length,
    )
  );
}
export function playableTopics(topics: QuizTopicItem[]): QuizTopicItem[] {
  return topics
    .filter((topic) => topic && typeof topic.id === 'string' && Array.isArray(topic.steps))
    .map((topic) => ({
      ...topic,
      steps: topic.steps.filter((step) => step.topicId === topic.id && isPlayableStep(step)),
    }))
    .filter((topic) => topic.steps.length > 0);
}
