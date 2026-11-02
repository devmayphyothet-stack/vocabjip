import { useState, useEffect, useCallback } from 'react';
import { VocabItem, VOCAB_DATA } from '@/data/vocab-data';
import { PatternItem, PATTERNS_DATA } from '@/data/patterns-data';
import {
  getCurriculumVocabs,
  getCurriculumPatterns,
  syncCurriculumFromCloud,
  subscribeCurriculumUpdates,
  getCurriculumLastSync,
} from '@/services/curriculum-sync-service';

export function useCurriculum() {
  const [vocabularies, setVocabularies] = useState<VocabItem[]>(VOCAB_DATA);
  const [patterns, setPatterns] = useState<PatternItem[]>(PATTERNS_DATA);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load from offline cache
  const loadCurriculum = useCallback(async () => {
    try {
      const [vList, pList, lastSync] = await Promise.all([
        getCurriculumVocabs(),
        getCurriculumPatterns(),
        getCurriculumLastSync(),
      ]);
      setVocabularies(vList);
      setPatterns(pList);
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

    // Background sync check
    syncCurriculumFromCloud(false).catch(() => {});

    // Listen for updates from sync service
    const unsubscribe = subscribeCurriculumUpdates(() => {
      loadCurriculum();
    });

    return unsubscribe;
  }, [loadCurriculum]);

  return {
    vocabularies,
    patterns,
    isSyncing,
    lastSyncTime,
    syncNow,
    vocabCount: vocabularies.length,
    patternCount: patterns.length,
  };
}

