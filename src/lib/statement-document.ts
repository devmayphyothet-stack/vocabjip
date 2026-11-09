import { Draft } from './draft-utils';
export const SECTION_IDS = ['background', 'motivation', 'study_plan', 'future_goals'] as const;
export function restoreStatement(draft?: Draft): Record<string, string> {
  const sections = Object.fromEntries(SECTION_IDS.map((id) => [id, '']));
  if (draft?.metadata?.sections) {
    for (const id of SECTION_IDS)
      sections[id] =
        typeof draft.metadata.sections[id] === 'string' ? draft.metadata.sections[id] : '';
  } else if (draft?.content) {
    // Keep old section-only drafts intact, without pretending they contain a full document.
    const titles = [
      'Background & Growth',
      'Motivation for Applying',
      'Study & Research Plan',
      'Future Career Goals',
    ];
    const index = titles.findIndex((title) => draft.title.includes(`(${title})`));
    sections[SECTION_IDS[Math.max(0, index)]] = draft.content;
  }
  return sections;
}
export function statementDocument(
  id: string,
  university: string,
  major: string,
  sections: Record<string, string>,
  currentStep: number,
): Omit<Draft, 'updatedAt'> {
  const content = SECTION_IDS.map((key) => sections[key] || '')
    .filter((text) => text.trim())
    .join('\n\n');
  return {
    id,
    type: 'statement',
    title: `${university} - ${major}`,
    content,
    charCount: content.length,
    metadata: { university, major, sections: { ...sections }, currentStep },
  };
}

export function restoreStatementStep(draft?: Draft) {
  const step = draft?.metadata?.currentStep;
  return typeof step === 'number' && Number.isInteger(step) && step >= 0 && step < 4 ? step : 0;
}
