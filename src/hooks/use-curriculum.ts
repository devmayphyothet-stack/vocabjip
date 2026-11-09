import { useEffect, useSyncExternalStore } from 'react';
import { CurriculumStore } from '@/services/curriculum-store';

export function useCurriculum() {
  const state = useSyncExternalStore(
    CurriculumStore.subscribe,
    CurriculumStore.getSnapshot,
    CurriculumStore.getServerSnapshot,
  );
  useEffect(() => {
    void CurriculumStore.initialize();
  }, []);
  return {
    ...state,
    syncNow: CurriculumStore.syncNow,
    vocabCount: state.vocabularies.length,
    patternCount: state.patterns.length,
    quizTopicCount: state.quizTopics.length,
    essayPromptCount: state.essayPrompts.length,
  };
}
