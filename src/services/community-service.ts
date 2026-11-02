import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CommunityEssay } from '@/types/community';

const STORAGE_KEYS = {
  COMMUNITY_ESSAYS: '@vocabjip/community_essays',
  LIKED_ESSAY_IDS: '@vocabjip/liked_essay_ids',
};

export const SEED_COMMUNITY_ESSAYS: CommunityEssay[] = [
  {
    id: 'c-1',
    userId: 'user-hnin',
    authorName: 'Hnin • TOPIK learner',
    type: 'Q54',
    title: '배움의 가치와 평생 교육 (The Value of Learning)',
    content: `현대 사회에서 평생 교육은 개인의 발전뿐만 아니라 국가 경쟁력을 좌우하는 중요한 요소로 대두되고 있다. 기술의 발전 속도가 빨라지면서 과거에 배운 지식만으로는 급변하는 시대를 살아가기에 한계가 있기 때문이다.

첫째, 끊임없는 배움은 개인의 자아실현과 삶의 만족도를 높여 준다. 새로운 지식을 습득하고 시야를 넓히는 과정에서 인간은 성취감을 느끼며 더 나은 미래를 설계할 수 있다.
둘째, 사회적 차원에서도 고령화 사회에 대응하고 생산성을 유지하기 위해 지속적인 재교육이 필수적이다.

따라서 평생 교육을 개인의 몫으로만 남겨둘 것이 아니라, 누구나 쉽게 접근할 수 있도록 정부 차원의 교육 플랫폼 구축과 제도적 지원이 반드시 병행되어야 한다.`,
    scoreEstimate: '37 / 50',
    likesCount: 24,
    createdAt: '2 days ago',
  },
  {
    id: 'c-2',
    userId: 'user-thura',
    authorName: 'Thura • TOPIK Level 5 Candidate',
    type: 'Q53',
    title: '인터넷 이용 현황 및 통계 분석 (Internet Usage Trends)',
    content: `조사 기관의 통계에 따르면 국내 인터넷 이용률은 2015년 65%에서 2024년 85%로 지난 10년간 약 20%p 크게 증가하였다. 이러한 변화의 주된 원인으로는 스마트폰 보급의 대중화와 고속 무선 네트워크 인프라 확충을 들 수 있다. 또한 비대면 온라인 서비스의 활성화 역시 이용률 증가를 견인한 것으로 분석된다.`,
    scoreEstimate: '26 / 30',
    likesCount: 19,
    createdAt: '4 days ago',
  },
  {
    id: 'c-3',
    userId: 'user-may',
    authorName: 'May • GKS Scholar',
    type: 'statement',
    title: '서울대학교 컴퓨터공학부 지원 동기 (Motivation for SNU)',
    content: `저는 미얀마에서 소프트웨어 개발을 공부하며 IT 기술이 개발도상국의 교육 격차를 획기적으로 줄일 수 있다는 가능성을 보았습니다. 세계 최고 수준의 연구 인프라와 인공지능 연구진을 보유한 서울대학교 컴퓨터공학부에서 선진 지식을 익히고, 향후 동남아시아의 교육 기술 발전에 기여하는 엔지니어가 되고자 지원하였습니다.`,
    scoreEstimate: '9 / 10',
    likesCount: 31,
    createdAt: '1 week ago',
  },
];

export async function fetchCommunityEssays(): Promise<CommunityEssay[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('community_essays')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
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
      }
    } catch (_) {}
  }

  // Load local cache or seed essays
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_ESSAYS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return SEED_COMMUNITY_ESSAYS;
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

  // Save to local cache
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
