import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountKey, setAccountItem } from '@/lib/account-storage';
import type { QuizSession } from '@/lib/quiz-session';
const KEY = 'learning_session_v1';
const listeners = new Map<string, Set<(session: QuizSession | null) => void>>();
const queues = new Map<string, Promise<unknown>>();
export const LearningSessionService = {
  async read(userId?: string): Promise<QuizSession | null> {
    const pending = queues.get(accountKey(KEY, userId));
    if (pending) await pending;
    const raw = await AsyncStorage.getItem(accountKey(KEY, userId));
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 &&
      typeof value.topicId === 'string' &&
      typeof value.stepId === 'string' &&
      typeof value.title === 'string' &&
      Number.isInteger(value.questionIndex) &&
      Array.isArray(value.answers) &&
      typeof value.fingerprint === 'string' &&
      typeof value.updatedAt === 'string' &&
      Number.isFinite(Date.parse(value.updatedAt))
      ? value
      : null;
  },
  write(session: QuizSession | null, userId?: string): Promise<void> {
    const key = accountKey(KEY, userId);
    const task = (queues.get(key) || Promise.resolve()).then(async () => {
      await setAccountItem(KEY, JSON.stringify(session), userId);
      listeners.get(key)?.forEach((listener) => listener(session));
    });
    queues.set(
      key,
      task.catch(() => {}),
    );
    return task;
  },
  subscribe(userId: string | undefined, listener: (session: QuizSession | null) => void) {
    const key = accountKey(KEY, userId);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    return () => {
      listeners.get(key)?.delete(listener);
    };
  },
};
