export interface PatternItem {
  id: string;
  questionNumber: 'Q51' | 'Q52' | 'Q53' | 'Q54';
  title: string;
  myanmarTitle: string;
  description: string;
  patternFormula: string;
  exampleKorean: string;
  exampleMyanmar: string;
  keyPhrases: string[];
  authorName?: string;
  authorRank?: string;
}

// Static fallback data removed — all sentence patterns are dynamically synced from Supabase contributors.
export const PATTERNS_DATA: PatternItem[] = [];
