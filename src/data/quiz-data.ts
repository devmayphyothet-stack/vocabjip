export interface QuizQuestion {
  id: number;
  spokenWord: string;
  questionText: string;
  myanmarQuestionText?: string;
  englishExplanation?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  exampleSentence: string;
}

export interface QuizStepItem {
  id: string;
  topicId: string;
  stepNumber: number;
  title: string;
  passingScore: number; // 3 out of 5 required to unlock next step
  questions: QuizQuestion[];
  authorName: string;
  authorRank: string;
}

export interface QuizTopicItem {
  id: string;
  title: string;
  myanmarTitle: string;
  category: string;
  description: string;
  authorName: string;
  authorRank: string;
  steps: QuizStepItem[];
}

// Static fallback data removed — all quiz topics and steps are dynamically synced from Supabase contributors.
export const QUIZ_TOPICS_DATA: QuizTopicItem[] = [];
