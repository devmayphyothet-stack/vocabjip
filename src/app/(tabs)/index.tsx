import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { VOCAB_DATA } from '@/data/vocab-data';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user, isGuest } = useAuth();

  const streakDays = user?.streakDays ?? 7;
  const dailyGoal = user?.dailyGoal ?? 3;
  const dailyCompleted = user?.dailyCompleted ?? 2;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {today} • Today
            </Text>
            <Text style={[styles.brandTitle, { color: colors.text }]}>VocabJip</Text>
          </View>
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity
              style={[styles.profileAvatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person" size={18} color={colors.accent} />
            </TouchableOpacity>
          </Link>
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
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity
                style={[styles.guestBannerBtn, { backgroundColor: colors.accent }]}>
                <Text style={styles.guestBannerBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
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
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.statIconRow}>
              <View style={[styles.iconPill, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="checkmark-done" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dailyCompleted}/{dailyGoal}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Daily Goal
            </Text>
          </View>
        </View>

        {/* Today's High-Yield Tip */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.tipHeader}>
            <Text style={[styles.tipBadge, { backgroundColor: colors.streakLight, color: colors.streak }]}>
              TODAY'S TOPIK TIP
            </Text>
          </View>
          <Text style={[styles.tipTitle, { color: colors.text }]}>
            그래서 အစား <Text style={{ color: colors.accent }}>따라서</Text> ကို သုံးပါ
          </Text>
          <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
            TOPIK II စာစီစာကုံး (Q53/Q54) များတွင် စကားပြောအသုံးဖြစ်သော "그래서" အစား "따라서" သို့မဟုတ် "그러므로" ကို ရေးသားမှသာ အမှတ်ပြည့်ရရှိပါမည်။
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/modal/vocab-detail',
                params: { id: 'v-1' },
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
              Vocab Quiz
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              5 questions • 2 mins
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={[styles.communityBadge, { backgroundColor: colors.streakLight, color: colors.streak }]}>
                COMMUNITY
              </Text>
              <Text style={[styles.communityTitle, { color: colors.text }]}>
                Peer Essay Showcase
              </Text>
            </View>
            <Text style={[styles.communityDesc, { color: colors.textSecondary }]}>
              Browse scored Q53/Q54 essays from fellow Myanmar learners & share your drafts.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Featured Vocab of the Day */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            High-Yield Academic Words
          </Text>
          <Link href="/(tabs)/learn" asChild>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {VOCAB_DATA.slice(0, 3).map((item) => (
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
  },
  tipDesc: {
    fontSize: 13,
    lineHeight: 19,
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
  communityBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  communityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  communityDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});

