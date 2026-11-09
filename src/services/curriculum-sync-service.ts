import { playableTopics } from '@/lib/quiz-curriculum';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { VocabItem } from '@/data/vocab-data';
import { PatternItem } from '@/data/patterns-data';
import { QuizTopicItem, QuizStepItem } from '@/data/quiz-data';

export interface EssayPromptItem {
  id: string;
  type: 'Q53' | 'Q54' | 'statement';
  title: string;
  promptText: string;
  subQuestions: string[];
  sampleAnswer?: string;
  scoringCriteria?: string;
}

const STORAGE_KEYS = {
  DYNAMIC_VOCABS: '@vocabjip_dynamic_vocabs',
  DYNAMIC_PATTERNS: '@vocabjip_dynamic_patterns',
  DYNAMIC_QUIZ_TOPICS: '@vocabjip_dynamic_quiz_topics',
  DYNAMIC_ESSAY_PROMPTS: '@vocabjip_dynamic_essay_prompts',
  LAST_SYNC: '@vocabjip_curriculum_last_sync',
};

// Event listeners for curriculum updates
type CurriculumListener = () => void;
const listeners: Set<CurriculumListener> = new Set();

export function subscribeCurriculumUpdates(callback: CurriculumListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyCurriculumUpdated() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Curriculum update listener error:', e);
    }
  });
}

/**
 * Get all dynamic vocabulary items from cloud cache.
 */
export async function getCurriculumVocabs(): Promise<VocabItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_VOCABS);
    if (!cachedStr) {
      return [];
    }
    const dynamicVocabs: VocabItem[] = JSON.parse(cachedStr);
    return Array.isArray(dynamicVocabs) ? dynamicVocabs : [];
  } catch {
    return [];
  }
}

/**
 * Get all dynamic sentence pattern items from cloud cache.
 */
export async function getCurriculumPatterns(): Promise<PatternItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_PATTERNS);
    if (!cachedStr) {
      return [];
    }
    const dynamicPatterns: PatternItem[] = JSON.parse(cachedStr);
    return Array.isArray(dynamicPatterns) ? dynamicPatterns : [];
  } catch {
    return [];
  }
}

/**
 * Get all dynamic quiz topics with their approved steps from cloud cache.
 */
export async function getCurriculumQuizTopics(): Promise<QuizTopicItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_QUIZ_TOPICS);
    if (!cachedStr) {
      return [];
    }
    const dynamicTopics: QuizTopicItem[] = JSON.parse(cachedStr);
    if (!Array.isArray(dynamicTopics)) return [];
    return playableTopics(dynamicTopics);
  } catch {
    return [];
  }
}

/**
 * Get all dynamic essay prompts from cloud cache.
 */
export async function getCurriculumEssayPrompts(): Promise<EssayPromptItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_ESSAY_PROMPTS);
    if (!cachedStr) {
      return [];
    }
    const dynamicPrompts: EssayPromptItem[] = JSON.parse(cachedStr);
    return Array.isArray(dynamicPrompts) ? dynamicPrompts : [];
  } catch {
    return [];
  }
}

/**
 * Synchronize latest approved curriculum from Supabase cloud.
 * Only downloads approved content submitted by contributors and verified by admins.
 */
