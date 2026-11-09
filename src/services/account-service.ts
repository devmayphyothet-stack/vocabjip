import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountKey } from '@/lib/account-storage';
import { supabase, AUTH_STORAGE_KEY } from '@/lib/supabase';

export async function deleteRemoteAccount(password: string, confirmation: string) {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { password, confirmation },
  });
  if (error || data?.deleted !== true) {
    let message = data?.error || 'Account deletion did not finish. Your local data has been kept.';
    if (error?.context instanceof Response) {
      try {
        message = (await error.context.json()).error || message;
      } catch {
        /* Keep the safe fallback. */
      }
    }
    throw new Error(message);
  }
}
export async function removeLocalAccount(userId: string) {
  const prefix = accountKey('', userId);
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(prefix)));
}

export const DELETION_CLEANUP_KEY = '@vocabjip/deletion_cleanup_pending';
export async function completeLocalDeletion(userId: string) {
  await removeLocalAccount(userId);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // A response from an old account must never sign out a newly signed-in account.
  if (!session || session.user.id === userId) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* Clear the disk session below. */
    }
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEY,
      `${AUTH_STORAGE_KEY}-user`,
      `${AUTH_STORAGE_KEY}-code-verifier`,
      '@vocabjip/pending_otp_session',
      '@vocabjip/is_guest',
    ]);
  }
  const cached = await AsyncStorage.getItem('@vocabjip/user_profile');
  if (cached && JSON.parse(cached).id === userId)
    await AsyncStorage.removeItem('@vocabjip/user_profile');
  await AsyncStorage.removeItem(DELETION_CLEANUP_KEY);
}
