import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCurriculum } from '@/hooks/use-curriculum';
import { supabase } from '@/lib/supabase';

interface ContributorSummary {
  id: string;
  displayName: string;
  vocabCount: number;
  patternCount: number;
  quizStepCount: number;
  essayReviewCount: number;
  totalContributions: number;
  joinedAt?: string;
}

export default function ContributorsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { vocabularies, patterns, quizTopics } = useCurriculum();

  const [contributors, setContributors] = useState<ContributorSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadContributors = useCallback(async () => {
    try {
      const map = new Map<string, ContributorSummary>();

      const getOrCreateByName = (rawName: string, idHint?: string, joinedAt?: string) => {
        const cleanName = (rawName || '').trim();
        if (!cleanName || cleanName.toLowerCase() === 'admin') return null;
        const key = cleanName.toLowerCase();
        let existing = map.get(key);
        if (!existing) {
          existing = {
            id: idHint || key,
            displayName: cleanName,
            vocabCount: 0,
            patternCount: 0,
            quizStepCount: 0,
            essayReviewCount: 0,
            totalContributions: 0,
            joinedAt,
          };
          map.set(key, existing);
        } else if (joinedAt && !existing.joinedAt) {
          existing.joinedAt = joinedAt;
        }
        return existing;
      };

      // 1. Seed from local synced curriculum first so offline mode still works
      vocabularies.forEach((v) => {
        if (v.authorName) {
          const entry = getOrCreateByName(v.authorName);
          if (entry) entry.vocabCount += 1;
        }
      });
      patterns.forEach((p) => {
        if (p.authorName) {
          const entry = getOrCreateByName(p.authorName);
          if (entry) entry.patternCount += 1;
        }
      });
      quizTopics.forEach((t) => {
        t.steps.forEach((s) => {
          if (s.authorName) {
            const entry = getOrCreateByName(s.authorName);
            if (entry) entry.quizStepCount += 1;
          }
        });
      });

      // 2. Fetch live contributor profiles and approved items from Supabase
      const [
        { data: profileRows },
        { data: vocabRows },
        { data: patternRows },
        { data: stepRows },
        { data: reviewRows },
      ] = await Promise.all([
        supabase
          .from('contributor_directory')
          .select('id, display_name, role, created_at')
          .eq('role', 'contributor')
          .order('created_at', { ascending: true }),
        supabase
          .from('vocabularies')
          .select('id, author_name, created_by')
          .eq('status', 'approved'),
        supabase
          .from('sentence_patterns')
          .select('id, author_name, created_by')
          .eq('status', 'approved'),
        supabase
          .from('quiz_steps')
          .select('id, author_name, created_by')
          .eq('status', 'approved'),
        supabase
          .from('contributor_review_counts')
          .select('reviewer_id, review_count'),
      ]);

      if (vocabRows || patternRows || stepRows || profileRows) {
        map.clear();

        const idToName = new Map<string, string>();
        (profileRows || []).forEach((p: any) => {
          if (p.display_name) {
            idToName.set(p.id, p.display_name);
            getOrCreateByName(p.display_name, p.id, p.created_at);
          }
        });

        (vocabRows || []).forEach((v: any) => {
          const name = (v.created_by && idToName.get(v.created_by)) || v.author_name;
          if (name) {
            const entry = getOrCreateByName(name, v.created_by);
            if (entry) entry.vocabCount += 1;
          }
        });

        (patternRows || []).forEach((p: any) => {
          const name = (p.created_by && idToName.get(p.created_by)) || p.author_name;
          if (name) {
            const entry = getOrCreateByName(name, p.created_by);
            if (entry) entry.patternCount += 1;
          }
        });

        (stepRows || []).forEach((s: any) => {
          const name = (s.created_by && idToName.get(s.created_by)) || s.author_name;
          if (name) {
            const entry = getOrCreateByName(name, s.created_by);
            if (entry) entry.quizStepCount += 1;
          }
        });

        (reviewRows || []).forEach((r: any) => {
          const name = idToName.get(r.reviewer_id);
          if (name) {
            const entry = getOrCreateByName(name, r.reviewer_id);
            if (entry) entry.essayReviewCount += r.review_count;
          }
        });
      }

      const list = Array.from(map.values())
        .map((item) => ({
          ...item,
          totalContributions:
            item.vocabCount +
            item.patternCount +
            item.quizStepCount +
            item.essayReviewCount,
        }))
        .sort((a, b) => b.totalContributions - a.totalContributions);

      setContributors(list);
    } catch (err) {
      console.warn('Error loading contributors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vocabularies, patterns, quizTopics]);

  useEffect(() => {
    loadContributors();
  }, [loadContributors]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadContributors();
  };

  const totalVocabs = contributors.reduce((acc, c) => acc + c.vocabCount, 0);
  const totalPatterns = contributors.reduce((acc, c) => acc + c.patternCount, 0);
  const totalQuizzesAndReviews = contributors.reduce(
    (acc, c) => acc + c.quizStepCount + c.essayReviewCount,
    0
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 16 : 24),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}>
        <View style={styles.topBarLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Our Contributors & Mentors
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            감사와 존경 • Wall of Gratitude
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.closeBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* Hero Gratitude Card */}
        <View
          style={[
            styles.gratitudeHeroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.heroBadgeRow}>
            <View
              style={[
                styles.heartBadge,
                { backgroundColor: colors.streakLight },
              ]}>
              <Ionicons name="heart" size={14} color={colors.streak} />
              <Text style={[styles.heartBadgeText, { color: colors.streak }]}>
                SPECIAL GRATITUDE • 진심 어린 감사
              </Text>
            </View>
          </View>

          <BrandLogo size={64} rounded={true} containerStyle={{ marginVertical: 8 }} />

          <Text style={[styles.heroTitle, { color: colors.text }]}>
            VocabJip exists solely thanks to{'\n'}our Contributors.
          </Text>

          <Text style={[styles.koreanQuote, { color: colors.accent }]}>
            “선생님들의 따뜻한 나눔이 학생들의 미래를 밝힙니다”
          </Text>

          <View
            style={[
              styles.gratitudeMessageBox,
              { backgroundColor: colors.cardMuted, borderColor: colors.borderLight },
            ]}>
            <Text style={[styles.gratitudeParagraph, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>VocabJip (보캡집)</Text> သည်
              အခမဲ့ လေ့လာနိုင်သော TOPIK II အရေးအသား App အဖြစ်
              ရပ်တည်နိုင်ခြင်းမှာ အချိန်၊ ပညာနှင့်
              အတွေ့အကြုံများကို စေတနာရှေ့ထား၍ မျှဝေပေးနေကြသော{' '}
              <Text style={{ fontWeight: '700', color: colors.accent }}>
                Contributors များ
              </Text>{' '}
              ရှိနေသောကြောင့်သာ ဖြစ်ပါသည်။
            </Text>

            <Text
              style={[
                styles.gratitudeParagraph,
                { color: colors.textSecondary, marginTop: 10 },
              ]}>
              App ထဲရှိ Academic ဝေါဟာရတစ်လုံးချင်းစီ၊ Q51–Q54 ဝါကျတည်ဆောက်ပုံ
              (Sentence Patterns)၊ လက်တွေ့ လေ့ကျင့်ခန်းမေးခွန်းများ (Quizzes) နှင့်
              စာစီစာကုံး အမှတ်ပေးသုံးသပ်ချက်တိုင်းသည် Contributors များ၏
              ကိုယ်တိုင်ရေးသားပြုစုပေးမှုများ ဖြစ်ကြပါသည်။ မြန်မာကျောင်းသား/သူများ
              ကိုယ်စား ကျေးဇူးတင်ပါသည်။
            </Text>
          </View>

          {/* Community Contribution Stats */}
          <View style={styles.impactStatsRow}>
            <View
              style={[
                styles.impactStatBox,
                { backgroundColor: colors.background, borderColor: colors.borderLight },
              ]}>
              <Text style={[styles.impactStatNumber, { color: colors.accent }]}>
                {contributors.length}
              </Text>
              <Text style={[styles.impactStatLabel, { color: colors.textSecondary }]}>
                Contributors
              </Text>
            </View>

            <View
              style={[
                styles.impactStatBox,
                { backgroundColor: colors.background, borderColor: colors.borderLight },
              ]}>
              <Text style={[styles.impactStatNumber, { color: colors.streak }]}>
                {totalVocabs + totalPatterns}
              </Text>
              <Text style={[styles.impactStatLabel, { color: colors.textSecondary }]}>
                Vocabs & Patterns
              </Text>
            </View>

            <View
              style={[
                styles.impactStatBox,
                { backgroundColor: colors.background, borderColor: colors.borderLight },
              ]}>
              <Text style={[styles.impactStatNumber, { color: colors.success }]}>
                {totalQuizzesAndReviews}
              </Text>
              <Text style={[styles.impactStatLabel, { color: colors.textSecondary }]}>
                Quizzes & Reviews
              </Text>
            </View>
          </View>
        </View>

        {/* Contributor List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Contributors
            </Text>
          </View>

          {loading ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Contributor စာရင်းကို ရယူနေပါသည်...
              </Text>
            </View>
          ) : contributors.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Ionicons name="school-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Contributor စာရင်း မရှိသေးပါ
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Pull to refresh ပြုလုပ်ပေးပါ။
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {contributors.map((contributor) => {
                const initial = (contributor.displayName || 'C')[0].toUpperCase();
                return (
                  <View
                    key={contributor.id}
                    style={[
                      styles.contributorCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <View style={styles.contributorTopRow}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: colors.accentLight },
                        ]}>
                        <Text style={[styles.avatarText, { color: colors.accent }]}>
                          {initial}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[styles.contributorName, { color: colors.text }]}>
                            {contributor.displayName}
                          </Text>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.accent}
                          />
                        </View>
                        <Text
                          style={[
                            styles.contributorSubtitle,
                            { color: colors.textSecondary },
                          ]}>
                          Verified VocabJip Educator & Curriculum Author
                        </Text>
                      </View>
                    </View>

                    {/* Contribution Pills */}
                    <View
                      style={[
                        styles.metricsGrid,
                        {
                          backgroundColor: colors.cardMuted,
                          borderColor: colors.borderLight,
                        },
                      ]}>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {contributor.vocabCount}
                        </Text>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.textSecondary },
                          ]}>
                          Vocabularies
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.metricDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />

                      <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {contributor.patternCount}
                        </Text>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.textSecondary },
                          ]}>
                          Patterns
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.metricDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />

                      <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {contributor.quizStepCount}
                        </Text>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.textSecondary },
                          ]}>
                          Quiz Steps
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.metricDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />

                      <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {contributor.essayReviewCount}
                        </Text>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.textSecondary },
                          ]}>
                          Essay Reviews
                        </Text>
                      </View>
                    </View>

                    <View style={styles.thankYouFooter}>
                      <Ionicons name="sparkles" size={13} color={colors.streak} />
                      <Text
                        style={[styles.thankYouFooterText, { color: colors.textSecondary }]}>
                        မြန်မာကျောင်းသားများအတွက် သင်ခန်းစာ {contributor.totalContributions} ခု မျှဝေပေးထားပါသည် • 감사합니다
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Join as Contributor Info Card */}
        <View
          style={[
            styles.joinCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={[styles.joinIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="ribbon-outline" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.joinTitle, { color: colors.text }]}>
              Want to Contribute to VocabJip?
            </Text>
            <Text style={[styles.joinDesc, { color: colors.textSecondary }]}>
              TOPIK Level 5/6 ရရှိထားသူများနှင့် ကိုရီးယားဘာသာစကား Contributors များအနေဖြင့် VocabJip Studio တွင် ပါဝင်ရေးသားလိုပါက Feedback မှတစ်ဆင့်
              ဆက်သွယ်နိုင်ပါသည်။
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: 22,
  },
  gratitudeHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  koreanQuote: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  gratitudeMessageBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  gratitudeParagraph: {
    fontSize: 13.5,
    lineHeight: 22,
  },
  impactStatsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  impactStatBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  impactStatNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  impactStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  contributorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  contributorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '800',
  },
  contributorSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  thankYouFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thankYouFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  joinIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  joinDesc: {
    fontSize: 12.5,
    lineHeight: 19,
  },
});
