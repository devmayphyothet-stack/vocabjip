export const AVATARS = {
  learner: '📘',
  sprout: '🌱',
  star: '⭐',
  flower: '🌸',
  sun: '☀️',
  pencil: '✏️',
} as const;
export const TARGET_LEVELS = [
  'TOPIK II Level 3',
  'TOPIK II Level 4',
  'TOPIK II Level 5',
  'TOPIK II Level 6',
] as const;
export interface ProfileFields {
  display_name: string;
  avatar_key: string;
  target_level: string;
  daily_goal: number;
  bio: string;
  korean_background: string;
}
export function validateProfile(fields: ProfileFields): ProfileFields {
  const result = {
    ...fields,
    display_name: fields.display_name.trim(),
    bio: fields.bio.trim(),
    korean_background: fields.korean_background.trim(),
  };
  if (!result.display_name || result.display_name.length > 60)
    throw new Error('Display name must be between 1 and 60 characters.');
  if (!Object.prototype.hasOwnProperty.call(AVATARS, result.avatar_key))
    throw new Error('Choose an avatar from the list.');
  if (!TARGET_LEVELS.includes(result.target_level as (typeof TARGET_LEVELS)[number]))
    throw new Error('Choose your target TOPIK level.');
  if (!Number.isInteger(result.daily_goal) || result.daily_goal < 1 || result.daily_goal > 20)
    throw new Error('Daily goal must be a whole number between 1 and 20.');
  if (result.bio.length > 300 || result.korean_background.length > 300)
    throw new Error('Bio and Korean background must each be 300 characters or fewer.');
  return result;
}
