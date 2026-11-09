import {
  STARTER_VOCABS,
  STARTER_PATTERNS,
  STARTER_QUIZ_TOPICS,
  STARTER_PROMPTS,
  mergeLessons,
} from '@/data/starter-lessons';
import {
  getCurriculumVocabs,
  getCurriculumPatterns,
  getCurriculumQuizTopics,
  getCurriculumEssayPrompts,
  getCurriculumLastSync,
  syncCurriculumFromCloud,
} from '@/services/curriculum-sync-service';

const initial = {
  vocabularies: STARTER_VOCABS,
  patterns: STARTER_PATTERNS,
  quizTopics: STARTER_QUIZ_TOPICS,
  essayPrompts: STARTER_PROMPTS,
  isLoading: true,
  isSyncing: false,
  updateFailed: false,
  hasDownloadedContent: false,
  lastSyncTime: null as string | null,
};
let state = initial;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;
let syncing: Promise<void> | null = null;
let started = false;
function publish(patch: Partial<typeof state>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}
async function readCache() {
  const [vocabularies, patterns, quizTopics, essayPrompts, lastSyncTime] = await Promise.all([
    getCurriculumVocabs(),
    getCurriculumPatterns(),
    getCurriculumQuizTopics(),
    getCurriculumEssayPrompts(),
    getCurriculumLastSync(),
  ]);
  publish({
    vocabularies: mergeLessons(STARTER_VOCABS, vocabularies),
    patterns: mergeLessons(STARTER_PATTERNS, patterns),
    quizTopics: mergeLessons(STARTER_QUIZ_TOPICS, quizTopics),
    essayPrompts: mergeLessons(STARTER_PROMPTS, essayPrompts),
    lastSyncTime,
    hasDownloadedContent:
      vocabularies.length + patterns.length + quizTopics.length + essayPrompts.length > 0,
  });
}
function ensureLoaded() {
  if (!loading)
    loading = readCache()
      .catch(() => publish({ updateFailed: true }))
      .finally(() => publish({ isLoading: false }));
  return loading;
}
async function runSync(force: boolean) {
  if (syncing) return syncing;
  syncing = (async () => {
    publish({ isSyncing: true });
    try {
      const result = await syncCurriculumFromCloud(force);
      await readCache();
      publish({ updateFailed: !!result.error });
    } catch {
      publish({ updateFailed: true });
    } finally {
      publish({ isSyncing: false });
    }
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}
export const CurriculumStore = {
  getSnapshot: () => state,
  getServerSnapshot: () => initial,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async initialize() {
    await ensureLoaded();
    if (!started) {
      started = true;
      await runSync(false);
    }
  },
  async syncNow() {
    await ensureLoaded();
    await runSync(true);
  },
};
