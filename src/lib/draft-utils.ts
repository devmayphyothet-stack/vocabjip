import * as Crypto from 'expo-crypto';

export const createDraftId = () => Crypto.randomUUID();
export const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface Draft {
  id: string;
  type: 'Q53' | 'Q54' | 'statement';
  title: string;
  content: string;
  charCount: number;
  updatedAt: string;
}

export function mergeDrafts(local: Draft[], remote: Draft[], deleted: string[] = []) {
  const result = new Map<string, Draft>();
  for (const draft of [...local, ...remote]) {
    if (deleted.includes(draft.id)) continue;
    const previous = result.get(draft.id);
    if (!previous || Date.parse(draft.updatedAt) > Date.parse(previous.updatedAt))
      result.set(draft.id, draft);
  }
  return [...result.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
