import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAi } from '@/context/ai-context';
import { evaluatePersonalStatement } from '@/services/statement-ai-service';
import { StatementAiFeedback } from '@/types/statement';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function StatementFeedbackModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { apiKey } = useAi();
  const params = useLocalSearchParams<{
    sectionTitle?: string;
    koreanTitle?: string;
    text?: string;
    university?: string;
    major?: string;
  }>();

  const sectionTitle = params.sectionTitle || 'Background';
  const koreanTitle = params.koreanTitle || '성장 과정';
  const statementText = params.text || '';
  const university = params.university || 'Korean University';
  const major = params.major || 'Selected Major';

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<StatementAiFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const res = await evaluatePersonalStatement(
        apiKey || '',
        `${sectionTitle} (${koreanTitle})`,
        statementText,
        university,
        major
      );

      if (res.success && res.result) {
        setFeedback(res.result);
      } else {
        setErrorMessage(res.error || 'Failed to review statement.');
      }
      setIsLoading(false);
    })();
  }, [statementText]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Admissions AI Guidance
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 16 }} />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>
            Evaluating with Admissions Rubric
          </Text>
          <Text style={[styles.loadingDesc, { color: colors.textSecondary }]}>
            Reviewing tone formality, narrative authenticity, and Korean academic expression standards...
          </Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={44} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Review Interrupted</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Back to Editor
            </Text>
          </TouchableOpacity>
        </View>
      ) : feedback ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Feedback Card */}
          <View
            style={[
              styles.heroCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.badgeRow}>
              <View style={[styles.targetBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.targetBadgeText, { color: colors.accent }]}>
                  {university} • {major}
                </Text>
              </View>
            </View>

            <Text style={[styles.heroHeading, { color: colors.text }]}>
              Make your story clearer
            </Text>
            <Text style={[styles.heroSummary, { color: colors.textSecondary }]}>
              {feedback.overallFeedback}
            </Text>

            {/* Professor Impression Quote Box */}
            <View style={[styles.professorBox, { backgroundColor: colors.cardMuted }]}>
              <View style={styles.profTitleRow}>
                <Ionicons name="school" size={16} color={colors.streak} />
                <Text style={[styles.profTitle, { color: colors.streak }]}>
                  ADMISSIONS PROFESSOR PERSPECTIVE (ပါမောက္ခများ၏ အမြင်)
                </Text>
              </View>
              <Text style={[styles.profQuote, { color: colors.text }]}>
                "{feedback.professorImpression}"
              </Text>
            </View>
          </View>

          {/* Scores Row */}
          <View style={styles.scoresRow}>
            <View
              style={[
                styles.scoreBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.scoreBoxLabel, { color: colors.textSecondary }]}>
                ACADEMIC TONE
              </Text>
              <Text style={[styles.scoreBoxValue, { color: colors.accent }]}>
                {feedback.toneScore} / 10
              </Text>
            </View>

            <View
              style={[
                styles.scoreBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.scoreBoxLabel, { color: colors.textSecondary }]}>
                STORY CLARITY
              </Text>
              <Text style={[styles.scoreBoxValue, { color: colors.accent }]}>
                {feedback.clarityScore} / 10
              </Text>
            </View>
          </View>

          {/* Strengths & Improvements */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Key Takeaways (အဓိက သုံးသပ်ချက်များ)
            </Text>

            <View style={styles.insightGroup}>
              <Text style={[styles.insightHeader, { color: colors.success }]}>
                ✓ What worked well (အားသာချက်)
              </Text>
              {feedback.strengths.map((s, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.insightGroup}>
              <Text style={[styles.insightHeader, { color: colors.streak }]}>
                △ Recommendations (ပိုမိုကောင်းမွန်စေရန်)
              </Text>
              {feedback.keyImprovements.map((imp, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.streak} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{imp}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* High-Impact Sentence Refinements */}
          {feedback.sentenceImprovements.length > 0 && (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sentence Refinements (ဝါကျ အဆင့်မြှင့်တင်မှု)
              </Text>

              {feedback.sentenceImprovements.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.refineBox, { backgroundColor: colors.cardMuted }]}>
                  <View style={styles.refineOriginalRow}>
                    <Text style={[styles.refineOriginal, { color: colors.textMuted }]}>
                      - {item.original}
                    </Text>
                  </View>
                  <View style={styles.refineEnhancedRow}>
                    <Text style={[styles.refineEnhanced, { color: colors.accent }]}>
                      + {item.enhanced}
                    </Text>
                  </View>
                  <Text style={[styles.refineReason, { color: colors.textSecondary }]}>
                    {item.reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginVertical: 12 }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Apply Improvements to Draft
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  professorBox: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  profTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profQuote: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  scoreBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreBoxValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  insightGroup: {
    gap: 8,
  },
  insightHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  refineBox: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  refineOriginalRow: {
    gap: 2,
  },
  refineOriginal: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  refineEnhancedRow: {
    gap: 2,
  },
  refineEnhanced: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  refineReason: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
