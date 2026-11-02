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

