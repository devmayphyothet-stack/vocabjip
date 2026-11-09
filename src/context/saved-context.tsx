import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, ActivityIndicator, View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { accountKey } from '@/lib/account-storage';
import { createDraftId, Draft, isUuid, mergeDrafts } from '@/lib/draft-utils';

export type SavedDraft = Draft;
type SyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'error';
interface SavedState {
  revision: number;
  savedVocabIds: string[];
  savedPatternIds: string[];
  drafts: SavedDraft[];
  vocabChanges: Record<string, boolean>;
  patternChanges: Record<string, boolean>;
  pendingDraftIds: string[];
  deletedDraftIds: string[];
}
const emptyState = (): SavedState => ({
  revision: 0,
  savedVocabIds: [],
  savedPatternIds: [],
  drafts: [],
  vocabChanges: {},
  patternChanges: {},
  pendingDraftIds: [],
  deletedDraftIds: [],
});
interface SavedContextType extends Pick<
  SavedState,
  'savedVocabIds' | 'savedPatternIds' | 'drafts'
> {
  syncStatus: SyncStatus;
  hasGuestItems: boolean;
  importGuestItems: () => Promise<void>;
  retrySync: () => Promise<void>;
  isVocabSaved: (id: string) => boolean;
  toggleSaveVocab: (id: string) => Promise<void>;
  isPatternSaved: (id: string) => boolean;
  toggleSavePattern: (id: string) => Promise<void>;
  saveDraft: (draft: Omit<SavedDraft, 'updatedAt'>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
}
const SavedContext = createContext<SavedContextType | undefined>(undefined);

async function loadState(userId?: string): Promise<SavedState> {
  const raw = await AsyncStorage.getItem(accountKey('collection_v1', userId));
  if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  const keys = [
    '@vocabjip/saved_vocab_ids',
    '@vocabjip/saved_pattern_ids',
    '@vocabjip/saved_drafts',
  ];
  const [vocabs, patterns, drafts] = await Promise.all(
    keys.map((key) => AsyncStorage.getItem(accountKey(key, userId))),
  );
  const state = emptyState();
  state.savedVocabIds = vocabs ? JSON.parse(vocabs) : [];
  state.savedPatternIds = patterns ? JSON.parse(patterns) : [];
  state.drafts = (drafts ? JSON.parse(drafts) : []).map((draft: Draft) => ({
    ...draft,
    id: isUuid(draft.id) ? draft.id : createDraftId(),
  }));
  state.pendingDraftIds = state.drafts.map((d) => d.id);
  state.vocabChanges = Object.fromEntries(state.savedVocabIds.map((id) => [id, true]));
  state.patternChanges = Object.fromEntries(state.savedPatternIds.map((id) => [id, true]));
  await AsyncStorage.setItem(accountKey('collection_v1', userId), JSON.stringify(state));
  return state;
}
const hasPending = (s: SavedState) =>
  s.pendingDraftIds.length +
    s.deletedDraftIds.length +
    Object.keys(s.vocabChanges).length +
    Object.keys(s.patternChanges).length >
  0;

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const storageKey = accountKey('collection_v1', userId);
  const [state, setState] = useState<SavedState>(emptyState);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [hasGuestItems, setHasGuestItems] = useState(false);
  const current = useRef(state);
  const mounted = useRef(true);
  const syncInFlight = useRef<Promise<void> | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.current.then(operation);
    queue.current = result.catch(() => {});
    return result;
  }
  async function persist(next: SavedState) {
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    current.current = next;
    if (mounted.current) setState(next);
  }
  const retrySync = (): Promise<void> => {
    if (!userId || !isSupabaseConfigured || !mounted.current) return Promise.resolve();
    if (syncInFlight.current) return syncInFlight.current;
    let changedDuringSync = false;
    const work = async () => {
      setSyncStatus('syncing');
      const next: SavedState = await enqueue(async () =>
        JSON.parse(JSON.stringify(current.current)),
      );
      const baselineRevision = next.revision;
      try {
        for (const [table, changes, column] of [
          ['saved_vocabs', next.vocabChanges, 'vocab_id'],
          ['saved_patterns', next.patternChanges, 'pattern_id'],
        ] as const) {
          for (const [id, saved] of Object.entries(changes)) {
            const result = saved
              ? await supabase
                  .from(table)
                  .upsert({ user_id: userId, [column]: id }, { onConflict: `user_id,${column}` })
              : await supabase.from(table).delete().eq('user_id', userId).eq(column, id);
            if (result.error) throw result.error;
            delete changes[id];
          }
        }
        for (const id of [...next.deletedDraftIds]) {
          const { error } = await supabase
            .from('drafts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
          if (error) throw error;
          next.deletedDraftIds = next.deletedDraftIds.filter((value) => value !== id);
        }
        for (const id of [...next.pendingDraftIds]) {
          const draft = next.drafts.find((d) => d.id === id);
          if (!draft) continue;
          const { data, error } = await supabase.rpc('save_draft_if_newer', {
            draft_id: id,
            draft_type: draft.type,
            draft_title: draft.title,
            draft_content: draft.content,
            draft_char_count: draft.charCount,
            draft_updated_at: draft.updatedAt,
          });
          if (error) throw error;
          next.pendingDraftIds = next.pendingDraftIds.filter((value) => value !== id);
          if (data === false) {
            // Keep a separate copy rather than discard writing when another device saved a newer version.
            const recovered = {
              ...draft,
              id: createDraftId(),
              title: `${draft.title} (Recovered copy)`,
              updatedAt: new Date().toISOString(),
            };
            next.drafts = [...next.drafts.filter((d) => d.id !== id), recovered];
            next.pendingDraftIds.push(recovered.id);
          }
        }
        const [vocabs, patterns, drafts] = await Promise.all([
          supabase.from('saved_vocabs').select('vocab_id').eq('user_id', userId),
          supabase.from('saved_patterns').select('pattern_id').eq('user_id', userId),
          supabase.from('drafts').select('*').eq('user_id', userId),
        ]);
        if (vocabs.error || patterns.error || drafts.error)
          throw vocabs.error || patterns.error || drafts.error;
        next.savedVocabIds = vocabs.data.map((row) => row.vocab_id);
        next.savedPatternIds = patterns.data.map((row) => row.pattern_id);
        next.drafts = mergeDrafts(
          next.drafts.filter((d) => next.pendingDraftIds.includes(d.id)),
          drafts.data.map((row) => ({
            id: row.id,
            type: row.type,
            title: row.title,
            content: row.content || '',
            charCount: row.char_count || 0,
            updatedAt: row.updated_at,
          })),
          next.deletedDraftIds,
        );
        await enqueue(async () => {
          changedDuringSync = current.current.revision !== baselineRevision;
          if (!changedDuringSync) await persist(next);
          if (mounted.current)
            setSyncStatus(changedDuringSync || hasPending(next) ? 'pending' : 'synced');
        });
      } catch {
        // Persist successful operations and leave the rest queued for retry.
        await enqueue(async () => {
          changedDuringSync = current.current.revision !== baselineRevision;
          try {
            if (!changedDuringSync) await persist(next);
          } catch {
            /* Keep the previous local snapshot. */
          }
          if (mounted.current) setSyncStatus('error');
        });
      }
    };
    syncInFlight.current = work().finally(() => {
      syncInFlight.current = null;
      if (changedDuringSync && mounted.current) void retrySync();
    });
    return syncInFlight.current;
  };

  useEffect(() => {
    mounted.current = true;
    void enqueue(async () => {
      try {
        await persist(await loadState(userId));
        if (userId) {
          const guest = await loadState();
          if (mounted.current)
            setHasGuestItems(
              guest.drafts.length + guest.savedVocabIds.length + guest.savedPatternIds.length > 0,
            );
        }
        if (mounted.current) setReady(true);
      } catch {
        if (mounted.current) {
          setLoadError(true);
          setSyncStatus('error');
        }
      }
    }).then(() => retrySync());
    const subscription = AppState.addEventListener('change', (value) => {
      if (value === 'active') void retrySync();
    });
    const interval = setInterval(() => {
      if (hasPending(current.current)) void retrySync();
    }, 30000);
    return () => {
      mounted.current = false;
      subscription.remove();
      clearInterval(interval);
    };
    // Provider is remounted when the account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  const change = async (update: (previous: SavedState) => SavedState) => {
    try {
      await enqueue(async () => {
        await persist({ ...update(current.current), revision: current.current.revision + 1 });
        if (mounted.current) setSyncStatus(userId ? 'pending' : 'local');
      });
    } catch {
      setSyncStatus('error');
      throw new Error('Could not save on this device. Please try again before closing.');
    }
    void retrySync();
  };
  const toggle = (id: string, kind: 'vocab' | 'pattern') =>
    change((previous) => {
      const list = kind === 'vocab' ? 'savedVocabIds' : 'savedPatternIds';
      const changes = kind === 'vocab' ? 'vocabChanges' : 'patternChanges';
      const saved = !previous[list].includes(id);
      return {
        ...previous,
        [list]: saved ? [...previous[list], id] : previous[list].filter((value) => value !== id),
        [changes]: { ...previous[changes], [id]: saved },
      };
    });
  const saveDraft = (draft: Omit<SavedDraft, 'updatedAt'>) =>
    change((previous) => {
      if (!isUuid(draft.id)) throw new Error('Invalid draft ID');
      const updated = { ...draft, updatedAt: new Date().toISOString() };
      return {
        ...previous,
        drafts: [updated, ...previous.drafts.filter((d) => d.id !== draft.id)],
        pendingDraftIds: [...new Set([...previous.pendingDraftIds, draft.id])],
        deletedDraftIds: previous.deletedDraftIds.filter((id) => id !== draft.id),
      };
    });
  const deleteDraft = (id: string) =>
    change((previous) => ({
      ...previous,
      drafts: previous.drafts.filter((d) => d.id !== id),
      pendingDraftIds: previous.pendingDraftIds.filter((value) => value !== id),
      deletedDraftIds: [...new Set([...previous.deletedDraftIds, id])],
    }));
  const importGuestItems = async () => {
    if (!userId) return;
    const guest = await loadState();
    await change((previous) => ({
      ...previous,
      savedVocabIds: [...new Set([...previous.savedVocabIds, ...guest.savedVocabIds])],
      savedPatternIds: [...new Set([...previous.savedPatternIds, ...guest.savedPatternIds])],
      drafts: mergeDrafts(previous.drafts, guest.drafts),
      vocabChanges: {
        ...previous.vocabChanges,
        ...Object.fromEntries(guest.savedVocabIds.map((id) => [id, true])),
      },
      patternChanges: {
        ...previous.patternChanges,
        ...Object.fromEntries(guest.savedPatternIds.map((id) => [id, true])),
      },
      pendingDraftIds: [
        ...new Set([...previous.pendingDraftIds, ...guest.drafts.map((d) => d.id)]),
      ],
    }));
    await AsyncStorage.setItem(accountKey('collection_v1'), JSON.stringify(emptyState()));
    setHasGuestItems(false);
  };
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {loadError ? (
          <>
            <Text>Could not open your saved items. Your data has not been replaced.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setLoadError(false);
                setLoadAttempt((value) => value + 1);
              }}
              style={{ padding: 16 }}
            >
              <Text>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading your saved items" />
        )}
      </View>
    );
  return (
    <SavedContext.Provider
      value={{
        ...state,
        syncStatus,
        hasGuestItems,
        importGuestItems,
        retrySync,
        isVocabSaved: (id) => state.savedVocabIds.includes(id),
        isPatternSaved: (id) => state.savedPatternIds.includes(id),
        toggleSaveVocab: (id) =>
          toggle(id, 'vocab').catch((error) =>
            Alert.alert('Could not save bookmark', error.message),
          ),
        toggleSavePattern: (id) =>
          toggle(id, 'pattern').catch((error) =>
            Alert.alert('Could not save bookmark', error.message),
          ),
        saveDraft,
        deleteDraft,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}
export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within a SavedProvider');
  return context;
}
