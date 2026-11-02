export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string; // Explanation in Myanmar
}

export interface VocabularySuggestion {
  spokenWord: string;
  academicAlternative: string;
  reason: string; // Explanation in Myanmar
}

export interface AiEvaluationResult {
  questionType: 'Q53' | 'Q54' | 'statement';
  promptTopic: string;
  essayText: string;
  charCount: number;
  estimatedScore: number;
  maxScore: number; // 30 for Q53, 50 for Q54
  overallSummary: string; // In Myanmar
  structureRating: {
    score: number;
    max: number;
    comment: string; // In Myanmar
  };
  contentRating: {
    score: number;
    max: number;
    comment: string;
  };
  languageRating: {
    score: number;
    max: number;
    comment: string;
  };
  strengths: string[];
  improvements: string[];
  grammarCorrections: GrammarCorrection[];
  vocabularySuggestions: VocabularySuggestion[];
  evaluatedAt: string;
}

export type AiErrorType = 'QUOTA' | 'INVALID_KEY' | 'NETWORK' | 'UNKNOWN';

export interface AiEvaluationResponse {
  success: boolean;
  result?: AiEvaluationResult;
  error?: string;
  errorType?: AiErrorType;
}

