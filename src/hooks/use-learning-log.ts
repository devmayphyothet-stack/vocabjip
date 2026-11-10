import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { emptyLearningLog, LearningLogService } from '@/services/learning-log-service';
export function useLearningLog() {
  const { user } = useAuth();
  const [log, setLog] = useState(emptyLearningLog);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => {
    try {
      setLog(await LearningLogService.read(user?.id));
      setError('');
    } catch {
      setError('Learning history could not be opened. Your saved records have been kept.');
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    let active = true;
    let changed = false;
    const unsubscribe = LearningLogService.subscribe(user?.id, (next) => {
      changed = true;
      if (active) {
        setLog(next);
        setError('');
      }
    });
    void LearningLogService.read(user?.id)
      .then((next) => {
        if (active && !changed) setLog(next);
      })
      .catch(() => {
        if (active)
          setError('Learning history could not be opened. Your saved records have been kept.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);
  return { log, ready, error, refresh };
}
