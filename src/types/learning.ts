export type RecallRating = 'again' | 'hard' | 'good' | 'easy';
export interface ReviewWord {
  id: string;
  spoken: string;
  written: string;
  englishMeaning: string;
  myanmarMeaning: string;
  exampleKorean: string;
}
export interface WordSchedule {
  word: ReviewWord;
  step: number;
  count: number;
  lapses: number;
  dueAt: string;
  reviewedAt: string;
}
export interface LearningMistake {
  id: string;
  source: 'quiz' | 'ai';
  title: string;
  original: string;
  corrected: string;
  explanation: string;
  options?: string[];
  correctIndex?: number;
  occurrences: number;
  practiceCount: number;
  status: 'open' | 'practised';
  updatedAt: string;
}
export interface WritingReview {
  id: string;
  source: 'ai' | 'contributors';
  sourceId: string;
  questionType: 'Q53' | 'Q54';
  topic: string;
  originalText: string;
  score: number;
  maxScore: number;
  summary: string;
  reviewedAt: string;
  corrections: { original: string; corrected: string; explanation: string }[];
  referenceText?: string;
}
export interface LearningActivity {
  id: string;
  kind: 'vocab' | 'quiz' | 'revision' | 'mistake';
  title: string;
  at: string;
  creditKey: string;
  score?: number;
  maxScore?: number;
  draftId?: string;
  reviewId?: string;
}
export interface LearningLog {
  version: 1;
  schedules: Record<string, WordSchedule>;
  mistakes: Record<string, LearningMistake>;
  reviews: WritingReview[];
  activities: LearningActivity[];
  seen: string[];
}
