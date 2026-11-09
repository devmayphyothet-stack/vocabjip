import { useLearningPreferences } from '@/context/learning-preferences-context';
import { CurriculumStatus } from '@/components/CurriculumStatus';
import { createQuizSession, restoreQuizSession, QuizSession } from '@/lib/quiz-session';
import { LearningSessionService } from '@/services/learning-session-service';
import { accountKey, setAccountItem } from '@/lib/account-storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  RefreshControl,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { QuizStepItem, QuizTopicItem } from '@/data/quiz-data';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCurriculum } from '@/hooks/use-curriculum';
import { StreakService } from '@/services/streak-service';

const QUIZ_PROGRESS_KEY = '@vocabjip_quiz_step_progress';

// Map of stepId -> { bestScore: number; passed: boolean }
type StepProgressMap = Record<string, { bestScore: number; passed: boolean }>;

type QuizViewMode = 'topics' | 'steps' | 'playing' | 'result';

export default function QuizModal() {
  const { user } = useAuth();
  const { preferences, t } = useLearningPreferences();
  const params = useLocalSearchParams<{ resume?: string }>();
  const [pausedSession, setPausedSession] = useState<QuizSession | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const resumeAttempted = useRef(false);
  const answersRef = useRef<number[]>([]);
  const finishing = useRef(false);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { quizTopics, isSyncing, isLoading, syncNow } = useCurriculum();

  const [viewMode, setViewMode] = useState<QuizViewMode>('topics');
  const [selectedTopic, setSelectedTopic] = useState<QuizTopicItem | null>(null);
  const [selectedStep, setSelectedStep] = useState<QuizStepItem | null>(null);
  const [progressMap, setProgressMap] = useState<StepProgressMap>({});

  // Playing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let active = true;
    void LearningSessionService.read(user?.id)
      .then((value) => {
        if (active) {
          setPausedSession(value);
          setResumeLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setNotice(t('progressFailed'));
          setResumeLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Load saved step progress from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(accountKey(QUIZ_PROGRESS_KEY, user?.id));
        if (raw) {
          setProgressMap(JSON.parse(raw));
        }
      } catch {
        // Ignore storage read errors
      }
    })();
  }, []);

  // Keep selectedTopic synced if quizTopics updates
  useEffect(() => {
    if (selectedTopic) {
      const updated = quizTopics.find((t) => t.id === selectedTopic.id);
      if (updated) setSelectedTopic(updated);
    }
  }, [quizTopics]);

  const saveStepResult = async (stepId: string, finalScore: number, requiredScore: number) => {
    const passed = finalScore >= requiredScore;
    const raw = await AsyncStorage.getItem(accountKey(QUIZ_PROGRESS_KEY, user?.id));
    const savedProgress: StepProgressMap = raw ? JSON.parse(raw) : {};
    const existing = savedProgress[stepId];
    const updated = {
      ...savedProgress,
      [stepId]: {
        bestScore: Math.max(existing?.bestScore || 0, finalScore),
        passed: !!existing?.passed || passed,
      },
    };
    await setAccountItem(QUIZ_PROGRESS_KEY, JSON.stringify(updated), user?.id);
    setProgressMap(updated);
  };

  // Determine if a step inside a topic is unlocked:
  // Step 1 (index 0) is ALWAYS unlocked.
  // Step N (index > 0) is unlocked only if Step N-1 has passed (bestScore >= passingScore, i.e., >= 3).
  const isStepUnlocked = (topic: QuizTopicItem, stepIndex: number): boolean => {
    if (stepIndex === 0) return true;
    const prevStep = topic.steps[stepIndex - 1];
    if (!prevStep) return true;
    return Boolean(progressMap[prevStep.id]?.passed);
  };

  const handleSelectTopic = (topic: QuizTopicItem) => {
    setSelectedTopic(topic);
    setViewMode('steps');
  };

  const persistSession = (step: QuizStepItem, index: number, answers: number[]) => {
    const next = createQuizSession(step, index, answers);
    setPausedSession(next);
    void LearningSessionService.write(next, user?.id).catch(() => setNotice(t('progressFailed')));
  };

  function resumeSavedSession(session: QuizSession | null) {
    if (!session || isLoading) return;
    const topic = quizTopics.find((topic) => topic.id === session.topicId);
    const step = topic?.steps.find((step) => step.id === session.stepId);
    const restored = step && restoreQuizSession(session, step);
    if (!topic || !step) {
      setNotice(t('unavailableLesson'));
      return;
    }
    if (!restored) {
      setNotice(t('quizChanged'));
      void LearningSessionService.write(null, user?.id).catch(() => setNotice(t('progressFailed')));
      setPausedSession(null);
      return;
    }
    setSelectedTopic(topic);
    setSelectedStep(step);
    setCurrentIndex(restored.index);
    setSelectedOption(restored.selectedOption);
    setIsAnswerSubmitted(restored.submitted);
    setScore(restored.score);
    answersRef.current = restored.answers;
    setViewMode('playing');
  }
  const startFreshStep = (step: QuizStepItem) => {
    answersRef.current = [];
    finishing.current = false;
    persistSession(step, 0, []);
    setSelectedStep(step);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setNotice('');
    setViewMode('playing');
  };
  const handleStartStep = (step: QuizStepItem) => {
    if (!resumeLoaded || isLoading) {
      setNotice(t('loadingLessons'));
      return;
    }
    if (!step.questions.length) {
      setNotice(t('quizChanged'));
      return;
    }
    if (pausedSession?.stepId === step.id) {
      resumeSavedSession(pausedSession);
      return;
    }
    if (pausedSession) {
      Alert.alert(t('replaceQuiz'), t('replaceQuizHelp'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('start'), onPress: () => startFreshStep(step) },
      ]);
      return;
    }
    startFreshStep(step);
  };
  useEffect(() => {
    if (
      isLoading ||
      !resumeLoaded ||
      !quizTopics.length ||
      params.resume !== '1' ||
      resumeAttempted.current
    )
      return;
    resumeAttempted.current = true;
    resumeSavedSession(pausedSession);
  }, [resumeLoaded, quizTopics, params.resume, isLoading]);

  const questions = selectedStep?.questions || [];
  const currentQ = questions[currentIndex];
  const isCorrect = selectedOption === currentQ?.correctIndex;

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || !currentQ || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    answersRef.current = [...answersRef.current.slice(0, currentIndex), selectedOption];
    if (selectedStep) persistSession(selectedStep, currentIndex, answersRef.current);
    setScore(
      answersRef.current.reduce(
        (total, answer, index) =>
          total + Number(answer === selectedStep?.questions[index]?.correctIndex),
        0,
      ),
    );
  };

  const handleNext = async () => {
    if (!selectedStep || !isAnswerSubmitted || finishing.current) return;
    if (currentIndex < questions.length - 1) {
      persistSession(selectedStep, currentIndex + 1, answersRef.current);
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      const required = selectedStep.passingScore || 3;
      finishing.current = true;
      try {
        await saveStepResult(selectedStep.id, score, required);
        await LearningSessionService.write(null, user?.id);
        setPausedSession(null);
        void StreakService.recordActivity(user?.id);
        setViewMode('result');
      } catch {
        finishing.current = false;
        setNotice(t('progressFailed'));
      }
    }
  };

  const handleRetryStep = () => {
    if (!selectedStep) return;
    handleStartStep(selectedStep);
  };

  const handleContinueNextStep = () => {
    if (!selectedTopic || !selectedStep) return;
    const currentStepIdx = selectedTopic.steps.findIndex((s) => s.id === selectedStep.id);
    const nextStep = selectedTopic.steps[currentStepIdx + 1];
    if (nextStep) {
      handleStartStep(nextStep);
    } else {
      setViewMode('steps');
    }
  };

  // ============================================================
  // VIEW 1: TOPIC SELECTION LIST
  // ============================================================
  if (viewMode === 'topics') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {notice ? (
          <Text accessibilityRole="alert" style={{ padding: 16, color: colors.error }}>
            {notice}
          </Text>
        ) : null}
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            onPress={() => router.back()}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>{t('topics')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('retry')}
            onPress={syncNow}
            style={styles.closeBtn}
          >
            <Ionicons name="sync-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <CurriculumStatus />
        {pausedSession && (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isLoading}
            onPress={() => resumeSavedSession(pausedSession)}
            style={{ minHeight: 48, padding: 16 }}
          >
            <Text style={{ color: colors.accent }}>
              {t('resumeQuiz')} · {pausedSession.title}
            </Text>
          </TouchableOpacity>
        )}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={syncNow} />}
        >
          <View style={styles.heroHeader}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t('chooseTopic')}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              {t('quizHelp')}
            </Text>
          </View>

          {quizTopics.map((topic) => {
            const totalSteps = topic.steps.length;
            const passedSteps = topic.steps.filter((s) => progressMap[s.id]?.passed).length;

            return (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.8}
                onPress={() => handleSelectTopic(topic)}
                style={[
                  styles.topicCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.topicCardTop}>
                  <View style={[styles.categoryPill, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.categoryPillText, { color: colors.accent }]}>
                      {topic.category}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.stepCountBadge,
                      {
                        backgroundColor:
                          passedSteps === totalSteps && totalSteps > 0
                            ? colors.successLight
                            : colors.cardMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        passedSteps === totalSteps && totalSteps > 0
                          ? 'checkmark-circle'
                          : 'layers-outline'
                      }
                      size={14}
                      color={
                        passedSteps === totalSteps && totalSteps > 0
                          ? colors.success
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.stepCountText,
                        {
                          color:
                            passedSteps === totalSteps && totalSteps > 0
                              ? colors.success
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {passedSteps}/{totalSteps} Steps
                    </Text>
                  </View>
                </View>

                <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                <Text style={[styles.topicMyanmar, { color: colors.textSecondary }]}>
                  {topic.myanmarTitle}
                </Text>

                {topic.description ? (
                  <Text style={[styles.topicDesc, { color: colors.textMuted }]}>
                    {topic.description}
                  </Text>
                ) : null}

                {/* Contributor Display Name & Rank Attribution */}
                <View style={[styles.contributorBar, { borderTopColor: colors.borderLight }]}>
                  <View style={styles.contributorInfo}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                        {(topic.authorName || 'C')[0].toUpperCase()}
                      </Text>
                    </View>
                    {/* <View>
                      <Text style={[styles.contributorName, { color: colors.text }]}>
                        {topic.authorName}
                      </Text>
                      <View style={styles.rankBadgeRow}>
                        <Ionicons name="ribbon" size={12} color={colors.streak} />
                        <Text style={[styles.contributorRank, { color: colors.streak }]}>
                          {topic.authorRank}
                        </Text>
                      </View>
                    </View> */}
                  </View>

                  <View style={[styles.enterTopicBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.enterTopicBtnText, { color: colors.primaryContrast }]}>
                      View Steps
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primaryContrast} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // VIEW 2: STEP-BY-STEP UNLOCK MAP INSIDE A TOPIC
  // ============================================================
  if (viewMode === 'steps' && selectedTopic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {notice ? (
          <Text accessibilityRole="alert" style={{ padding: 16, color: colors.error }}>
            {notice}
          </Text>
        ) : null}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setViewMode('topics')} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
            {selectedTopic.title}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Topic Summary Card */}
          <View
            style={[
              styles.topicBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.topicBannerCategory, { color: colors.accent }]}>
              {selectedTopic.category.toUpperCase()}
            </Text>
            <Text style={[styles.topicBannerTitle, { color: colors.text }]}>
              {selectedTopic.myanmarTitle}
            </Text>
            <Text style={[styles.topicBannerRule, { color: colors.textSecondary }]}>
              🎯 Step တစ်ခုတွင် မေးခွန်း ၅ ပုဒ်ပါဝင်ပြီး အနည်းဆုံး ၃ ပုဒ်မှန်မှ နောက်ထပ် Step
              ပွင့်ပါမည်။
            </Text>
          </View>

          {/* Steps Progression List */}
          <View style={styles.stepsList}>
            {selectedTopic.steps.map((step, idx) => {
              const unlocked = isStepUnlocked(selectedTopic, idx);
              const stepRecord = progressMap[step.id];
              const isPassed = Boolean(stepRecord?.passed);
              const bestScore = stepRecord?.bestScore ?? null;
              const qCount = step.questions.length || 5;
              const reqScore = step.passingScore || 3;

              return (
                <TouchableOpacity
                  key={step.id}
                  disabled={!unlocked}
                  activeOpacity={0.8}
                  onPress={() => handleStartStep(step)}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: unlocked ? colors.card : colors.cardMuted,
                      borderColor: isPassed
                        ? colors.success
                        : unlocked
                          ? colors.accent
                          : colors.border,
                      opacity: unlocked ? 1 : 0.65,
                    },
                  ]}
                >
                  <View style={styles.stepHeaderRow}>
                    <View style={styles.stepBadgeGroup}>
                      <View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor: isPassed
                              ? colors.success
                              : unlocked
                                ? colors.accent
                                : colors.border,
                          },
                        ]}
                      >
                        {isPassed ? (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        ) : unlocked ? (
                          <Text style={styles.stepCircleText}>{step.stepNumber}</Text>
                        ) : (
                          <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                        <Text style={[styles.stepMeta, { color: colors.textSecondary }]}>
                          {qCount} Questions • Need {reqScore}/{qCount} to unlock next
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Contributor Attribution for this Step */}
                  <View
                    style={[
                      styles.stepContributorRow,
                      { backgroundColor: colors.background, borderColor: colors.borderLight },
                    ]}
                  >
                    <View style={styles.contributorInfo}>
                      <Ionicons name="person-circle-outline" size={18} color={colors.accent} />
                      <Text style={[styles.stepContributorName, { color: colors.text }]}>
                        {step.authorName}
                      </Text>
                      {/* <View
                        style={[
                          styles.rankMiniPill,
                          { backgroundColor: colors.streakLight },
                        ]}>
                        <Ionicons name="trophy" size={10} color={colors.streak} />
                        <Text style={[styles.rankMiniText, { color: colors.streak }]}>
                          {step.authorRank}
                        </Text>
                      </View> */}
                    </View>

                    {bestScore !== null ? (
                      <Text
                        style={[
                          styles.bestScoreTag,
                          { color: isPassed ? colors.success : colors.streak },
                        ]}
                      >
                        Best: {bestScore}/{qCount}
                      </Text>
                    ) : null}
                  </View>

                  {/* Bottom Action Row */}
                  <View style={styles.stepFooter}>
                    {!unlocked ? (
                      <View style={styles.lockedRow}>
                        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                        <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                          Score at least {reqScore}/{qCount} in Step {step.stepNumber - 1} to unlock
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.unlockedRow}>
                        <Text
                          style={[
                            styles.startStepLabel,
                            { color: isPassed ? colors.success : colors.accent },
                          ]}
                        >
                          {isPassed ? 'Passed • Practice Again' : 'Start Step Now'}
                        </Text>
                        <Ionicons
                          name="play-circle"
                          size={20}
                          color={isPassed ? colors.success : colors.accent}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // VIEW 3: RESULT SCREEN (SHOWS IF NEXT STEP UNLOCKED)
  // ============================================================
  if (viewMode === 'result' && selectedStep && selectedTopic) {
    const qTotal = questions.length || 5;
    const reqScore = selectedStep.passingScore || 3;
    const passed = score >= reqScore;

    const currentStepIdx = selectedTopic.steps.findIndex((s) => s.id === selectedStep.id);
    const hasNextStep = currentStepIdx >= 0 && currentStepIdx < selectedTopic.steps.length - 1;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {notice ? (
          <Text accessibilityRole="alert" style={{ padding: 16, color: colors.error }}>
            {notice}
          </Text>
        ) : null}
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={() => setViewMode('steps')}
            style={styles.closeBtn}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>{t('stepResult')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIconCircle,
              { backgroundColor: passed ? colors.successLight : colors.streakLight },
            ]}
          >
            <Ionicons
              name={passed ? 'trophy' : 'refresh-circle'}
              size={44}
              color={passed ? colors.success : colors.streak}
            />
          </View>

          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {t(passed ? 'stepPassed' : 'almostThere')}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
            {passed
              ? t(hasNextStep ? 'nextStep' : 'stepPassed')
              : `${t('retryStep')} · ${t('passTarget')}: ${reqScore}/${qTotal}`}
          </Text>

          <View
            style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              {t('passTarget')}: {reqScore}/{qTotal}
            </Text>
            <Text style={[styles.scoreValue, { color: passed ? colors.success : colors.streak }]}>
              {score} / {qTotal}
            </Text>
            <Text style={[styles.scoreNotice, { color: colors.textSecondary }]}>
              Quiz Created by {selectedStep.authorName}
              {/* ({selectedStep.authorRank}) */}
            </Text>
          </View>

          {passed && hasNextStep ? (
            <TouchableOpacity
              onPress={handleContinueNextStep}
              style={[styles.primaryBtn, { backgroundColor: colors.success }]}
            >
              <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
                {t('nextStep')} · {selectedStep.stepNumber + 1} →
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleRetryStep}
            style={[
              styles.primaryBtn,
              { backgroundColor: passed && hasNextStep ? colors.cardMuted : colors.primary },
            ]}
          >
            <Text
              style={[
                styles.primaryBtnText,
                {
                  color: passed && hasNextStep ? colors.text : colors.primaryContrast,
                },
              ]}
            >
              {t('retryStep')} · {selectedStep.stepNumber}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('steps')}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t('stepsMap')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // VIEW 4: ACTIVE 5-QUESTION QUIZ SESSION
  // ============================================================
  if (!currentQ || !selectedStep) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {notice ? (
        <Text accessibilityRole="alert" style={{ padding: 16, color: colors.error }}>
          {notice}
        </Text>
      ) : null}
      {/* Top Bar with Progress */}
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={() => setViewMode('steps')}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {t('step')} {selectedStep.stepNumber} • {t('question')} {currentIndex + 1}/
            {questions.length}
          </Text>
          <Text style={[styles.passReqSmall, { color: colors.textSecondary }]}>
            {t('passTarget')}: {selectedStep.passingScore || 3}/{questions.length}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress Bar */}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t('quiz')}
        accessibilityValue={{ min: 0, max: questions.length, now: currentIndex + 1 }}
        style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.accent,
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contributor Attribution Banner inside Quiz */}
        <View
          style={[
            styles.quizContributorChip,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.contributorInfo}>
            <View style={[styles.avatarCircleSmall, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.avatarLetterSmall, { color: colors.accent }]}>
                {(selectedStep.authorName || 'C')[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.chipAuthorName, { color: colors.text }]}>
                Contributed by {selectedStep.authorName}
              </Text>
              {/* <Text style={[styles.chipAuthorRank, { color: colors.streak }]}>
                🏆 {selectedStep.authorRank}
              </Text> */}
            </View>
          </View>
        </View>

        {/* Question Card */}
        <View
          style={[
            styles.questionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.spokenWordPrompt, { color: colors.accent }]}>
            "{currentQ.spokenWord}"
          </Text>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {preferences.language === 'my'
              ? currentQ.myanmarQuestionText || currentQ.questionText
              : currentQ.questionText}
          </Text>
        </View>

        {/* Options */}
        <View accessibilityRole="radiogroup" style={styles.optionsList}>
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            let optionBg: string = colors.card;
            let optionBorder: string = colors.border;
            let textColor: string = colors.text;

            if (isAnswerSubmitted) {
              if (idx === currentQ.correctIndex) {
                optionBg = colors.successLight;
                optionBorder = colors.success;
                textColor = colors.success;
              } else if (isSelected && !isCorrect) {
                optionBg = colors.errorLight;
                optionBorder = colors.error;
                textColor = colors.error;
              }
            } else if (isSelected) {
              optionBg = colors.accentLight;
              optionBorder = colors.accent;
              textColor = colors.accent;
            }

            return (
              <TouchableOpacity
                key={idx}
                disabled={isAnswerSubmitted}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ checked: isSelected, disabled: isAnswerSubmitted }}
                onPress={() => handleSelectOption(idx)}
                style={[
                  styles.optionCard,
                  { backgroundColor: optionBg, borderColor: optionBorder },
                ]}
              >
                <View
                  style={[
                    styles.optionLetterCircle,
                    {
                      borderColor: optionBorder,
                      backgroundColor: isSelected ? optionBorder : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[styles.optionLetter, { color: isSelected ? '#FFFFFF' : textColor }]}
                  >
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Section */}
        {isAnswerSubmitted && (
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect ? colors.successLight : colors.errorLight,
                borderColor: isCorrect ? colors.success : colors.error,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? colors.success : colors.error}
              />
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.feedbackTitle, { color: isCorrect ? colors.success : colors.error }]}
              >
                {t(isCorrect ? 'correct' : 'keepLearning')}
              </Text>
            </View>

            <Text style={[styles.feedbackExplanation, { color: colors.text }]}>
              {preferences.language === 'en'
                ? currentQ.englishExplanation || currentQ.explanation
                : currentQ.explanation}
            </Text>

            <View style={[styles.exampleBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.exampleLabel, { color: colors.textSecondary }]}>
                {t('example')}
              </Text>
              <Text style={[styles.exampleSentence, { color: colors.text }]}>
                {currentQ.exampleSentence}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        {!isAnswerSubmitted ? (
          <TouchableOpacity
            onPress={handleCheckAnswer}
            disabled={selectedOption === null}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              selectedOption === null && { opacity: 0.4 },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              {t('checkAnswer')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              {t(currentIndex < questions.length - 1 ? 'nextQuestion' : 'seeResults')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '70%',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  passReqSmall: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: 3,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroHeader: {
    marginBottom: 4,
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  topicCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  topicCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stepCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  topicMyanmar: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  topicDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  contributorBar: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contributorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '800',
  },
  contributorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  rankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contributorRank: {
    fontSize: 11,
    fontWeight: '700',
  },
  enterTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enterTopicBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topicBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  topicBannerCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topicBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  topicBannerRule: {
    fontSize: 12,
    lineHeight: 18,
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  stepMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  stepContributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  stepContributorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  rankMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bestScoreTag: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepFooter: {
    paddingTop: 2,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startStepLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  quizContributorChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetterSmall: {
    fontSize: 12,
    fontWeight: '800',
  },
  chipAuthorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipAuthorRank: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  spokenWordPrompt: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackExplanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBox: {
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  exampleLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  exampleSentence: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bottomBar: {
    padding: Spacing.four,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  resultIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  scoreCard: {
    width: '100%',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: '800',
  },
  scoreNotice: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
