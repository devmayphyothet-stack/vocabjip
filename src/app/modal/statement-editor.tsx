import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { STATEMENT_SECTIONS } from '@/data/statement-sections';
import { useSaved } from '@/context/saved-context';
import { useAi } from '@/context/ai-context';
import { useAuth } from '@/context/auth-context';
import { StreakService } from '@/services/streak-service';

export default function StatementEditorModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);
  const { saveDraft } = useSaved();
  const { isConnected } = useAi();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ university?: string; major?: string }>();

  const targetUniversity = params.university || 'Korean University';
  const targetMajor = params.major || 'Selected Major';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Store contents of the 4 sections
  const [sectionTexts, setSectionTexts] = useState<Record<string, string>>({
    background:
      '저는 고등학교 시절부터 한국어와 한국 문화에 깊은 관심을 가지게 되었습니다. 특히 언어를 통해 새로운 세상을 배울 수 있다는 점에 매료되었으며, 어려운 환경 속에서도 주도적으로 학습을 지속해 왔습니다.',
    motivation:
      '귀교의 탁월한 학문적 성과와 세계적인 연구 역량에 깊은 인상을 받아 지원하게 되었습니다. 본 학과에서 심도 있는 학업을 이어가며 글로벌 인재로 성장하고자 합니다.',
    study_plan: '',
    future_goals: '',
  });

  const currentSection = STATEMENT_SECTIONS[currentStepIndex];
  const currentContent = sectionTexts[currentSection.id] || '';

  const handleTextChange = (text: string) => {
    setSectionTexts((prev) => ({
      ...prev,
      [currentSection.id]: text,
    }));
  };

  const handleAppendPhrase = (phrase: string) => {
    setSectionTexts((prev) => {
      const existing = prev[currentSection.id] || '';
      const separator = existing.endsWith('.') || existing.length === 0 ? ' ' : '\n';
      return {
        ...prev,
        [currentSection.id]: existing ? `${existing}${separator}${phrase}` : phrase,
      };
    });
  };

  const handleSaveDraft = async () => {
    await saveDraft({
      id: `statement-${Date.now()}`,
      type: 'statement',
      title: `${targetUniversity} - ${targetMajor} (${currentSection.title})`,
      content: currentContent,
      charCount: currentContent.length,
    });
    if (currentContent.trim().length > 10) {
      StreakService.recordActivity(user?.id);
    }
    Alert.alert('Draft Saved', 'Your statement draft is safely saved on this device and synced.');
  };

  const handleGetAiFeedback = () => {
    if (!currentContent.trim()) {
      Alert.alert('Empty Section', 'Please write a few sentences before requesting AI coaching.');
      return;
    }

    if (!isConnected) {
      router.push('/modal/ai-connect');
    } else {
      router.push({
        pathname: '/modal/statement-feedback',
        params: {
          sectionTitle: currentSection.title,
          koreanTitle: currentSection.koreanTitle,
          text: currentContent,
          university: targetUniversity,
          major: targetMajor,
        },
      });
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STATEMENT_SECTIONS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSaveDraft();
      Alert.alert('Congratulations!', 'You have drafted all 4 sections of your personal statement.');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Step {currentStepIndex + 1} of 4 • {currentSection.title}
        </Text>
        <TouchableOpacity
          onPress={handleSaveDraft}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="save-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Step Indicator Tabs */}
      <View style={styles.stepTabsRow}>
        {STATEMENT_SECTIONS.map((sec, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = Boolean((sectionTexts[sec.id] || '').length > 20);
          return (
            <TouchableOpacity
              key={sec.id}
              onPress={() => setCurrentStepIndex(idx)}
              style={[
                styles.stepTab,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : isDone
                    ? colors.successLight
                    : colors.cardMuted,
                },
              ]}>
              <Text
                style={[
                  styles.stepTabText,
                  {
                    color: isActive
                      ? colors.primaryContrast
                      : isDone
                      ? colors.success
                      : colors.textSecondary,
                  },
                ]}>
                0{idx + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Section Heading & Guidance */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.koreanTitle, { color: colors.textSecondary }]}>
            {currentSection.koreanTitle}
          </Text>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            {currentSection.title}
          </Text>
          <Text style={[styles.myanmarGuidance, { color: colors.textSecondary }]}>
            {currentSection.guidance}
          </Text>
        </View>

        {/* Recommended Questions to Answer */}
        <View
          style={[
            styles.guidanceCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.guidanceCardTitle, { color: colors.textSecondary }]}>
            KEY POINTS TO COVER
          </Text>
          {currentSection.keyQuestions.map((q, idx) => (
            <View key={idx} style={styles.questionRow}>
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
              <Text style={[styles.questionText, { color: colors.text }]}>{q}</Text>
            </View>
          ))}
        </View>

        {/* Sample Phrasing Quick-Inserts */}
        <View style={styles.samplePhrasesSection}>
          <Text style={[styles.sampleHeading, { color: colors.textSecondary }]}>
            TAP TO INSERT SAMPLE SENTENCE STARTER
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phrasesScroll}>
            {currentSection.samplePhrases.map((phrase, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleAppendPhrase(phrase)}
                style={[styles.phraseChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="add" size={14} color={colors.accent} />
                <Text numberOfLines={1} style={[styles.phraseChipText, { color: colors.text }]}>
                  {phrase}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text Input Workspace */}
        <View style={styles.editorBox}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              RECOMMENDED: {currentSection.recommendedChars} CHARACTERS
            </Text>
            <Text style={[styles.charCount, { color: colors.accent }]}>
              {currentContent.length} chars
            </Text>
          </View>

          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="한국어로 자기소개서를 작성해 보세요..."
            placeholderTextColor={colors.textMuted}
            value={currentContent}
            onChangeText={handleTextChange}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* AI Coaching Button for this section */}
        <TouchableOpacity
          onPress={handleGetAiFeedback}
          style={[styles.aiCoachBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Ionicons name="sparkles" size={18} color={colors.accent} />
          <Text style={[styles.aiCoachBtnText, { color: colors.accent }]}>
            Review Section with Admissions AI
          </Text>
        </TouchableOpacity>

        {/* Navigation Step Buttons */}
        <View style={styles.bottomNavRow}>
          {currentStepIndex > 0 ? (
            <TouchableOpacity
              onPress={handlePrev}
              style={[styles.navBtnPrev, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="arrow-back" size={16} color={colors.text} />
              <Text style={[styles.navBtnPrevText, { color: colors.text }]}>Previous</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navBtnNext, { backgroundColor: colors.primary }]}>
            <Text style={[styles.navBtnNextText, { color: colors.primaryContrast }]}>
              {currentStepIndex === STATEMENT_SECTIONS.length - 1 ? 'Finish & Save' : 'Next Section'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primaryContrast} />
          </TouchableOpacity>
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
    fontSize: 13,
    fontWeight: '600',
  },
  stepTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 8,
    paddingVertical: 6,
  },
  stepTab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    gap: 4,
    marginVertical: 4,
  },
  koreanTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  myanmarGuidance: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  guidanceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  guidanceCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  questionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  samplePhrasesSection: {
    gap: 6,
  },
  sampleHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phrasesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  phraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    maxWidth: 280,
  },
  phraseChipText: {
    fontSize: 12,
  },
  editorBox: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    height: 200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
  },
  aiCoachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  aiCoachBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  navBtnPrev: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  navBtnPrevText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navBtnNext: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 6,
  },
  navBtnNextText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

