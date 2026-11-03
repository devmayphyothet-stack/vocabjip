import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSaved } from '@/context/saved-context';
import { useCurriculum } from '@/hooks/use-curriculum';

export default function PatternDetailModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPatternSaved, toggleSavePattern } = useSaved();
  const { patterns } = useCurriculum();

  const pattern = patterns.find((p) => p.id === id) || patterns[0];
  if (!pattern) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const saved = isPatternSaved(pattern.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.qPill, { backgroundColor: colors.streakLight }]}>
          <Text style={[styles.qPillText, { color: colors.streak }]}>
            {pattern.questionNumber} WRITING PATTERN
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleSavePattern(pattern.id)}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.streak : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contributor Attribution Banner */}
        {pattern.authorName ? (
          <View
            style={[
              styles.contributorBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.contributorLeft}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                  {(pattern.authorName || 'C')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.contributorLabel, { color: colors.textMuted }]}>
                  CONTRIBUTED BY
                </Text>
                <Text style={[styles.contributorName, { color: colors.text }]}>
                  {pattern.authorName}
                </Text>
              </View>
            </View>
            {/* {pattern.authorRank ? (
              <View style={[styles.rankBadge, { backgroundColor: colors.streakLight }]}>
                <Ionicons name="trophy" size={12} color={colors.streak} />
                <Text style={[styles.rankBadgeText, { color: colors.streak }]}>
                  {pattern.authorRank}
                </Text>
              </View>
            ) : null} */}
          </View>
        ) : null}

        {/* Title & Myanmar Heading */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>{pattern.title}</Text>
          <Text style={[styles.myanmarTitle, { color: colors.textSecondary }]}>
            {pattern.myanmarTitle}
          </Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {pattern.description}
          </Text>
        </View>

        {/* Pattern Formula */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textSecondary }]}>
            STRUCTURE & FORMULA
          </Text>
          <View style={[styles.formulaBox, { backgroundColor: colors.cardMuted }]}>
            <Text
              style={[
                styles.formulaText,
                {
                  color: colors.text,
                  fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
                },
              ]}>
              {pattern.patternFormula}
            </Text>
          </View>
        </View>

        {/* Key Phrases */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textSecondary }]}>
            KEY PHRASES TO MEMORIZE
          </Text>
          <View style={styles.phraseList}>
            {pattern.keyPhrases.map((phrase, idx) => (
              <View key={idx} style={styles.phraseRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                <Text style={[styles.phraseText, { color: colors.text }]}>{phrase}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exam Example Sentence */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textSecondary }]}>
            TOPIK EXAM EXAMPLE
          </Text>
          <Text style={[styles.exampleKorean, { color: colors.text }]}>
            {pattern.exampleKorean}
          </Text>
          <Text style={[styles.exampleMyanmar, { color: colors.textSecondary }]}>
            {pattern.exampleMyanmar}
          </Text>
        </View>

        {/* Action Button: Try writing with this pattern */}
        <TouchableOpacity
          onPress={() => {
            router.back();
            router.push({
              pathname: '/modal/wongoji-editor',
              params: {
                type: pattern.questionNumber === 'Q54' ? 'Q54' : 'Q53',
                promptTitle: pattern.title,
              },
            });
          }}
          style={[styles.practiceBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="create-outline" size={18} color={colors.primaryContrast} />
          <Text style={[styles.practiceBtnText, { color: colors.primaryContrast }]}>
            Practice in Wongoji Editor
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerSection: {
    gap: 4,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  myanmarTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formulaBox: {
    padding: 14,
    borderRadius: 12,
  },
  formulaText: {
    fontSize: 14,
    lineHeight: 22,
  },
  phraseList: {
    gap: 8,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phraseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exampleKorean: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  exampleMyanmar: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  practiceBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  contributorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contributorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
  },
  contributorLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contributorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

