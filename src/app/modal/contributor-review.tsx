import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  EssayReviewService,
  ContributorEssaySubmission,
} from '@/services/essay-review-service';

export default function ContributorReviewModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 48 : 16);
  const { user } = useAuth();

  const params = useLocalSearchParams<{
    essayText?: string;
    questionType?: string;
    promptTopic?: string;
  }>();

  const incomingEssay = params.essayText?.trim() || '';
  const incomingType = (params.questionType as 'Q53' | 'Q54') || 'Q53';
  const incomingTopic =
    params.promptTopic ||
    (incomingType === 'Q53' ? '인터넷 이용 현황 (Q53)' : '평생 교육의 필요성 (Q54)');

  const [submissions, setSubmissions] = useState<ContributorEssaySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContributorEssaySubmission | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const studentDisplayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'TOPIK Learner';

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const list = await EssayReviewService.getMySubmissions(user?.id);
      setSubmissions(list);
      if (!selectedSubmission && !incomingEssay && list.length > 0) {
        setSelectedSubmission(list[0]);
      }
    } catch {
      Alert.alert('Could not load submissions', 'Please retry when you are online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user?.id]);

  const handleSubmitToContributor = async () => {
    if (!incomingEssay || submitting || hasSubmittedCurrent) return;
    setSubmitting(true);
    setBannerMsg(null);
    try {
      const created = await EssayReviewService.submitEssayForContributorReview({
        userId: user?.id,
        studentName: studentDisplayName,
        questionType: incomingType,
        promptTopic: incomingTopic,
        essayText: incomingEssay,
      });
      setHasSubmittedCurrent(true);
      setSubmissions((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
      setSelectedSubmission(created);
      setBannerMsg(created.deliveryStatus === 'sent'
        ? 'Your essay was sent to Contributors. Feedback will appear here after review.'
        : user ? 'Saved on this device, waiting to send. Refresh when you are online to retry.' : 'Saved on this device only. Sign in and submit from your draft to send it to Contributors.');
    } catch {
      Alert.alert('Could not save submission', 'Please retry. Your editor draft is still available.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: topInset, borderBottomColor: colors.border },
        ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.closeBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Contributors Essay Review
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Contributors ကိုယ်တိုင် အမှတ်ပေးစစ်ဆေးမှု (Q53 & Q54)
          </Text>
        </View>

        <TouchableOpacity
          onPress={loadSubmissions}
          style={[
            styles.closeBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Ionicons name="refresh" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* If navigated from Wongoji Editor with a draft, show Submit Card */}
        {Boolean(incomingEssay) && !hasSubmittedCurrent && (
          <View
            style={[
              styles.submitCard,
              { backgroundColor: colors.card, borderColor: colors.accent },
            ]}>
            <View style={styles.submitCardHeader}>
              <View style={[styles.qBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.qBadgeText, { color: colors.accent }]}>
                  {incomingType} • READY TO SUBMIT
                </Text>
              </View>
              <Text style={[styles.charCountLabel, { color: colors.textSecondary }]}>
                {incomingEssay.length} chars
              </Text>
            </View>

            <Text style={[styles.submitTopicTitle, { color: colors.text }]}>
              {incomingTopic}
            </Text>

            <View
              style={[
                styles.manuscriptPreview,
                { backgroundColor: colors.cardMuted, borderColor: colors.border },
              ]}>
              <Text
                numberOfLines={4}
                style={[styles.manuscriptText, { color: colors.text }]}>
                {incomingEssay}
              </Text>
            </View>

            <Text style={[styles.submitHint, { color: colors.textSecondary }]}>
              VocabJip မှ TOPIK Contributors များက သင့်စာမူကို ဖတ်ရှုပြီး အမှတ်ပေးခြင်း၊ အားသာချက်/အားနည်းချက်နှင့် အဆင့်မြင့်ဝါကျ ပြင်ဆင်ချက်များကို ပြန်လည်ပေးပို့ပေးပါမည်။
            </Text>

            <TouchableOpacity
              onPress={handleSubmitToContributor}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.accent }]}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    Submit to Contributors for Grading
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Confirmation Banner */}
        {bannerMsg && (
          <View
            style={[
              styles.successBanner,
              { backgroundColor: colors.successLight, borderColor: colors.success },
            ]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.successBannerText, { color: colors.text }]}>
              {bannerMsg}
            </Text>
          </View>
        )}

        {/* Submissions Queue / History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Essay Submissions ({submissions.length})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            စာမူတစ်ခုကိုနှိပ်၍ Contributor ၏ သုံးသပ်ချက် အပြည့်အစုံကို ကြည့်ပါ
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading contributor evaluations...
            </Text>
          </View>
        ) : (
          <View style={styles.submissionsList}>
            {submissions.map((item) => {
              const isSelected = selectedSubmission?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedSubmission(isSelected ? null : item)
                  }
                  style={[
                    styles.submissionItemCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                      borderWidth: isSelected ? 1.8 : 1,
                    },
                  ]}>
                  {/* Top Row: Question Type + Status Badge */}
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemLeftTags}>
                      <View
                        style={[
                          styles.typeTag,
                          {
                            backgroundColor:
                              item.question_type === 'Q53'
                                ? colors.accentLight
                                : colors.streakLight,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.typeTagText,
                            {
                              color:
                                item.question_type === 'Q53'
                                  ? colors.accent
                                  : colors.streak,
                            },
                          ]}>
                          {item.question_type}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.itemTopicTitle, { color: colors.text }]}>
                        {item.deliveryStatus === 'local_only' ? `Saved locally · Resubmit from your draft · ${item.prompt_title}` : item.deliveryStatus === 'queued' ? `Waiting to send · ${item.prompt_title}` : item.prompt_title}
                      </Text>
                    </View>

                    {item.status === 'pending' && (
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: '#FEF3C7' },
                        ]}>
                        <Ionicons name="time-outline" size={12} color="#B45309" />
                        <Text style={[styles.statusPillText, { color: '#B45309' }]}>
                          {item.deliveryStatus === 'local_only' ? 'Saved only' : item.deliveryStatus === 'queued' ? 'Waiting to send' : 'Pending'}
                        </Text>
                      </View>
                    )}

                    {item.status === 'in_review' && (
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: '#E0E7FF' },
                        ]}>
                        <Ionicons name="create-outline" size={12} color="#4338CA" />
                        <Text style={[styles.statusPillText, { color: '#4338CA' }]}>
                          In Review
                        </Text>
                      </View>
                    )}

                    {item.status === 'reviewed' && (
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: '#D1FAE5' },
                        ]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#047857"
                        />
                        <Text style={[styles.statusPillText, { color: '#047857' }]}>
                          {item.score}/{item.max_score} pts
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Essay Snippet */}
                  <Text
                    numberOfLines={isSelected ? undefined : 2}
                    style={[styles.essaySnippet, { color: colors.textSecondary }]}>
                    {item.content}
                  </Text>

                  {/* Contributor Attribution Footer */}
                  <View style={styles.itemFooterRow}>
                    <Text style={[styles.charMeta, { color: colors.textMuted }]}>
                      {item.char_count} chars
                    </Text>

                    {item.reviewer_name ? (
                      <View style={styles.reviewerBadge}>
                        <Ionicons name="school" size={12} color="#B45309" />
                        <Text style={styles.reviewerNameText}>
                          {item.reviewer_name}
                        </Text>
                        {/* {item.reviewer_rank ? (
                          <View style={styles.reviewerRankPill}>
                            <Text style={styles.reviewerRankText}>
                              {item.reviewer_rank}
                            </Text>
                          </View>
                        ) : null} */}
                      </View>
                    ) : (
                      <Text style={[styles.waitingMeta, { color: colors.textMuted }]}>
                        Waiting for available mentor...
                      </Text>
                    )}
                  </View>

                  {/* Expanded Evaluation Details */}
                  {isSelected && (
                    <View
                      style={[
                        styles.evaluationDetailBox,
                        { borderTopColor: colors.border },
                      ]}>
                      {item.status !== 'reviewed' ? (
                        <View
                          style={[
                            styles.pendingNoticeBox,
                            { backgroundColor: colors.cardMuted },
                          ]}>
                          <Ionicons
                            name={
                              item.status === 'in_review'
                                ? 'person-circle-outline'
                                : 'hourglass-outline'
                            }
                            size={22}
                            color={colors.accent}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.pendingNoticeTitle,
                                { color: colors.text },
                              ]}>
                              {item.status === 'in_review'
                                ? `${item.reviewer_name || 'Contributor'} မှ သင့်စာမူကို လက်ရှိ စစ်ဆေးပေးနေပါသည်`
                                : 'Contributors များ စစ်ဆေးရန် စောင့်ဆိုင်းနေပါသည်'}
                              {/* (${item.reviewer_rank || 'Mentor'}) */}
                            </Text>
                            <Text
                              style={[
                                styles.pendingNoticeDesc,
                                { color: colors.textSecondary },
                              ]}>
                              စစ်ဆေးပြီးပါက အမှတ်နှင့် အသေးစိတ် အကြံပြုချက်များကို ဤနေရာတွင် ဖတ်ရှုနိုင်ပါမည်။
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.gradedContent}>
                          {/* Score & Contributor Rank Banner */}
                          <View
                            style={[
                              styles.scoreBanner,
                              {
                                backgroundColor: colors.accentLight,
                                borderColor: colors.accent,
                              },
                            ]}>


                            <View style={styles.scoreCircle}>
                              <Text
                                style={[
                                  styles.scoreBigNumber,
                                  { color: colors.accent },
                                ]}>
                                {item.score}
                              </Text>
                              <Text
                                style={[
                                  styles.scoreMaxNumber,
                                  { color: colors.textSecondary },
                                ]}>
                                /{item.max_score}
                              </Text>
                            </View>
                          </View>

                          {/* Strengths */}
                          {Boolean(item.strengths) && (
                            <View
                              style={[
                                styles.feedbackBlock,
                                { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                              ]}>
                              <Text
                                style={[
                                  styles.feedbackBlockTitle,
                                  { color: '#065F46' },
                                ]}>
                                ✅ အားသာချက်များ (Strengths)
                              </Text>
                              <Text
                                style={[
                                  styles.feedbackBlockBody,
                                  { color: '#064E3B' },
                                ]}>
                                {item.strengths}
                              </Text>
                            </View>
                          )}

                          {/* Areas for Improvement */}
                          {Boolean(item.improvements) && (
                            <View
                              style={[
                                styles.feedbackBlock,
                                { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
                              ]}>
                              <Text
                                style={[
                                  styles.feedbackBlockTitle,
                                  { color: '#92400E' },
                                ]}>
                                🛠️ ပြင်ဆင်သင့်သည့် အချက်များ (Areas to Improve)
                              </Text>
                              <Text
                                style={[
                                  styles.feedbackBlockBody,
                                  { color: '#78350F' },
                                ]}>
                                {item.improvements}
                              </Text>
                            </View>
                          )}

                          {/* Corrected Model Rewrite */}
                          {Boolean(item.corrected_sample) && (
                            <View
                              style={[
                                styles.feedbackBlock,
                                { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
                              ]}>
                              <Text
                                style={[
                                  styles.feedbackBlockTitle,
                                  { color: '#3730A3' },
                                ]}>
                                ✨ Contributor ပြင်ဆင်ပေးထားသော အဆင့်မြင့်ဝါကျ (Model Rewrite)
                              </Text>
                              <Text
                                style={[
                                  styles.feedbackBlockBody,
                                  { color: '#1E1B4B', fontWeight: '600' },
                                ]}>
                                {item.corrected_sample}
                              </Text>
                            </View>
                          )}

                          {/* Overall Comment */}
                          {Boolean(item.overall_comment) && (
                            <View
                              style={[
                                styles.feedbackBlock,
                                {
                                  backgroundColor: colors.cardMuted,
                                  borderColor: colors.border,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.feedbackBlockTitle,
                                  { color: colors.text },
                                ]}>
                                💬 Contributor ၏ အထွေထွေ သုံးသပ်ချက် (Notes)
                              </Text>
                              <Text
                                style={[
                                  styles.feedbackBlockBody,
                                  { color: colors.textSecondary },
                                ]}>
                                {item.overall_comment}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 48,
  },
  submitCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  submitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  charCountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitTopicTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  manuscriptPreview: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  manuscriptText: {
    fontSize: 13,
    lineHeight: 20,
  },
  submitHint: {
    fontSize: 12,
    lineHeight: 19,
  },
  submitBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  successBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    marginTop: 4,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  submissionsList: {
    gap: 12,
  },
  submissionItemCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemLeftTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemTopicTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  essaySnippet: {
    fontSize: 13,
    lineHeight: 20,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  charMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  waitingMeta: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  reviewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  reviewerRankPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewerRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  evaluationDetailBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pendingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  pendingNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  pendingNoticeDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  gradedContent: {
    gap: 10,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scoreBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reviewerAttributionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewerFullTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rankHighlightBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankHighlightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreBigNumber: {
    fontSize: 26,
    fontWeight: '900',
  },
  scoreMaxNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  feedbackBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackBlockBody: {
    fontSize: 13,
    lineHeight: 21,
  },
});
