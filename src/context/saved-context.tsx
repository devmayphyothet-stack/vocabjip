import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

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
  const { user } = useAuth();
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

  // Initial load from local AsyncStorage
  useEffect(() => {
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
        console.warn('Failed to load local saved items:', e);
      }
    })();
  }, []);

  // Sync with Supabase whenever authenticated user changes
  const syncWithSupabase = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      // 1. Fetch cloud saved vocabs
      const { data: cloudVocabs } = await supabase
        .from('saved_vocabs')
        .select('vocab_id')
        .eq('user_id', user.id);

      // 2. Fetch cloud saved patterns
      const { data: cloudPatterns } = await supabase
        .from('saved_patterns')
        .select('pattern_id')
        .eq('user_id', user.id);

      // 3. Fetch cloud drafts
      const { data: cloudDrafts } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Merge cloud vocabs with any local vocabs
      const cloudVocabIds = (cloudVocabs || []).map((r: any) => r.vocab_id);
      const mergedVocabIds = Array.from(new Set([...savedVocabIds, ...cloudVocabIds]));
      setSavedVocabIds(mergedVocabIds);
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_VOCAB_IDS, JSON.stringify(mergedVocabIds));

      // Upload local vocabs that are missing in cloud
      const missingInCloudVocabs = savedVocabIds.filter((id) => !cloudVocabIds.includes(id));
      if (missingInCloudVocabs.length > 0) {
        await supabase.from('saved_vocabs').upsert(
          missingInCloudVocabs.map((vocab_id) => ({
            user_id: user.id,
            vocab_id,
          }))
        );
      }

      // Merge patterns
      const cloudPatternIds = (cloudPatterns || []).map((r: any) => r.pattern_id);
      const mergedPatternIds = Array.from(new Set([...savedPatternIds, ...cloudPatternIds]));
      setSavedPatternIds(mergedPatternIds);
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_PATTERN_IDS, JSON.stringify(mergedPatternIds));

      // Upload local patterns missing in cloud
      const missingInCloudPatterns = savedPatternIds.filter((id) => !cloudPatternIds.includes(id));
      if (missingInCloudPatterns.length > 0) {
        await supabase.from('saved_patterns').upsert(
          missingInCloudPatterns.map((pattern_id) => ({
            user_id: user.id,
            pattern_id,
          }))
        );
      }

      // Merge drafts
      if (cloudDrafts && cloudDrafts.length > 0) {
        const formattedCloudDrafts: SavedDraft[] = cloudDrafts.map((d: any) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          content: d.content || '',
          charCount: d.char_count || 0,
          updatedAt: d.updated_at,
        }));
        setDrafts(formattedCloudDrafts);
        AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(formattedCloudDrafts));
      }
    } catch (e) {
      console.warn('Failed background Supabase sync:', e);
    }
  }, [user, savedVocabIds, savedPatternIds]);

  useEffect(() => {
    if (user) {
      syncWithSupabase();
    }
  }, [user?.id]);

  const toggleSaveVocab = async (id: string) => {
    const isCurrentlySaved = savedVocabIds.includes(id);
    const next = isCurrentlySaved
      ? savedVocabIds.filter((i) => i !== id)
      : [...savedVocabIds, id];

    setSavedVocabIds(next);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_VOCAB_IDS, JSON.stringify(next));

    // Background sync to Supabase
    if (user && isSupabaseConfigured) {
      if (isCurrentlySaved) {
        await supabase
          .from('saved_vocabs')
          .delete()
          .eq('user_id', user.id)
          .eq('vocab_id', id);
      } else {
        await supabase
          .from('saved_vocabs')
          .upsert({ user_id: user.id, vocab_id: id });
      }
    }
  };

  const isVocabSaved = (id: string) => savedVocabIds.includes(id);

  const toggleSavePattern = async (id: string) => {
    const isCurrentlySaved = savedPatternIds.includes(id);
    const next = isCurrentlySaved
      ? savedPatternIds.filter((i) => i !== id)
      : [...savedPatternIds, id];

    setSavedPatternIds(next);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PATTERN_IDS, JSON.stringify(next));

    // Background sync to Supabase
    if (user && isSupabaseConfigured) {
      if (isCurrentlySaved) {
        await supabase
          .from('saved_patterns')
          .delete()
          .eq('user_id', user.id)
          .eq('pattern_id', id);
      } else {
        await supabase
          .from('saved_patterns')
          .upsert({ user_id: user.id, pattern_id: id });
      }
    }
  };

  const isPatternSaved = (id: string) => savedPatternIds.includes(id);

  const saveDraft = async (draft: Omit<SavedDraft, 'updatedAt'>) => {
    const updatedDraft: SavedDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    setDrafts((prevDrafts) => {
      const next = [updatedDraft, ...prevDrafts.filter((d) => d.id !== draft.id)];
      AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(next)).catch(() => {});
      return next;
    });

    // Background sync to Supabase
    if (user && isSupabaseConfigured) {
      await supabase.from('drafts').upsert({
        id: draft.id,
        user_id: user.id,
        type: draft.type,
        title: draft.title,
        content: draft.content,
        char_count: draft.charCount,
        updated_at: updatedDraft.updatedAt,
      });
    }
  };

  const deleteDraft = async (id: string) => {
    setDrafts((prevDrafts) => {
      const next = prevDrafts.filter((d) => d.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(next)).catch(() => {});
      return next;
    });

    // Background delete from Supabase
    if (user && isSupabaseConfigured) {
      await supabase
        .from('drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);
    }
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
