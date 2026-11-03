import { useState, useEffect, useCallback } from 'react';
import { VocabItem } from '@/data/vocab-data';
import { PatternItem } from '@/data/patterns-data';
import { QuizTopicItem } from '@/data/quiz-data';
import {
  EssayPromptItem,
  getCurriculumVocabs,
  getCurriculumPatterns,
  getCurriculumQuizTopics,
  getCurriculumEssayPrompts,
  syncCurriculumFromCloud,
  subscribeCurriculumUpdates,
  getCurriculumLastSync,
} from '@/services/curriculum-sync-service';

export function useCurriculum() {
  const [vocabularies, setVocabularies] = useState<VocabItem[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [quizTopics, setQuizTopics] = useState<QuizTopicItem[]>([]);
  const [essayPrompts, setEssayPrompts] = useState<EssayPromptItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load from offline cache
  const loadCurriculum = useCallback(async () => {
    try {
      const [vList, pList, qList, epList, lastSync] = await Promise.all([
        getCurriculumVocabs(),
        getCurriculumPatterns(),
        getCurriculumQuizTopics(),
        getCurriculumEssayPrompts(),
        getCurriculumLastSync(),
      ]);
      setVocabularies(vList);
      setPatterns(pList);
      setQuizTopics(qList);
      setEssayPrompts(epList);
      setLastSyncTime(lastSync);
    } catch (e) {
      console.warn('Error loading cached curriculum:', e);
    }
  }, []);

  // Force sync with cloud
  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncCurriculumFromCloud(true);
      await loadCurriculum();
    } finally {
      setIsSyncing(false);
    }
  }, [loadCurriculum]);

  useEffect(() => {
    // Initial load from cache
    loadCurriculum();

    // Background sync check (force if never synced)
    syncCurriculumFromCloud(true).catch(() => {});

    // Listen for updates from sync service
    const unsubscribe = subscribeCurriculumUpdates(() => {
      loadCurriculum();
    });

    return unsubscribe;
  }, [loadCurriculum]);

  return {
    vocabularies,
    patterns,
    quizTopics,
    essayPrompts,
    isSyncing,
    lastSyncTime,
    syncNow,
    vocabCount: vocabularies.length,
    patternCount: patterns.length,
    quizTopicCount: quizTopics.length,
    essayPromptCount: essayPrompts.length,
  };
}
