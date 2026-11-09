import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/auth-context';
import { accountKey, setAccountItem } from '@/lib/account-storage';
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  LearningPreferences,
  CopyKey,
  translate,
} from '@/lib/learning-preferences';

interface PreferencesContext {
  preferences: LearningPreferences;
  updatePreferences: (patch: Partial<LearningPreferences>) => Promise<void>;
  t: (key: CopyKey) => string;
  loadFailed: boolean;
}
const Context = createContext<PreferencesContext | null>(null);
export function LearningPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const latest = useRef(preferences);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(accountKey('learning_preferences_v1', user?.id))
      .then((raw) => {
        if (!active) return;
        const next = parsePreferences(raw ? JSON.parse(raw) : null);
        latest.current = next;
        setPreferences(next);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  const updatePreferences = (patch: Partial<LearningPreferences>) => {
    const operation = queue.current.then(async () => {
      const next = parsePreferences({ ...latest.current, ...patch });
      await setAccountItem('learning_preferences_v1', JSON.stringify(next), user?.id);
      latest.current = next;
      setPreferences(next);
      setLoadFailed(false);
    });
    queue.current = operation.catch(() => {});
    return operation;
  };
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel="Loading learning preferences" />
      </View>
    );
  return (
    <Context.Provider
      value={{
        preferences,
        updatePreferences,
        loadFailed,
        t: (key) => translate(preferences.language, key),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLearningPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('Learning preferences provider is missing');
  return value;
}
