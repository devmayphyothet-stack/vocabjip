import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SAVED_VOCAB_IDS: '@vocabjip/saved_vocab_ids',
  SAVED_PATTERN_IDS: '@vocabjip/saved_pattern_ids',
  DRAFTS: '@vocabjip/saved_drafts',
};

export interface SavedDraft {
  id: string;
  type: 'Q53' | 'Q54' | 'statement';
  title: string;
  content: string;
  charCount: number;
  updatedAt: string;
}

interface SavedContextType {
  savedVocabIds: string[];
  savedPatternIds: string[];
  drafts: SavedDraft[];
  isVocabSaved: (id: string) => boolean;
  toggleSaveVocab: (id: string) => Promise<void>;
  isPatternSaved: (id: string) => boolean;
  toggleSavePattern: (id: string) => Promise<void>;
  saveDraft: (draft: Omit<SavedDraft, 'updatedAt'>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedVocabIds, setSavedVocabIds] = useState<string[]>(['v-1', 'v-2']);
  const [savedPatternIds, setSavedPatternIds] = useState<string[]>(['p-1']);
  const [drafts, setDrafts] = useState<SavedDraft[]>([
    {
      id: 'd-1',
      type: 'Q53',
      title: '인터넷 사용 통계 (Internet Usage)',
      content:
        '조사 결과에 따르면 2020년 65%에서 2024년 85%로 크게 증가하였다. 이러한 변화의 원인으로는 스마트폰 보급 확대를 들 수 있다.',
      charCount: 78,
      updatedAt: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    // Load from local storage
    (async () => {
      try {
        const [vocabsJson, patternsJson, draftsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_VOCAB_IDS),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_PATTERN_IDS),
          AsyncStorage.getItem(STORAGE_KEYS.DRAFTS),
        ]);
        if (vocabsJson) setSavedVocabIds(JSON.parse(vocabsJson));
        if (patternsJson) setSavedPatternIds(JSON.parse(patternsJson));
        if (draftsJson) setDrafts(JSON.parse(draftsJson));
      } catch (e) {
        console.warn('Failed to load saved items:', e);
      }
    })();
  }, []);

  const toggleSaveVocab = async (id: string) => {
    setSavedVocabIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_VOCAB_IDS, JSON.stringify(next));
      return next;
    });
  };

  const isVocabSaved = (id: string) => savedVocabIds.includes(id);

  const toggleSavePattern = async (id: string) => {
    setSavedPatternIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_PATTERN_IDS, JSON.stringify(next));
      return next;
    });
  };

  const isPatternSaved = (id: string) => savedPatternIds.includes(id);

  const saveDraft = async (draft: Omit<SavedDraft, 'updatedAt'>) => {
    const updatedDraft: SavedDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    setDrafts((prev) => {
      const filtered = prev.filter((d) => d.id !== draft.id);
      const next = [updatedDraft, ...filtered];
      AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(next));
      return next;
    });
  };

  const deleteDraft = async (id: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(next));
      return next;
    });
  };

  return (
    <SavedContext.Provider
      value={{
        savedVocabIds,
        savedPatternIds,
        drafts,
        isVocabSaved,
        toggleSaveVocab,
        isPatternSaved,
        toggleSavePattern,
        saveDraft,
        deleteDraft,
      }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved(): SavedContextType {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
}

