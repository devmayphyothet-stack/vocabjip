export type UserRole = 'user' | 'contributor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface VocabRecord {
  id: string;
  spoken: string;
  written: string;
  pronunciation: string;
  category: string;
  myanmar_meaning: string;
  english_meaning: string;
  usage_tip: string;
  example_korean: string;
  example_myanmar: string;
  status: ReviewStatus;
  rejection_reason?: string | null;
  created_by?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  // Join author
  profiles?: {
    display_name: string;
    email: string;
  };
}

export interface PatternRecord {
  id: string;
  question_number: 'Q51' | 'Q52' | 'Q53' | 'Q54';
  title: string;
  myanmar_title: string;
  description: string;
  pattern_formula: string;
  example_korean: string;
  example_myanmar: string;
  key_phrases: string[];
  status: ReviewStatus;
  rejection_reason?: string | null;
  created_by?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export interface EssayPromptRecord {
  id: string;
  type: 'Q53' | 'Q54' | 'statement';
  title: string;
  prompt_text: string;
  sub_questions: string[];
  sample_answer: string;
  scoring_criteria: string;
  status: ReviewStatus;
  rejection_reason?: string | null;
  created_by?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitationRecord {
  id: string;
  code: string;
  invited_email?: string | null;
  role: 'contributor' | 'admin';
  notes?: string | null;
  created_by?: string | null;
  expires_at?: string | null;
  is_used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  created_at: string;
}

export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface FeedbackRecord {
  id: string;
  user_id?: string | null;
  category: string;
  rating: number;
  title: string;
  message: string;
  email?: string | null;
  status: FeedbackStatus;
  admin_notes?: string | null;
  created_at: string;
}

export interface ContributorLeaderboardItem {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  approved_vocabs: number;
  approved_patterns: number;
  approved_quizzes?: number;
  pending_items: number;
  total_score: number;
}

export interface QuizQuestionItem {
  id: number;
  spokenWord: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  exampleSentence: string;
}

export interface QuizTopicRecord {
  id: string;
  title: string;
  myanmar_title: string;
  category: string;
  description: string;
  created_by?: string | null;
  author_name: string;
  author_rank: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export interface QuizStepRecord {
  id: string;
  topic_id: string;
  step_number: number;
  title: string;
  passing_score: number;
  questions: QuizQuestionItem[];
  status: ReviewStatus;
  rejection_reason?: string | null;
  created_by?: string | null;
  author_name: string;
  author_rank: string;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  quiz_topics?: QuizTopicRecord;
  profiles?: {
    display_name: string;
    email: string;
  };
}



