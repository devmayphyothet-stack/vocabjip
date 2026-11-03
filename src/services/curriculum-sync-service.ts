import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { VOCAB_DATA, VocabItem } from '@/data/vocab-data';
import { PATTERNS_DATA, PatternItem } from '@/data/patterns-data';
import { QUIZ_TOPICS_DATA, QuizTopicItem, QuizStepItem } from '@/data/quiz-data';

const STORAGE_KEYS = {
  DYNAMIC_VOCABS: '@vocabjip_dynamic_vocabs',
  DYNAMIC_PATTERNS: '@vocabjip_dynamic_patterns',
  DYNAMIC_QUIZ_TOPICS: '@vocabjip_dynamic_quiz_topics',
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
 * Get all vocabulary items.
 * Offline-first: merges built-in static VOCAB_DATA with cached dynamic words downloaded from Supabase.
 */
export async function getCurriculumVocabs(): Promise<VocabItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_VOCABS);
    if (!cachedStr) {
      return VOCAB_DATA;
    }

    const dynamicVocabs: VocabItem[] = JSON.parse(cachedStr);
    const vocabMap = new Map<string, VocabItem>();

    // 1. Base static data
    VOCAB_DATA.forEach((v) => vocabMap.set(v.id, v));

    // 2. Dynamic approved data from cloud contributors (can override or append)
    dynamicVocabs.forEach((v) => vocabMap.set(v.id, v));

    return Array.from(vocabMap.values());
  } catch {
    return VOCAB_DATA;
  }
}

/**
 * Get all sentence pattern items.
 * Offline-first: merges built-in static PATTERNS_DATA with cached dynamic patterns.
 */
export async function getCurriculumPatterns(): Promise<PatternItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_PATTERNS);
    if (!cachedStr) {
      return PATTERNS_DATA;
    }

    const dynamicPatterns: PatternItem[] = JSON.parse(cachedStr);
    const patternMap = new Map<string, PatternItem>();

    // 1. Base static patterns
    PATTERNS_DATA.forEach((p) => patternMap.set(p.id, p));

    // 2. Dynamic approved patterns from cloud
    dynamicPatterns.forEach((p) => patternMap.set(p.id, p));

    return Array.from(patternMap.values());
  } catch {
    return PATTERNS_DATA;
  }
}

/**
 * Get all quiz topics with their approved steps.
 * Offline-first: merges built-in QUIZ_TOPICS_DATA with approved topics/steps from Supabase.
 */
export async function getCurriculumQuizTopics(): Promise<QuizTopicItem[]> {
  try {
    const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_QUIZ_TOPICS);
    if (!cachedStr) {
      return QUIZ_TOPICS_DATA;
    }

    const dynamicTopics: QuizTopicItem[] = JSON.parse(cachedStr);
    const topicMap = new Map<string, QuizTopicItem>();

    // 1. Base static topics
    QUIZ_TOPICS_DATA.forEach((t) => topicMap.set(t.id, t));

    // 2. Dynamic approved topics from cloud contributors
    dynamicTopics.forEach((dt) => {
      if (dt.steps && dt.steps.length > 0) {
        topicMap.set(dt.id, dt);
      }
    });

    return Array.from(topicMap.values());
  } catch {
    return QUIZ_TOPICS_DATA;
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
    return { synced: false, newVocabsCount: 0, newPatternsCount: 0 };
  }

  try {
    // 1. Check last sync time (throttle to 2 minutes unless forced)
    const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!force && lastSyncStr) {
      const lastSync = new Date(lastSyncStr).getTime();
      const now = Date.now();
      if (now - lastSync < 2 * 60 * 1000) {
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

    if (!vError && cloudVocabs && cloudVocabs.length > 0) {
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

    if (!pError && cloudPatterns && cloudPatterns.length > 0) {
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

    if (!qtError && !qsError && cloudTopics && cloudSteps && cloudSteps.length > 0) {
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

      if (mappedTopics.length > 0) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.DYNAMIC_QUIZ_TOPICS,
          JSON.stringify(mappedTopics)
        );
      }
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

