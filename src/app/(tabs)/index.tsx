import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { VOCAB_DATA } from '@/data/vocab-data';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCurriculum } from '@/hooks/use-curriculum';
import { useDailyStreak } from '@/hooks/use-daily-streak';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user, isGuest } = useAuth();
  const { vocabularies } = useCurriculum();
  const { streakDays, dailyGoal, dailyCompleted, isGoalAchieved } = useDailyStreak();

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Pool of Admin-approved vocab tips (from Cloud + fallback)
  const tipPool = useMemo(() => {
    const source = vocabularies.length > 0 ? vocabularies : VOCAB_DATA;
    const withTips = source.filter((v) => v.spoken && v.written && (v.usageTip || v.myanmarMeaning));
    return withTips.length > 0 ? withTips : VOCAB_DATA;
  }, [vocabularies]);

  // Deterministic daily random index based on YYYY-MM-DD date seed (+ optional manual shuffle offset)
  const [tipOffset, setTipOffset] = useState(0);
  const todayTip = useMemo(() => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
    }
    const index = (hash + tipOffset) % tipPool.length;
    return tipPool[index] || VOCAB_DATA[0];
  }, [tipPool, tipOffset]);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push('/modal/about')}
            activeOpacity={0.7}
            accessibilityLabel="About VocabJip"
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrandLogo size={40} />
            <View>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {today} • Today
              </Text>
              <Text style={[styles.brandTitle, { color: colors.text }]}>VocabJip</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.profileAvatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="person" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Guest Reminder Banner */}
        {(!user || isGuest) && (
          <View style={[styles.guestBanner, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guestBannerTitle, { color: colors.accent }]}>
                Guest Mode
              </Text>
              <Text style={[styles.guestBannerSubtitle, { color: colors.textSecondary }]}>
                Sign up with 6-digit OTP to sync your drafts and streak.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-up')}
              style={[styles.guestBannerBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.guestBannerBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Streak & Goal Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.statIconRow}>
              <View style={[styles.iconPill, { backgroundColor: colors.streakLight }]}>
                <Ionicons name="flame" size={18} color={colors.streak} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{streakDays}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { 
                backgroundColor: colors.card, 
                borderColor: isGoalAchieved ? colors.streak : colors.border,
                borderWidth: isGoalAchieved ? 1.5 : 1,
              },
            ]}>
            <View style={styles.statIconRow}>
              <View style={[styles.iconPill, { backgroundColor: isGoalAchieved ? colors.streakLight : colors.accentLight }]}>
                <Ionicons 
                  name={isGoalAchieved ? "trophy" : "checkmark-done"} 
                  size={18} 
                  color={isGoalAchieved ? colors.streak : colors.accent} 
                />
              </View>
              <Text style={[styles.statValue, { color: isGoalAchieved ? colors.streak : colors.text }]}>
                {dailyCompleted}/{dailyGoal}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: isGoalAchieved ? colors.streak : colors.textSecondary }]}>
              {isGoalAchieved ? "Goal Done! 🎉" : "Daily Goal"}
            </Text>
          </View>
        </View>

        {/* Today's High-Yield Tip (Dynamic Daily Rotation from Approved Contributor Content) */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.tipHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              <Text style={[styles.tipBadge, { backgroundColor: colors.streakLight, color: colors.streak }]}>
                TODAY'S TOPIK TIP
              </Text>
              {todayTip.authorName && (
                <View style={styles.tipAuthorPill}>
                  <Ionicons name="ribbon" size={11} color="#B45309" />
                  <Text style={styles.tipAuthorText}>
                    {todayTip.authorName}
                    {todayTip.authorRank ? ` • ${todayTip.authorRank}` : ''}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setTipOffset((prev) => prev + 1)}
              style={[styles.shuffleTipBtn, { backgroundColor: colors.cardMuted }]}
              accessibilityLabel="Shuffle another tip">
              <Ionicons name="shuffle" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.tipTitle, { color: colors.text }]}>
            {todayTip.spoken} အစား <Text style={{ color: colors.accent }}>{todayTip.written}</Text> ကို သုံးပါ
          </Text>
          <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
            {todayTip.usageTip || todayTip.myanmarMeaning}
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/modal/vocab-detail',
                params: { id: todayTip.id },
              });
            }}
            style={styles.tipActionRow}>
            <Text style={[styles.tipActionText, { color: colors.accent }]}>
              View Spoken → Academic breakdown
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Quick Practice
        </Text>
        <View style={styles.actionGrid}>
          {/* Quick Quiz */}
          <TouchableOpacity
            onPress={() => router.push('/modal/quiz')}
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={[styles.actionIconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="sparkles" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Step-by-Step Quiz
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Topics • 5 Qs per step
            </Text>
          </TouchableOpacity>

          {/* Wongoji Practice */}
          <TouchableOpacity
            onPress={() => router.push('/modal/wongoji-editor')}
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={[styles.actionIconBox, { backgroundColor: colors.streakLight }]}>
              <Ionicons name="grid-outline" size={22} color={colors.streak} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Wongoji Grid
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Q53 Graph & Q54
            </Text>
          </TouchableOpacity>
        </View>

        {/* Community Essays Showcase Card */}
        <TouchableOpacity
          onPress={() => router.push('/modal/community')}
          style={[
            styles.communityCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={[styles.communityIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="people" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.communityHeaderRow}>
              <View style={[styles.communityBadgeBox, { backgroundColor: colors.streakLight }]}>
                <Text style={[styles.communityBadge, { color: colors.streak }]}>
                  COMMUNITY
                </Text>
              </View>
              <Text style={[styles.communityTitle, { color: colors.text }]}>
                Peer Essay Showcase
              </Text>
            </View>
            <Text style={[styles.communityDesc, { color: colors.textSecondary }]}>
              မြန်မာဘာသာစကား လေ့လာနေသူ အချင်းချင်း Q53/Q54 အမှတ်ကောင်းထားတဲ့ စာမူတွေကို ကြည့်ရှုပြီး ကိုယ့်ရဲ့ ရေးလက်စ စာမူတွေကို ဝေမျှလိုက်ပါ။
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Featured Vocab of the Day */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            High-Yield Academic Words
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/learn')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {(vocabularies.length > 0 ? vocabularies : VOCAB_DATA).slice(0, 3).map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/modal/vocab-detail',
                params: { id: item.id },
              })
            }
            style={[
              styles.vocabRowCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={{ flex: 1 }}>
              <View style={styles.vocabCompareRow}>
                <Text style={[styles.spokenText, { color: colors.textMuted }]}>
                  {item.spoken}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                <Text style={[styles.writtenText, { color: colors.accent }]}>
                  {item.written}
                </Text>
              </View>
              <Text style={[styles.vocabMeaning, { color: colors.textSecondary }]}>
                {item.myanmarMeaning}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  guestBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  guestBannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  guestBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tipAuthorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tipAuthorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  shuffleTipBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 2,
  },
  tipDesc: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 6,
    paddingTop: 2,
  },
  tipActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tipActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionDesc: {
    fontSize: 12,
  },
  vocabRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  vocabCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  spokenText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  writtenText: {
    fontSize: 16,
    fontWeight: '700',
  },
  vocabMeaning: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 1,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  communityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  communityBadgeBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  communityBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  communityTitle: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  communityDesc: {
    fontSize: 12,
    lineHeight: 21,
    marginTop: 5,
    paddingTop: 2,
  },
});

