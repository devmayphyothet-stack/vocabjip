import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CommunityEssay } from '@/types/community';

const STORAGE_KEYS = {
  COMMUNITY_ESSAYS: '@vocabjip/community_essays',
  LIKED_ESSAY_IDS: '@vocabjip/liked_essay_ids',
};

export const SEED_COMMUNITY_ESSAYS: CommunityEssay[] = [];

export async function fetchCommunityEssays(): Promise<CommunityEssay[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('community_essays')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: CommunityEssay[] = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          authorName: item.author_name,
          type: item.type,
          title: item.title,
          content: item.content,
          scoreEstimate: item.score_estimate || 'AI Estimated',
          likesCount: item.likes_count || 0,
          createdAt: new Date(item.created_at).toLocaleDateString(),
        }));
        await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_ESSAYS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (_) {}
  }

  // Load local offline cache if offline
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_ESSAYS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return [];
}

export async function publishCommunityEssay(
  userId: string,
  authorName: string,
  type: 'Q53' | 'Q54' | 'statement',
  title: string,
  content: string,
  scoreEstimate: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('community_essays').insert({
        user_id: userId,
        author_name: authorName,
        type,
        title,
        content,
        score_estimate: scoreEstimate,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Save to local cache when offline
  try {
    const existing = await fetchCommunityEssays();
    const newEssay: CommunityEssay = {
      id: `essay-${Date.now()}`,
      userId,
      authorName,
      type,
      title,
      content,
      scoreEstimate,
      likesCount: 1,
      createdAt: 'Just now',
    };
    const updated = [newEssay, ...existing];
    await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_ESSAYS, JSON.stringify(updated));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
