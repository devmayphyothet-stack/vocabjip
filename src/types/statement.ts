export type StatementStepId = 'background' | 'motivation' | 'study_plan' | 'future_goals';

export interface StatementSectionMeta {
  id: StatementStepId;
  title: string;
  koreanTitle: string;
  myanmarTitle: string;
  guidance: string;
  recommendedChars: string;
  keyQuestions: string[];
  samplePhrases: string[];
}

export interface PersonalStatementData {
  id: string;
  targetUniversity: string;
  targetMajor: string;
  background: string;
  motivation: string;
  studyPlan: string;
  futureGoals: string;
  updatedAt: string;
}

export interface StatementSentenceImprovement {
  original: string;
  enhanced: string;
  reason: string; // Explanation in Myanmar
}

export interface StatementAiFeedback {
  overallFeedback: string; // In Myanmar
  toneScore: number; // 1-10
  clarityScore: number; // 1-10
  professorImpression: string; // In Myanmar: What a Korean professor will think
  strengths: string[];
  keyImprovements: string[];
  sentenceImprovements: StatementSentenceImprovement[];
}

