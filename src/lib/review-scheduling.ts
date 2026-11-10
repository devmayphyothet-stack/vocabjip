import type { RecallRating, WordSchedule, ReviewWord } from '@/types/learning';
const DAYS = [1, 3, 7, 14, 30, 60];
export function scheduleReview(
  word: ReviewWord,
  previous: WordSchedule | undefined,
  rating: RecallRating,
  now = new Date(),
): WordSchedule {
  if (!['again', 'hard', 'good', 'easy'].includes(rating) || !Number.isFinite(now.getTime()))
    throw new Error('Invalid review rating');
  const step =
    rating === 'again'
      ? -1
      : rating === 'hard'
        ? Math.max(-1, (previous?.step ?? -1) - 1)
        : Math.min(DAYS.length - 1, (previous?.step ?? -1) + (rating === 'easy' ? 2 : 1));
  const minutes =
    rating === 'again' ? 10 : (rating === 'hard' ? 1 : DAYS[Math.max(0, step)]) * 1440;
  return {
    word,
    step,
    count: (previous?.count || 0) + 1,
    lapses: (previous?.lapses || 0) + Number(rating === 'again'),
    dueAt: new Date(now.getTime() + minutes * 60000).toISOString(),
    reviewedAt: now.toISOString(),
  };
}
export function fingerprintText(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${text.length}-${hash >>> 0}`;
}
export function applyWritingCorrection(text: string, original: string, corrected: string) {
  if (!original || !corrected || original === corrected)
    throw new Error('This suggestion needs a manual edit.');
  const index = text.indexOf(original);
  if (index < 0)
    throw new Error(
      'The original phrase is no longer in your revision. Edit it manually if needed.',
    );
  if (text.indexOf(original, index + 1) >= 0)
    throw new Error(
      'This phrase appears more than once. Choose the correct place and edit it manually.',
    );
  return text.slice(0, index) + corrected + text.slice(index + original.length);
}
export function localDay(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
