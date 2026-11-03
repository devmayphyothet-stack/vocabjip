export interface VocabItem {
  id: string;
  spoken: string; // Everyday spoken Korean
  written: string; // Academic written Korean for TOPIK
  pronunciation: string;
  category:
    | 'Cause & Effect'
    | 'Contrast'
    | 'Society'
    | 'Education'
    | 'Economy'
    | 'Environment'
    | 'Technology'
    | 'General'
    | string;
  myanmarMeaning: string; // Myanmar explanation
  englishMeaning: string;
  usageTip: string; // TOPIK writing rule/tip
  exampleSentence: {
    korean: string;
    myanmar: string;
  };
  authorName?: string;
  authorRank?: string;
  isSaved?: boolean;
}

// Static fallback data removed — all vocabularies are dynamically synced from Supabase contributors.
export const VOCAB_DATA: VocabItem[] = [];
