const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const strings = (value: unknown) => Array.isArray(value) && value.every(nonEmpty);
const objects = (value: unknown, fields: string[]) =>
  Array.isArray(value) &&
  value.every((item) => item && fields.every((field) => nonEmpty(item[field])));
const score = (value: unknown, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

export function validateEssayEvaluation(value: any, questionType: 'Q53' | 'Q54'): boolean {
  if (!value || typeof value !== 'object') return false;
  const maxima = questionType === 'Q53' ? [10, 10, 10] : [15, 20, 15];
  const ratings = [value.structureRating, value.contentRating, value.languageRating];
  return (
    score(value.estimatedScore, questionType === 'Q53' ? 30 : 50) &&
    nonEmpty(value.overallSummary) &&
    ratings.every(
      (rating, index) =>
        rating &&
        rating.max === maxima[index] &&
        score(rating.score, maxima[index]) &&
        nonEmpty(rating.comment),
    ) &&
    Math.abs(ratings.reduce((sum, rating) => sum + rating.score, 0) - value.estimatedScore) <
      0.01 &&
    strings(value.strengths) &&
    strings(value.improvements) &&
    objects(value.grammarCorrections, ['original', 'corrected', 'explanation']) &&
    objects(value.vocabularySuggestions, ['spokenWord', 'academicAlternative', 'reason'])
  );
}
export function validateStatementEvaluation(value: any): boolean {
  return (
    !!value &&
    score(value.toneScore, 10) &&
    score(value.clarityScore, 10) &&
    nonEmpty(value.overallFeedback) &&
    nonEmpty(value.professorImpression) &&
    strings(value.strengths) &&
    strings(value.keyImprovements) &&
    objects(value.sentenceImprovements, ['original', 'enhanced', 'reason'])
  );
}
