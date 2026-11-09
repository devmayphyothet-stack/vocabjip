import { useEffect, useState, useCallback } from 'react';
import { StreakService, StreakState } from '@/services/streak-service';
import { useAuth } from '@/context/auth-context';

export function useDailyStreak() {
  const { user } = useAuth();
  const [state, setState] = useState<StreakState>(StreakService.getState(user?.id));

  useEffect(() => {
    // 1. Initialize streak with user id if available
    StreakService.initStreak(user?.id);

    // 2. Subscribe to real-time updates
    const unsubscribe = StreakService.subscribe((newState) => {
      setState(newState);
    }, user?.id);

    return unsubscribe;
  }, [user?.id]);

  const recordActivity = useCallback(() => {
    return StreakService.recordActivity(user?.id);
  }, [user?.id]);

  const setDailyGoal = useCallback(
    (newGoal: number) => {
      return StreakService.setDailyGoal(newGoal, user?.id);
    },
    [user?.id]
  );

  return {
    streakDays: state.streakDays,
    dailyGoal: state.dailyGoal,
    dailyCompleted: state.dailyCompleted,
    isGoalAchieved: state.isGoalAchieved,
    lastActiveDate: state.lastActiveDate,
    recordActivity,
    setDailyGoal,
  };
}

