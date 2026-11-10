import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { accountKey, setAccountItem } from '@/lib/account-storage';

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
  activityIds?: string[];
  completedDate?: string;
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
  streakDays: 0,
  dailyGoal: 3,
  dailyCompleted: 0,
  lastActiveDate: '',
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
async function persist(state: StreakState, userId?: string, syncGoal = false) {
  await setAccountItem(
    'progress_v2',
    JSON.stringify({ ...state, completedDate: todayString() }),
    userId,
  );
  await Promise.all(
    [
      [KEYS.STREAK_DAYS, String(state.streakDays)],
      [KEYS.LAST_ACTIVE_DATE, state.lastActiveDate],
      [KEYS.DAILY_GOAL, String(state.dailyGoal)],
      [KEYS.DAILY_COMPLETED, String(state.dailyCompleted)],
      [KEYS.DAILY_COMPLETED_DATE, todayString()],
    ].map(([key, value]) => setAccountItem(key, value, userId)),
  ).catch(() => {
    /* The atomic snapshot above remains authoritative. */
  });
  publish(state, userId);
  if (userId) {
    void Promise.resolve(
      supabase
        .from('profiles')
        .update({
          streak_days: state.streakDays,
          ...(syncGoal ? { daily_goal: state.dailyGoal } : {}),
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
async function initialize(userId?: string, preferredGoal?: number): Promise<StreakState> {
  const today = todayString();
  const [streak, last, goal, completed, completedDate] = await Promise.all(
    Object.values(KEYS).map((key) => AsyncStorage.getItem(accountKey(key, userId))),
  );
  const raw = await AsyncStorage.getItem(accountKey('progress_v2', userId));
  const stored = raw ? (JSON.parse(raw) as StreakState) : null;
  const dailyGoal = Math.max(1, preferredGoal || stored?.dailyGoal || Number(goal) || 3);
  const sameDay = (stored?.completedDate || completedDate) === today;
  const dailyCompleted = sameDay
    ? Math.max(0, stored?.dailyCompleted ?? (Number(completed) || 0))
    : 0;
  const lastActiveDate = stored?.lastActiveDate ?? last ?? '';
  const difference = lastActiveDate
    ? Math.round(
        (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastActiveDate}T00:00:00Z`)) / 86400000,
      )
    : Infinity;
  const state: StreakState = {
    streakDays: difference > 1 ? 0 : Math.max(0, stored?.streakDays ?? (Number(streak) || 0)),
    dailyGoal,
    dailyCompleted,
    lastActiveDate,
    completedDate: today,
    activityIds: sameDay ? stored?.activityIds || [] : [],
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
  initStreak(userId?: string, preferredGoal?: number) {
    return serial(userId, async () => {
      try {
        return await initialize(userId, preferredGoal);
      } catch {
        return this.getState(userId);
      }
    });
  },
  recordActivity(userId?: string, activityId?: string) {
    return serial(userId, async () => {
      try {
        const state = await initialize(userId);
        if (activityId && state.activityIds?.includes(activityId)) return state;
        const dailyCompleted = state.dailyCompleted + 1;
        const today = todayString();
        const difference = state.lastActiveDate
          ? Math.round(
              (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${state.lastActiveDate}T00:00:00Z`)) /
                86400000,
            )
          : Infinity;
        const next = {
          ...state,
          dailyCompleted,
          lastActiveDate: today,
          streakDays:
            difference === 0
              ? Math.max(1, state.streakDays)
              : difference === 1
                ? state.streakDays + 1
                : 1,
          activityIds: activityId
            ? [...(state.activityIds || []), activityId]
            : state.activityIds || [],
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
        true,
      );
    });
  },
};
