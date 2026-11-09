import type { QuizStepItem } from '@/data/quiz-data';
export interface QuizSession {
  version: 1;
  topicId: string;
  stepId: string;
  title: string;
  questionIndex: number;
  answers: number[];
  fingerprint: string;
  updatedAt: string;
}
export function quizFingerprint(step: QuizStepItem) {
  return JSON.stringify(
    step.questions.map((question) => [
      question.id,
      question.questionText,
      question.options,
      question.correctIndex,
    ]),
  );
}
export function createQuizSession(
  step: QuizStepItem,
  questionIndex: number,
  answers: number[],
): QuizSession {
  return {
    version: 1,
    topicId: step.topicId,
    stepId: step.id,
    title: step.title,
    questionIndex,
    answers: [...answers],
    fingerprint: quizFingerprint(step),
    updatedAt: new Date().toISOString(),
  };
}
export function restoreQuizSession(session: QuizSession, step: QuizStepItem) {
  if (
    !session ||
    session.version !== 1 ||
    session.stepId !== step.id ||
    session.topicId !== step.topicId ||
    session.fingerprint !== quizFingerprint(step) ||
    !Number.isInteger(session.questionIndex) ||
    session.questionIndex < 0 ||
    session.questionIndex >= step.questions.length ||
    !Array.isArray(session.answers)
  )
    return null;
  const index = session.questionIndex;
  if (session.answers.length !== index && session.answers.length !== index + 1) return null;
  if (
    session.answers.some(
      (answer, questionIndex) =>
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= step.questions[questionIndex].options.length,
    )
  )
    return null;
  const submitted = session.answers.length === index + 1;
  return {
    index,
    submitted,
    selectedOption: submitted ? session.answers[index] : null,
    score: session.answers.reduce(
      (total, answer, questionIndex) =>
        total + Number(answer === step.questions[questionIndex].correctIndex),
      0,
    ),
    answers: [...session.answers],
  };
}
