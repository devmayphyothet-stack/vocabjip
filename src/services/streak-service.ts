import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
const listeners = new Set<StreakListener>();

// Format local date YYYY-MM-DD
function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate difference in days between two YYYY-MM-DD strings
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

let currentState: StreakState = {
  streakDays: 1,
  dailyGoal: 3,
  dailyCompleted: 0,
  lastActiveDate: getLocalDateString(),
  isGoalAchieved: false,
};

function notifyListeners() {
  listeners.forEach((l) => l(currentState));
}

export const StreakService = {
  subscribe(listener: StreakListener) {
    listeners.add(listener);
    listener(currentState);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): StreakState {
    return currentState;
  },

  /**
   * Initialize or update streak upon app open
   */
  async initStreak(userId?: string): Promise<StreakState> {
    const today = getLocalDateString();

    try {
      // 1. Read stored values
      const [storedStreak, storedLastDate, storedGoal, storedCompleted, storedCompletedDate] =
        await Promise.all([
          AsyncStorage.getItem(KEYS.STREAK_DAYS),
          AsyncStorage.getItem(KEYS.LAST_ACTIVE_DATE),
          AsyncStorage.getItem(KEYS.DAILY_GOAL),
          AsyncStorage.getItem(KEYS.DAILY_COMPLETED),
          AsyncStorage.getItem(KEYS.DAILY_COMPLETED_DATE),
        ]);

      let streakDays = storedStreak ? parseInt(storedStreak, 10) : 1;
      let lastActiveDate = storedLastDate || today;
      let dailyGoal = storedGoal ? parseInt(storedGoal, 10) : 3;
      let dailyCompleted = storedCompleted ? parseInt(storedCompleted, 10) : 0;
      let completedDate = storedCompletedDate || today;

      // 2. Check daily completed reset (if date changed)
      if (completedDate !== today) {
        dailyCompleted = 0;
        completedDate = today;
        await AsyncStorage.setItem(KEYS.DAILY_COMPLETED, '0');
        await AsyncStorage.setItem(KEYS.DAILY_COMPLETED_DATE, today);
      }

      // 3. Check streak progression
      if (!storedLastDate) {
        // First time
        streakDays = 1;
        lastActiveDate = today;
      } else {
        const diff = getDaysDifference(storedLastDate, today);
        if (diff === 0) {
          // Same day, streak intact
        } else if (diff === 1) {
          // Exactly 1 day later: consecutive day!
          streakDays += 1;
          lastActiveDate = today;
        } else if (diff > 1) {
          // Missed more than 1 day: streak reset
          streakDays = 1;
          lastActiveDate = today;
        }
      }

      // 4. Save updated local storage
      await Promise.all([
        AsyncStorage.setItem(KEYS.STREAK_DAYS, streakDays.toString()),
        AsyncStorage.setItem(KEYS.LAST_ACTIVE_DATE, lastActiveDate),
        AsyncStorage.setItem(KEYS.DAILY_GOAL, dailyGoal.toString()),
      ]);

      currentState = {
        streakDays,
        dailyGoal,
        dailyCompleted,
        lastActiveDate,
        isGoalAchieved: dailyCompleted >= dailyGoal,
      };

      notifyListeners();

      // 5. Sync to Supabase if logged in
      if (userId) {
        supabase
          .from('profiles')
          .update({
            streak_days: streakDays,
            daily_goal: dailyGoal,
            daily_completed: dailyCompleted,
          })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) console.warn('Supabase streak sync error:', error.message);
          });
      }

      return currentState;
    } catch (e) {
      console.warn('Error in initStreak:', e);
      return currentState;
    }
  },

  /**
   * Record completion of a learning activity (Quiz, Wongoji practice, Vocab review)
   */
  async recordActivity(userId?: string): Promise<StreakState> {
    const today = getLocalDateString();

    try {
      let completed = currentState.dailyCompleted + 1;
      const isGoalAchieved = completed >= currentState.dailyGoal;

      await AsyncStorage.setItem(KEYS.DAILY_COMPLETED, completed.toString());
      await AsyncStorage.setItem(KEYS.DAILY_COMPLETED_DATE, today);

      currentState = {
        ...currentState,
        dailyCompleted: completed,
        isGoalAchieved,
      };

      notifyListeners();

      // Sync to Supabase if logged in
      if (userId) {
        supabase
          .from('profiles')
          .update({
            daily_completed: completed,
            streak_days: currentState.streakDays,
          })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) console.warn('Supabase activity sync error:', error.message);
          });
      }

      return currentState;
    } catch (e) {
      console.warn('Error recording activity:', e);
      return currentState;
    }
  },

  /**
   * Set custom daily goal (e.g. 3, 5, or 10 activities per day)
   */
  async setDailyGoal(newGoal: number, userId?: string): Promise<void> {
    if (newGoal <= 0) return;
    try {
      await AsyncStorage.setItem(KEYS.DAILY_GOAL, newGoal.toString());
      currentState = {
        ...currentState,
        dailyGoal: newGoal,
        isGoalAchieved: currentState.dailyCompleted >= newGoal,
      };
      notifyListeners();

      if (userId) {
        await supabase
          .from('profiles')
          .update({ daily_goal: newGoal })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Error setting daily goal:', e);
    }
  },
};

