import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { accountKey } from '@/lib/account-storage';

const KEYS = {
  STREAK_DAYS: '@vocabjip:streak_days',
  LAST_ACTIVE_DATE: '@vocabjip:last_active_date',
  DAILY_GOAL: '@vocabjip:daily_goal',
  DAILY_COMPLETED: '@vocabjip:daily_completed',
  DAILY_COMPLETED_DATE: '@vocabjip:daily_completed_date',
};
export interface StreakState {
  streakDays: number;
  dailyGoal: number;
  dailyCompleted: number;
  lastActiveDate: string;
  isGoalAchieved: boolean;
}
type StreakListener = (state: StreakState) => void;
const states = new Map<string, StreakState>();
const listeners = new Map<string, Set<StreakListener>>();
const queues = new Map<string, Promise<unknown>>();
const scope = (userId?: string) => userId || 'guest';
function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const defaults = (): StreakState => ({
  streakDays: 1,
  dailyGoal: 3,
  dailyCompleted: 0,
  lastActiveDate: todayString(),
  isGoalAchieved: false,
});
function serial<T>(userId: string | undefined, operation: () => Promise<T>) {
  const key = scope(userId);
  const promise = (queues.get(key) || Promise.resolve()).then(operation);
  queues.set(
    key,
    promise.catch(() => {}),
  );
  return promise;
}
function publish(state: StreakState, userId?: string) {
  states.set(scope(userId), state);
  listeners.get(scope(userId))?.forEach((listener) => listener(state));
}
async function persist(state: StreakState, userId?: string) {
  await Promise.all(
    [
      [KEYS.STREAK_DAYS, String(state.streakDays)],
      [KEYS.LAST_ACTIVE_DATE, state.lastActiveDate],
      [KEYS.DAILY_GOAL, String(state.dailyGoal)],
      [KEYS.DAILY_COMPLETED, String(state.dailyCompleted)],
      [KEYS.DAILY_COMPLETED_DATE, todayString()],
    ].map(([key, value]) => AsyncStorage.setItem(accountKey(key, userId), value)),
  );
  publish(state, userId);
  if (userId) {
    void Promise.resolve(
      supabase
        .from('profiles')
        .update({
          streak_days: state.streakDays,
          daily_goal: state.dailyGoal,
          daily_completed: state.dailyCompleted,
        })
        .eq('id', userId),
    )
      .then(({ error }) => {
        if (error) console.warn('Progress is saved on this device; cloud sync did not finish.');
      })
      .catch(() => {
        /* Local progress remains available offline. */
      });
  }
}
async function initialize(userId?: string): Promise<StreakState> {
  const today = todayString();
  const [streak, last, goal, completed, completedDate] = await Promise.all(
    Object.values(KEYS).map((key) => AsyncStorage.getItem(accountKey(key, userId))),
  );
  const difference = last
    ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86400000)
    : 0;
  const dailyGoal = Math.max(1, Number(goal) || 3);
  const dailyCompleted = completedDate === today ? Math.max(0, Number(completed) || 0) : 0;
  const state = {
    streakDays: difference > 1 ? 1 : Math.max(1, Number(streak) || 1) + (difference === 1 ? 1 : 0),
    dailyGoal,
    dailyCompleted,
    lastActiveDate: today,
    isGoalAchieved: dailyCompleted >= dailyGoal,
  };
  await persist(state, userId);
  return state;
}
export const StreakService = {
  subscribe(listener: StreakListener, userId?: string) {
    const key = scope(userId);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    listener(this.getState(userId));
    return () => {
      listeners.get(key)?.delete(listener);
    };
  },
  getState(userId?: string) {
    return states.get(scope(userId)) || defaults();
  },
  initStreak(userId?: string) {
    return serial(userId, async () => {
      try {
        return await initialize(userId);
      } catch {
        return this.getState(userId);
      }
    });
  },
  recordActivity(userId?: string) {
    return serial(userId, async () => {
      try {
        const state = await initialize(userId);
        const dailyCompleted = state.dailyCompleted + 1;
        const next = {
          ...state,
          dailyCompleted,
          isGoalAchieved: dailyCompleted >= state.dailyGoal,
        };
        await persist(next, userId);
        return next;
      } catch {
        return this.getState(userId);
      }
    });
  },
  setDailyGoal(newGoal: number, userId?: string) {
    return serial(userId, async () => {
      if (!Number.isInteger(newGoal) || newGoal < 1) return;
      const state = await initialize(userId);
      await persist(
        { ...state, dailyGoal: newGoal, isGoalAchieved: state.dailyCompleted >= newGoal },
        userId,
      );
    });
  },
};
