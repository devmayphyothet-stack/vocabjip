import type { Draft } from '@/lib/draft-utils';
import type { QuizSession } from '@/lib/quiz-session';
import type { StudyFocus } from '@/lib/learning-preferences';
export function nextLearningAction(
  drafts: Draft[],
  session: QuizSession | null,
  focus: StudyFocus,
  minutes: number,
  firstVocabId?: string,
) {
  const draft = [...drafts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  if (session && (!draft || Date.parse(session.updatedAt) >= Date.parse(draft.updatedAt)))
    return {
      label: 'resumeQuiz' as const,
      title: session.title,
      pathname: '/modal/quiz' as const,
      params: { resume: '1' },
    };
  if (draft)
    return {
      label: 'continueWriting' as const,
      title: draft.title,
      pathname:
        draft.type === 'statement'
          ? ('/modal/statement-editor' as const)
          : ('/modal/wongoji-editor' as const),
      params: { draftId: draft.id },
    };
  if (focus === 'writing')
    return {
      label: 'writing' as const,
      title: '',
      pathname: '/modal/wongoji-editor' as const,
      params: { durationMinutes: String(minutes) },
    };
  if (focus === 'quiz')
    return { label: 'quiz' as const, title: '', pathname: '/modal/quiz' as const, params: {} };
  return {
    label: 'vocab' as const,
    title: '',
    pathname: firstVocabId ? ('/modal/vocab-detail' as const) : ('/(tabs)/learn' as const),
    params: firstVocabId ? { id: firstVocabId } : {},
  };
}