export async function syncCurriculumFromCloud(force: boolean = false): Promise<{
  synced: boolean;
  newVocabsCount: number;
  newPatternsCount: number;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { synced: false, newVocabsCount: 0, newPatternsCount: 0, error: 'Updates unavailable' };
  }

  try {
    // 1. Check last sync time (throttle to 30 seconds unless forced)
    const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!force && lastSyncStr) {
      const lastSync = new Date(lastSyncStr).getTime();
      const now = Date.now();
      if (now - lastSync < 30 * 1000) {
        return { synced: false, newVocabsCount: 0, newPatternsCount: 0 };
      }
    }

    let newVocabsCount = 0;
    let newPatternsCount = 0;

    // 2. Fetch approved vocabularies
    const { data: cloudVocabs, error: vError } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (!vError && cloudVocabs) {
      const mappedVocabs: VocabItem[] = cloudVocabs.map((row: any) => ({
        id: row.id,
        spoken: row.spoken,
        written: row.written,
        pronunciation: row.pronunciation || '',
        category: row.category as any,
        myanmarMeaning: row.myanmar_meaning,
        englishMeaning: row.english_meaning,
        usageTip: row.usage_tip || '',
        exampleSentence: {
          korean: row.example_korean,
          myanmar: row.example_myanmar,
        },
        authorName: row.author_name || 'VocabJip Educator',
        authorRank: row.author_rank || 'Contributor',
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.DYNAMIC_VOCABS,
        JSON.stringify(mappedVocabs)
      );
      newVocabsCount = mappedVocabs.length;
    }

    // 3. Fetch approved sentence patterns
    const { data: cloudPatterns, error: pError } = await supabase
      .from('sentence_patterns')
      .select('*')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (!pError && cloudPatterns) {
      const mappedPatterns: PatternItem[] = cloudPatterns.map((row: any) => ({
        id: row.id,
        questionNumber: row.question_number,
        title: row.title,
        myanmarTitle: row.myanmar_title,
        description: row.description,
        patternFormula: row.pattern_formula,
        exampleKorean: row.example_korean,
        exampleMyanmar: row.example_myanmar,
        keyPhrases: row.key_phrases || [],
        authorName: row.author_name || 'VocabJip Educator',
        authorRank: row.author_rank || 'Contributor',
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.DYNAMIC_PATTERNS,
        JSON.stringify(mappedPatterns)
      );
      newPatternsCount = mappedPatterns.length;
    }

    // 3b. Fetch approved quiz steps and their parent quiz topics
    const [{ data: cloudTopics, error: qtError }, { data: cloudSteps, error: qsError }] =
      await Promise.all([
        supabase.from('quiz_topics').select('*').order('created_at', { ascending: true }),
        supabase
          .from('quiz_steps')
          .select('*')
          .eq('status', 'approved')
          .order('step_number', { ascending: true }),
      ]);

    if (!qtError && !qsError && cloudTopics && cloudSteps) {
      const stepsByTopic = new Map<string, QuizStepItem[]>();

      cloudSteps.forEach((row: any) => {
        const list = stepsByTopic.get(row.topic_id) || [];
        list.push({
          id: row.id,
          topicId: row.topic_id,
          stepNumber: row.step_number,
          title: row.title,
          passingScore: row.passing_score || 3,
          questions: Array.isArray(row.questions) ? row.questions : [],
          authorName: row.author_name || 'VocabJip Educator',
          authorRank: row.author_rank || 'Contributor',
        });
        stepsByTopic.set(row.topic_id, list);
      });

      const mappedTopics: QuizTopicItem[] = cloudTopics
        .map((t: any) => {
          const approvedSteps = (stepsByTopic.get(t.id) || []).sort(
            (a, b) => a.stepNumber - b.stepNumber
          );
          return {
            id: t.id,
            title: t.title,
            myanmarTitle: t.myanmar_title,
            category: t.category,
            description: t.description || '',
            authorName: t.author_name || 'VocabJip Educator',
            authorRank: t.author_rank || 'Contributor',
            steps: approvedSteps,
          };
        })
        .filter((t) => t.steps.length > 0);

      await AsyncStorage.setItem(
        STORAGE_KEYS.DYNAMIC_QUIZ_TOPICS,
        JSON.stringify(mappedTopics)
      );
    }

    // 3c. Fetch approved essay prompts
    const { data: cloudPrompts, error: epError } = await supabase
      .from('essay_prompts')
      .select('*')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (!epError && cloudPrompts) {
      const mappedPrompts: EssayPromptItem[] = cloudPrompts.map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        promptText: row.prompt_text,
        subQuestions: row.sub_questions || [],
        sampleAnswer: row.sample_answer || undefined,
        scoringCriteria: row.scoring_criteria || undefined,
      }));
      await AsyncStorage.setItem(
        STORAGE_KEYS.DYNAMIC_ESSAY_PROMPTS,
        JSON.stringify(mappedPrompts)
      );
    }

    const partialError = vError || pError || qtError || qsError || epError;
    if (partialError) {
      notifyCurriculumUpdated();
      return { synced: false, newVocabsCount, newPatternsCount, error: 'Some lessons could not be updated. Available lessons have been kept.' };
    }

    // 4. Update last sync time
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    // Notify listeners so UI updates automatically
    notifyCurriculumUpdated();

    return {
      synced: true,
      newVocabsCount,
      newPatternsCount,
    };
  } catch (err: any) {
    console.warn('Curriculum sync error:', err);
    return {
      synced: false,
      newVocabsCount: 0,
      newPatternsCount: 0,
      error: err?.message || 'Sync failed',
    };
  }
}

/**
 * Get last sync timestamp
 */
export async function getCurriculumLastSync(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}
