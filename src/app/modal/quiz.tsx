import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface QuizQuestion {
  id: number;
  spokenWord: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  exampleSentence: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    spokenWord: '그래서',
    questionText: 'What is the academic written form of "그래서" (Therefore)?',
    options: ['그러나', '따라서', '비록', '하지만'],
    correctIndex: 1,
    explanation: '"따라서" or "그러므로" is the formal written connective for cause and effect.',
    exampleSentence: '인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다.',
  },
  {
    id: 2,
    spokenWord: '근데',
    questionText: 'Which word should replace "근데" (However) in formal writing?',
    options: ['그러나', '그리고', '그리하여', '따라서'],
    correctIndex: 0,
    explanation: '"그러나" introduces contrast between ideas in written Korean essays.',
    exampleSentence: '스마트폰은 편리하다. 그러나 과도한 사용은 건강을 해칠 수 있다.',
  },
  {
    id: 3,
    spokenWord: '진짜 / 너무',
    questionText: 'Choose the academic substitute for "진짜 / 너무" (Very / Extremely):',
    options: ['조금', '매우 / 대단히', '가끔', '별로'],
    correctIndex: 1,
    explanation: 'Avoid colloquial "너무" or "진짜"; use "매우" or "상당히" to express intensity.',
    exampleSentence: '이 문제는 사회적으로 매우 심각한 영향을 미친다.',
  },
  {
    id: 4,
    spokenWord: '생각하다',
    questionText: 'In TOPIK Q54, how should you state an opinion instead of "생각하다"?',
    options: ['주장하다 / 여기다', '말하다', '보다', '듣다'],
    correctIndex: 0,
    explanation: 'Use "주장하다" (to claim) or "~라고 여겨진다" (is considered) for academic weight.',
    exampleSentence: '조기 교육보다 인성 교육이 더 중요하다고 주장한다.',
  },
  {
    id: 5,
    spokenWord: '늘어나다',
    questionText: 'Which term is used in Q53 graphs to describe an increase?',
    options: ['줄어들다', '감소하다', '증가하다', '하락하다'],
    correctIndex: 2,
    explanation: '"증가하다" or "급증하다" is the standard statistical terminology for rising trends.',
    exampleSentence: '1인 가구의 비율이 지난 10년간 크게 증가하였다.',
  },
];

export default function QuizModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const isCorrect = selectedOption === currentQ?.correctIndex;

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  // Result Screen
  if (isFinished) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          <View style={[styles.resultIconCircle, { backgroundColor: colors.streakLight }]}>
            <Ionicons name="trophy" size={42} color={colors.streak} />
          </View>

          <Text style={[styles.resultTitle, { color: colors.text }]}>
            Session Complete
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
            You showed up. That counts.
          </Text>

          <View
            style={[
              styles.scoreCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              TODAY'S PRACTICE
            </Text>
            <Text style={[styles.scoreValue, { color: colors.accent }]}>
              {score} / {QUIZ_QUESTIONS.length}
            </Text>
            <Text style={[styles.scoreNotice, { color: colors.textSecondary }]}>
              {score >= 4
                ? 'Excellent mastery of written academic Korean!'
                : 'Great practice! Review incorrect words to build writing reflex.'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRestart}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Practice Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Progress */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.accent,
              width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View
          style={[
            styles.questionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.spokenWordPrompt, { color: colors.accent }]}>
            "{currentQ.spokenWord}"
          </Text>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {currentQ.questionText}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
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
                onPress={() => handleSelectOption(idx)}
                style={[
                  styles.optionCard,
                  { backgroundColor: optionBg, borderColor: optionBorder },
                ]}>
                <View
                  style={[
                    styles.optionLetterCircle,
                    {
                      borderColor: optionBorder,
                      backgroundColor: isSelected ? optionBorder : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.optionLetter,
                      { color: isSelected ? '#FFFFFF' : textColor },
                    ]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Section (appears after submitting) */}
        {isAnswerSubmitted && (
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect ? colors.successLight : colors.errorLight,
                borderColor: isCorrect ? colors.success : colors.error,
              },
            ]}>
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect ? colors.success : colors.error },
                ]}>
                {isCorrect ? 'Nice work!' : 'Almost there!'}
              </Text>
            </View>

            <Text style={[styles.feedbackExplanation, { color: colors.text }]}>
              {currentQ.explanation}
            </Text>

            <View style={[styles.exampleBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.exampleLabel, { color: colors.textSecondary }]}>
                EXAMPLE USAGE:
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
            ]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Check Answer
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              {currentIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}
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
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 16,
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
    fontSize: 13,
    lineHeight: 19,
  },
  bottomBar: {
    padding: Spacing.four,
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
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 10,
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
    gap: 12,
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  resultSubtitle: {
    fontSize: 14,
  },
  scoreCard: {
    width: '100%',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '800',
  },
  scoreNotice: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
