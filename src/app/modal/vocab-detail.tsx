import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { VOCAB_DATA } from '@/data/vocab-data';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSaved } from '@/context/saved-context';
import { SpeechService } from '@/services/speech-service';
import { useCurriculum } from '@/hooks/use-curriculum';

export default function VocabDetailModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isVocabSaved, toggleSaveVocab } = useSaved();
  const { vocabularies } = useCurriculum();

  const item = vocabularies.find((v) => v.id === id) || VOCAB_DATA.find((v) => v.id === id) || VOCAB_DATA[0];
  const saved = isVocabSaved(item.id);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handlePronounce = async (text: string) => {
    setIsPlaying(true);
    await SpeechService.speakKorean(text, {
      rate: 0.88,
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modal Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerCategory, { color: colors.textSecondary }]}>
          {item.category}
        </Text>
        <TouchableOpacity
          onPress={() => toggleSaveVocab(item.id)}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.accent : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contributor Attribution Banner */}
        {item.authorName ? (
          <View
            style={[
              styles.contributorBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.contributorLeft}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                  {(item.authorName || 'C')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.contributorLabel, { color: colors.textMuted }]}>
                  CONTRIBUTED BY
                </Text>
                <Text style={[styles.contributorName, { color: colors.text }]}>
                  {item.authorName}
                </Text>
              </View>
            </View>
            {item.authorRank ? (
              <View style={[styles.rankBadge, { backgroundColor: colors.streakLight }]}>
                <Ionicons name="trophy" size={12} color={colors.streak} />
                <Text style={[styles.rankBadgeText, { color: colors.streak }]}>
                  {item.authorRank}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Comparison Hero Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.badgeRow}>
            <Text style={[styles.spBadge, { backgroundColor: colors.cardMuted, color: colors.textMuted }]}>
              SPOKEN / EVERYDAY
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.accent} />
            <Text style={[styles.acBadge, { backgroundColor: colors.accentLight, color: colors.accent }]}>
              WRITTEN / ACADEMIC
            </Text>
          </View>

          <View style={styles.wordsRow}>
            <Text style={[styles.spokenWord, { color: colors.textMuted }]}>
              {item.spoken}
            </Text>
            <Ionicons name="arrow-forward" size={24} color={colors.accent} />
            <Text style={[styles.writtenWord, { color: colors.text }]}>
              {item.written}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handlePronounce(item.written)}
            style={[
              styles.pronounceRow,
              { backgroundColor: isPlaying ? colors.accentLight : 'transparent' },
            ]}
            accessibilityLabel="Listen to pronunciation">
            <Ionicons
              name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
              size={20}
              color={colors.accent}
            />
            <Text style={[styles.pronounceText, { color: colors.accent, fontWeight: '700' }]}>
              [{item.pronunciation}]
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 4 }}>
              (Tap to listen)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Myanmar Meaning */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            အဓိပ္ပာယ် (MYANMAR MEANING)
          </Text>
          <Text style={[styles.meaningMain, { color: colors.text }]}>
            {item.myanmarMeaning}
          </Text>
          <Text style={[styles.meaningEnglish, { color: colors.textMuted }]}>
            English: {item.englishMeaning}
          </Text>
        </View>

        {/* TOPIK Writing Rule & Tip */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.streakLight, borderColor: 'transparent' },
          ]}>
          <View style={styles.tipTitleRow}>
            <Ionicons name="bulb-outline" size={18} color={colors.streak} />
            <Text style={[styles.tipTitle, { color: colors.streak }]}>
              TOPIK WRITING RULE
            </Text>
          </View>
          <Text style={[styles.tipContent, { color: colors.text }]}>
            {item.usageTip}
          </Text>
        </View>

        {/* Example Sentence */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            နမူနာဝါကျ (EXAMPLE SENTENCE)
          </Text>
          <Text style={[styles.exampleKorean, { color: colors.text }]}>
            {item.exampleSentence.korean}
          </Text>
          <Text style={[styles.exampleMyanmar, { color: colors.textSecondary }]}>
            {item.exampleSentence.myanmar}
          </Text>
        </View>
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
  headerCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  acBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  spokenWord: {
    fontSize: 22,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  writtenWord: {
    fontSize: 28,
    fontWeight: '800',
  },
  pronounceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pronounceText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  meaningMain: {
    fontSize: 17,
    fontWeight: '700',
  },
  meaningEnglish: {
    fontSize: 13,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tipContent: {
    fontSize: 13,
    lineHeight: 19,
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

