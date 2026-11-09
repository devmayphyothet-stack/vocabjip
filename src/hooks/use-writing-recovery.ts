import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { useSaved, SavedDraft } from '@/context/saved-context';

type WritingDraft = Omit<SavedDraft, 'updatedAt'>;
export function useWritingRecovery() {
  const { saveDraft, retrySync } = useSaved();
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const latest = useRef<WritingDraft | null>(null);
  const version = useRef(0);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = useRef({ saveDraft, retrySync });
  useEffect(() => {
    api.current = { saveDraft, retrySync };
  }, [saveDraft, retrySync]);

  async function flush() {
    if (!latest.current) return;
    const revision = version.current;
    await api.current.saveDraft(latest.current, { deferSync: true });
    if (version.current !== revision) return flush();
    if (mounted.current) setStatus('saved');
    void api.current.retrySync();
  }
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  function update(draft: WritingDraft) {
    latest.current = draft;
    const revision = ++version.current;
    setStatus('saving');
    // Persist locally immediately. Only the network work is debounced.
    const localWrite = api.current.saveDraft(draft, { deferSync: true });
    void localWrite
      .then(() => {
        if (mounted.current && version.current === revision) setStatus('saved');
      })
      .catch(() => {
        if (mounted.current) setStatus('error');
      });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void localWrite.then(() => api.current.retrySync()).catch(() => {});
    }, 800);
  }
  usePreventRemove(status !== 'saved', ({ repeat }) => {
    void flush()
      .then(() => repeat())
      .catch(() =>
        Alert.alert(
          'Your writing is not saved yet',
          'Please retry saving before leaving this screen.',
        ),
      );
  });
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        void flushRef.current().catch(() => {
          if (mounted.current) setStatus('error');
        });
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
      if (latest.current)
        void api.current.saveDraft(latest.current, { deferSync: true }).catch(() => {});
    };
  }, []);
  return { update, flush, status };
}
