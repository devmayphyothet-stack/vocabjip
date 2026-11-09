import AsyncStorage from '@react-native-async-storage/async-storage';

export function accountKey(key: string, userId?: string) {
  return `@vocabjip/accounts/${userId || 'guest'}/${key}`;
}

// Legacy data had no owner field. Use the last cached profile, never the next login.
export async function migrateLegacyStorage() {
  if (await AsyncStorage.getItem('@vocabjip/account_storage_v1')) return;
  const rawProfile = await AsyncStorage.getItem('@vocabjip/user_profile');
  const owner = rawProfile ? JSON.parse(rawProfile).id : undefined;
  const keys = [
    '@vocabjip/saved_vocab_ids',
    '@vocabjip/saved_pattern_ids',
    '@vocabjip/saved_drafts',
    '@vocabjip_quiz_step_progress',
    '@vocabjip/gemini_api_key',
    '@vocabjip/last_evaluation',
    'vocabjip_teacher_essay_reviews_v1',
    '@vocabjip:streak_days',
    '@vocabjip:last_active_date',
    '@vocabjip:daily_goal',
    '@vocabjip:daily_completed',
    '@vocabjip:daily_completed_date',
  ];
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null && (await AsyncStorage.getItem(accountKey(key, owner))) === null) {
      await AsyncStorage.setItem(accountKey(key, owner), value);
    }
    await AsyncStorage.removeItem(key);
  }
  await AsyncStorage.setItem('@vocabjip/account_storage_v1', 'true');
}
