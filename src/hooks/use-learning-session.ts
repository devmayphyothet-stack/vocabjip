import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import type { QuizSession } from '@/lib/quiz-session';
import { LearningSessionService } from '@/services/learning-session-service';
export function useLearningSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<QuizSession | null>(null);
  useEffect(() => {
    let active = true;
    let changed = false;
    const unsubscribe = LearningSessionService.subscribe(user?.id, (next) => {
      changed = true;
      if (active) setSession(next);
    });
    void LearningSessionService.read(user?.id)
      .then((next) => {
        if (active && !changed) setSession(next);
      })
      .catch(() => {});
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);
  return session;
}
