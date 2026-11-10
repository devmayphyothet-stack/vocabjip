import { LearningPage, LearningText, useLearningCopy } from '@/components/LearningUI';
import { LearningLogService } from '@/services/learning-log-service';
import { useAuth } from '@/context/auth-context';
import { useSaved } from '@/context/saved-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAi } from '@/context/ai-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AiEvaluationResult, AiErrorType } from '@/types/ai';

type ScreenStage = 'consent' | 'processing' | 'result' | 'error';

export default function AiFeedbackModal() {
  const copy = useLearningCopy();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);
  const { isConnected, evaluateEssay, latestEvaluation } = useAi();
  const params = useLocalSearchParams<{
    draftId?: string;
    essayText?: string;
    questionType?: string;
    promptTopic?: string;
  }>();

  const { drafts } = useSaved();
  const incomingDraft = drafts.find((draft) => draft.id === params.draftId);
  const essayText = incomingDraft?.content || params.essayText || '';
  const questionType = (params.questionType as 'Q53' | 'Q54') || 'Q53';
  const promptTopic = params.promptTopic || 'TOPIK II Essay';

  const { user } = useAuth();
  const [historyWarning, setHistoryWarning] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [stage, setStage] = useState<ScreenStage>(
    latestEvaluation && !essayText ? 'result' : 'consent',
  );
  const [evaluation, setEvaluation] = useState<AiEvaluationResult | null>(latestEvaluation);
  const [errorInfo, setErrorInfo] = useState<{ message: string; type?: AiErrorType }>({
    message: '',
  });

  // If not connected to Gemini, prompt user to connect key first
  useEffect(() => {
    if (!isConnected && !latestEvaluation && (!params.draftId || incomingDraft)) {
      router.replace('/modal/ai-connect');
    }
  }, [isConnected]);

  const handleStartReview = async () => {
    if (!essayText.trim()) {
      setErrorInfo({ message: 'No essay content found to review.', type: 'UNKNOWN' });
      setStage('error');
      return;
    }

    setStage('processing');
    let response;
    try {
      response = await evaluateEssay(essayText, questionType, promptTopic);
    } catch {
      setErrorInfo({ message: 'Feedback could not be completed. Please retry.', type: 'UNKNOWN' });
      setStage('error');
      return;
    }

    if (response.success && response.result) {
      setHistoryWarning(response.storageWarning || '');
      setEvaluation(response.result);
      setStage('result');
    } else {
      setErrorInfo({
        message: response.error || 'Failed to complete review.',
        type: response.errorType || 'UNKNOWN',
      });
      setStage('error');
    }
  };

  if (params.draftId && !incomingDraft)
    return (
      <LearningPage title={copy('Writing feedback', 'စာရေးသုံးသပ်ချက်')}>
        <LearningText>
          {copy(
            'This draft is no longer available. Open a saved draft to request feedback.',
            'ဤစာမူ မရရှိတော့ပါ။ Saved မှ စာမူတစ်ခုကို ဖွင့်ပါ။',
          )}
        </LearningText>
      </LearningPage>
    );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>AI Writing Coach</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* STAGE 1: CONSENT */}
      {stage === 'consent' && (
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <View style={[styles.heroIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="sparkles" size={40} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Review your writing</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            A second pair of eyes • You control what you share
          </Text>

          <View
            style={[
              styles.draftSummaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryBadgeRow}>
              <View style={[styles.qTag, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.qTagText, { color: colors.accent }]}>{questionType}</Text>
              </View>
              <Text style={[styles.charCountText, { color: colors.textSecondary }]}>
                {essayText.length} characters
              </Text>
            </View>

            <Text style={[styles.summaryTopic, { color: colors.text }]}>{promptTopic}</Text>

            <Text
              numberOfLines={4}
              style={[styles.summarySnippet, { color: colors.textSecondary }]}
            >
              {essayText || 'No text written yet.'}
            </Text>
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.privacyNoteText, { color: colors.textSecondary }]}>
              Your text is sent securely to Google Gemini using your personal API key.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleStartReview}
            disabled={!essayText.trim()}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              !essayText.trim() && { opacity: 0.5 },
            ]}
          >
            <Ionicons name="sparkles" size={18} color={colors.primaryContrast} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Start AI Review
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* STAGE 2: PROCESSING */}
      {stage === 'processing' && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 20 }} />
          <Text style={[styles.title, { color: colors.text }]}>Reviewing your essay</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Keep your draft — it is saved on this device.
          </Text>
          <View style={[styles.processingTipCard, { backgroundColor: colors.cardMuted }]}>
            <Text style={[styles.processingTipTitle, { color: colors.text }]}>
              Good writing takes a moment
            </Text>
            <Text style={[styles.processingTipText, { color: colors.textSecondary }]}>
              Gemini is evaluating your paragraph structure, academic vocabulary usage, and TOPIK II
              scoring alignment in Myanmar language...
            </Text>
          </View>
        </View>
      )}

      {/* STAGE 3: RESULTS & SCORE */}
      {stage === 'result' && evaluation && (
        <ScrollView
          contentContainerStyle={styles.resultScroll}
          showsVerticalScrollIndicator={false}
        >
          {stage === 'result' && evaluation ? (
            <View style={{ padding: 16, gap: 8 }}>
              {historyWarning ? (
                <Text accessibilityRole="alert" style={{ color: colors.error }}>
                  {historyWarning}
                </Text>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                disabled={savingReview}
                style={{ padding: 14, backgroundColor: colors.accentLight, borderRadius: 12 }}
                onPress={async () => {
                  if (savingReview) return;
                  setSavingReview(true);
                  try {
                    const review = await LearningLogService.recordAiFeedback(evaluation, user?.id);
                    setHistoryWarning('');
                    router.push({
                      pathname: '/modal/writing-revision',
                      params: { reviewId: review.id },
                    });
                  } catch {
                    setHistoryWarning('Could not save feedback. Please retry.');
                  } finally {
                    setSavingReview(false);
                  }
                }}
              >
                <Text style={{ color: colors.accent }}>
                  {copy('Save feedback & revise writing', 'သုံးသပ်ချက် သိမ်း၍ စာပြင်ဆင်ရန်')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Estimated Score Card */}
          <View
            style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.scoreHeaderRow}>
              <Text style={[styles.scoreTag, { color: colors.textSecondary }]}>
                ESTIMATED {evaluation.questionType} SCORE
              </Text>
              <Text style={[styles.scoreBadgeNotice, { color: colors.accent }]}>
                Illustrative Feedback
              </Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={[styles.bigScore, { color: colors.accent }]}>
                {evaluation.estimatedScore}
              </Text>
              <Text style={[styles.maxScore, { color: colors.textMuted }]}>
                / {evaluation.maxScore}
              </Text>
            </View>

            <Text style={[styles.overallSummaryText, { color: colors.text }]}>
              {evaluation.overallSummary}
            </Text>
          </View>

          {/* Sub-Dimension Scores */}
          <View style={styles.dimensionsRow}>
            <View
              style={[
                styles.dimensionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.dimensionLabel, { color: colors.textSecondary }]}>
                STRUCTURE
              </Text>
              <Text style={[styles.dimensionScore, { color: colors.text }]}>
                {evaluation.structureRating.score}/{evaluation.structureRating.max}
              </Text>
            </View>

            <View
              style={[
                styles.dimensionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.dimensionLabel, { color: colors.textSecondary }]}>CONTENT</Text>
              <Text style={[styles.dimensionScore, { color: colors.text }]}>
                {evaluation.contentRating.score}/{evaluation.contentRating.max}
              </Text>
            </View>

            <View
              style={[
                styles.dimensionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.dimensionLabel, { color: colors.textSecondary }]}>LANGUAGE</Text>
              <Text style={[styles.dimensionScore, { color: colors.text }]}>
                {evaluation.languageRating.score}/{evaluation.languageRating.max}
              </Text>
            </View>
          </View>

          {/* Strengths & Improvements */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Key Insights (အဓိက သုံးသပ်ချက်များ)
            </Text>

            <View style={styles.insightGroup}>
              <Text style={[styles.insightSubheading, { color: colors.success }]}>
                ✓ Strengths (အားသာချက်များ)
              </Text>
              {evaluation.strengths.map((str, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{str}</Text>
                </View>
              ))}
            </View>

            <View style={styles.insightGroup}>
              <Text style={[styles.insightSubheading, { color: colors.streak }]}>
                △ Areas for Improvement (တိုးတက်စေရန်)
              </Text>
              {evaluation.improvements.map((imp, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.streak} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{imp}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Grammar & Sentence Corrections */}
          {evaluation.grammarCorrections.length > 0 && (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Sentence Corrections (ဝါကျ ပြင်ဆင်ချက်)
              </Text>

              {evaluation.grammarCorrections.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.correctionBox, { backgroundColor: colors.cardMuted }]}
                >
                  <View style={styles.diffRow}>
                    <Text style={[styles.diffOriginal, { color: colors.error }]}>
                      - {item.original}
                    </Text>
                    <Text style={[styles.diffCorrected, { color: colors.success }]}>
                      + {item.corrected}
                    </Text>
                  </View>
                  <Text style={[styles.correctionReason, { color: colors.textSecondary }]}>
                    {item.explanation}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Vocabulary Suggestions */}
          {evaluation.vocabularySuggestions.length > 0 && (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Everyday → Academic Upgrades (အဆင့်မြင့် ဝေါဟာရ)
              </Text>

              {evaluation.vocabularySuggestions.map((vocab, idx) => (
                <View key={idx} style={styles.vocabUpgradeRow}>
                  <View style={styles.vocabBadgeRow}>
                    <Text style={[styles.vocabSpoken, { color: colors.textMuted }]}>
                      {vocab.spokenWord}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                    <Text style={[styles.vocabAcademic, { color: colors.accent }]}>
                      {vocab.academicAlternative}
                    </Text>
                  </View>
                  <Text style={[styles.vocabReason, { color: colors.textSecondary }]}>
                    {vocab.reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Back to Editor
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* STAGE 4: ERROR STATE (figma/quota and figma/reviewFailure) */}
      {stage === 'error' && (
        <ScrollView
          contentContainerStyle={styles.quotaScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.quotaHeader}>
            <Text style={[styles.quotaTitle, { color: colors.text }]}>
              {errorInfo.type === 'QUOTA' ? 'Your AI needs a break' : 'Review interrupted'}
            </Text>
            <Text style={[styles.quotaSubtitle, { color: colors.textSecondary }]}>
              {errorInfo.type === 'QUOTA'
                ? 'Google project limit reached'
                : 'Unable to complete review'}
            </Text>
          </View>

          {/* Draft is Safe Card */}
          <View
            style={[styles.safeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.safeTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
              <Text style={[styles.safeTitle, { color: colors.text }]}>Your draft is safe</Text>
            </View>
            <Text style={[styles.safeDesc, { color: colors.textSecondary }]}>
              No feedback was generated. You can continue editing without losing any progress.
            </Text>
          </View>

          {/* Why this happened Card */}
          <View
            style={[
              styles.whyCard,
              { backgroundColor: colors.streakLight, borderColor: colors.borderLight },
            ]}
          >
            <Text style={[styles.whyTitle, { color: colors.streak }]}>Why this happened</Text>
            <Text style={[styles.whyDesc, { color: colors.textSecondary }]}>
              {errorInfo.type === 'QUOTA'
                ? 'Your Google project has reached a request or usage limit. Limits vary by model and plan.'
                : errorInfo.message ||
                  'The network connection was interrupted or the key is invalid.'}
            </Text>
          </View>

          {/* Notice text */}
          <Text style={[styles.quotaNoticeText, { color: colors.textMuted }]}>
            Check quota in Google AI Studio, then retry when available. VocabJip cannot reset Google
            limits.
          </Text>

          {/* Buttons */}
          <View style={styles.quotaBtnStack}>
            <TouchableOpacity
              onPress={handleStartReview}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                Try again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Keep writing</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
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
  centeredContent: {
    flexGrow: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  draftSummaryCard: {
    width: '100%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginVertical: 10,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  charCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryTopic: {
    fontSize: 16,
    fontWeight: '700',
  },
  summarySnippet: {
    fontSize: 13,
    lineHeight: 19,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  processingTipCard: {
    padding: 16,
    borderRadius: 14,
    width: '100%',
    gap: 6,
    marginTop: 14,
  },
  processingTipTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  processingTipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultScroll: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  scoreCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreBadgeNotice: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigScore: {
    fontSize: 54,
    fontWeight: '900',
  },
  maxScore: {
    fontSize: 20,
    fontWeight: '600',
  },
  overallSummaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dimensionCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  dimensionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  insightGroup: {
    gap: 8,
  },
  insightSubheading: {
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
  correctionBox: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  diffRow: {
    gap: 4,
  },
  diffOriginal: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  diffCorrected: {
    fontSize: 14,
    fontWeight: '700',
  },
  correctionReason: {
    fontSize: 12,
    lineHeight: 17,
  },
  vocabUpgradeRow: {
    gap: 4,
    paddingBottom: 8,
  },
  vocabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabSpoken: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  vocabAcademic: {
    fontSize: 15,
    fontWeight: '700',
  },
  vocabReason: {
    fontSize: 12,
    lineHeight: 17,
  },
  quotaScrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  quotaHeader: {
    marginBottom: Spacing.one,
  },
  quotaTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quotaSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  safeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  safeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  safeDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  whyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  quotaNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  quotaBtnStack: {
    gap: 12,
    marginTop: Spacing.two,
  },
});
