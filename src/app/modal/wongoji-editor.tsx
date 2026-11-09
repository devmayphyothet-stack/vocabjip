import { useWritingRecovery } from '@/hooks/use-writing-recovery';
import { createDraftId, isUuid } from '@/lib/draft-utils';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSaved } from '@/context/saved-context';
import { useAi } from '@/context/ai-context';
import { PracticePausedModal, PracticeTimeUpModal } from '@/components/timer-modals';

type ViewMode = 'text' | 'grid';

export default function WongojiEditorModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);

  const { saveDraft, syncStatus, drafts } = useSaved();
  const { isConnected } = useAi();
  const recovery = useWritingRecovery();
  const params = useLocalSearchParams<{
    draftId?: string;
    type?: string;
    promptTitle?: string;
    charTarget?: string;
    initialContent?: string;
  }>();

  // Keep a stable draft ID for this editor session so saving/closing updates the same draft instead of duplicating
  const sessionDraftIdRef = useRef<string>(params.draftId && isUuid(params.draftId) ? params.draftId : createDraftId());
  const existing = drafts.find(draft => draft.id === params.draftId);
  const initialContentRef = useRef(existing?.content ?? params.initialContent ?? '');
  const hasManuallySavedRef = useRef(false);
  const type = existing?.type === 'Q54' || params.type === 'Q54' ? 'Q54' : 'Q53';
  const promptTitle = existing?.title || params.promptTitle || (type === 'Q53' ? '인터넷 이용 현황 (Q53)' : '평생 교육의 필요성 (Q54)');
  const charTarget = params.charTarget || (type === 'Q53' ? '200 – 300' : '600 – 700');
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [content, setContent] = useState(initialContentRef.current);
  const handleTextChange = (text: string) => {
    setContent(text);
    recovery.update({ id: sessionDraftIdRef.current, type, title: promptTitle, content: text, charCount: text.length });
  };

  // Timer State (20 minutes = 1200 seconds)
  const [secondsLeft, setSecondsLeft] = useState(1200);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setShowTimeUpModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setShowPausedModal(true);
    } else {
      setIsTimerRunning(true);
    }
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleManualSave = async () => {
    hasManuallySavedRef.current = true;
    try { await saveDraft({
      id: sessionDraftIdRef.current,
      type,
      title: promptTitle,
      content,
      charCount: content.length,
    });
    } catch (error: any) {
      Alert.alert('Could not save draft', error.message);
      return;
    }

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleAiReview = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Draft', 'Please write some sentences before requesting an AI review.');
      return;
    }
    hasManuallySavedRef.current = true;
    // Auto save draft before navigating using the stable session draft ID
    try { await saveDraft({
      id: sessionDraftIdRef.current,
      type,
      title: promptTitle,
      content,
      charCount: content.length,
    }); } catch (error: any) { Alert.alert('Could not save draft', error.message); return; }

    if (!isConnected) {
      router.push('/modal/ai-connect');
    } else {
      router.push({
        pathname: '/modal/ai-feedback',
        params: {
          essayText: content,
          questionType: type,
          promptTopic: promptTitle,
        },
      });
    }
  };

  const handleContributorReview = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Draft', 'Please write some sentences before requesting a contributor review.');
      return;
    }
    hasManuallySavedRef.current = true;
    try { await saveDraft({
      id: sessionDraftIdRef.current,
      type,
      title: promptTitle,
      content,
      charCount: content.length,
    }); } catch (error: any) { Alert.alert('Could not save draft', error.message); return; }

    router.push({
      pathname: '/modal/contributor-review',
      params: {
        essayText: content,
        questionType: type,
        promptTopic: promptTitle,
      },
    });
  };

  const handleClose = async () => {
    const isModified = content !== initialContentRef.current;
    if (isModified || hasManuallySavedRef.current) {
      try {
        await saveDraft({ id: sessionDraftIdRef.current, type, title: promptTitle, content, charCount: content.length });
      } catch (error: any) {
        Alert.alert('Could not save draft', error.message);
        return;
      }
    }
    router.back();
  };

  // Convert text into Wongoji Grid cells (20 characters per line)
  const renderWongojiGrid = () => {
    const chars = content.split('');
    const cellsPerLine = 20;
    const totalLines = Math.max(8, Math.ceil((chars.length + 10) / cellsPerLine));

    const gridRows: string[][] = [];
    for (let r = 0; r < totalLines; r++) {
      const row: string[] = [];
      for (let c = 0; c < cellsPerLine; c++) {
        const charIndex = r * cellsPerLine + c;
        row.push(chars[charIndex] || '');
      }
      gridRows.push(row);
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.wongojiSheet, { backgroundColor: '#FFFEFA', borderColor: '#E5DFD5' }]}>
          {gridRows.map((row, rIndex) => (
            <View key={rIndex} style={styles.gridLineRow}>
              <Text style={styles.lineNumberText}>{(rIndex + 1) * 20}</Text>
              <View style={styles.cellsRow}>
                {row.map((cellChar, cIndex) => {
                  const isFilled = cellChar !== '';
                  return (
                    <View
                      key={cIndex}
                      style={[
                        styles.gridCell,
                        { borderColor: '#E8E2D8' },
                        isFilled && { backgroundColor: '#FDFCF7' },
                      ]}>
                      <Text style={styles.gridCellText}>{cellChar}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityLabel="Close Editor">
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Timer Pill */}
        <TouchableOpacity
          onPress={handleToggleTimer}
          style={[styles.timerPill, { backgroundColor: colors.cardMuted }]}>
          <Ionicons
            name={isTimerRunning ? 'pause' : 'play'}
            size={13}
            color={colors.accent}
          />
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTime(secondsLeft)}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons: Scan, Save & AI Review */}
        <View style={styles.topActionGroup}>
          <TouchableOpacity
            onPress={() => router.push('/modal/scan-handwriting')}
            style={[styles.actionIconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            accessibilityLabel="Scan Handwriting">
            <Ionicons name="camera-outline" size={17} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleManualSave}
            style={[
              styles.actionIconBtn,
              { backgroundColor: isSavedFeedback ? colors.successLight : colors.card },
              { borderColor: isSavedFeedback ? colors.success : colors.border },
            ]}
            accessibilityLabel="Save Draft">
            <Ionicons
              name={isSavedFeedback ? 'checkmark' : 'save-outline'}
              size={17}
              color={isSavedFeedback ? colors.success : colors.text}
            />
          </TouchableOpacity>

        </View>
      </View>

      <View style={styles.reviewActions}>
          <TouchableOpacity
            onPress={handleContributorReview}
            style={[
              styles.aiReviewBtn,
              { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
            ]}>
            <Ionicons name="school" size={14} color="#B45309" />
            <Text style={[styles.aiReviewBtnText, { color: '#B45309' }]}>
              Contributors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAiReview}
            style={[styles.aiReviewBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={[styles.aiReviewBtnText, { color: colors.accent }]}>
              AI Review
            </Text>
          </TouchableOpacity>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12 }}>
        {recovery.status === 'error' ? 'Could not save · Tap Save to retry' : recovery.status === 'saving' ? 'Saving on this device…' : syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'pending' ? 'Saved on device · Sync pending' : syncStatus === 'error' ? 'Saved on device · Cloud sync needs retry' : 'Drafts save on this device'}
      </Text>

      {/* Title & Target Bar */}
      <View style={styles.metaBar}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.promptTitle, { color: colors.text }]}>
            {promptTitle}
          </Text>
          <Text style={[styles.targetInfo, { color: colors.textSecondary }]}>
            Target: {charTarget} characters • Saves automatically
          </Text>
        </View>

        {/* Character Count Badge */}
        <View style={[styles.charCountPill, { backgroundColor: colors.cardMuted }]}>
          <Text style={[styles.charCountText, { color: colors.accent }]}>
            {content.length}
          </Text>
          <Text style={[styles.charCountTotal, { color: colors.textMuted }]}>
            /{type === 'Q53' ? '300' : '700'}
          </Text>
        </View>
      </View>

      {/* Segmented Switcher: Text Input vs Grid Preview */}
      <View style={styles.segmentContainer}>
        <View style={[styles.segmentTrack, { backgroundColor: colors.cardMuted }]}>
          <TouchableOpacity
            onPress={() => setViewMode('text')}
            style={[
              styles.segmentBtn,
              viewMode === 'text' && [
                styles.segmentBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}>
            <Ionicons
              name="create-outline"
              size={15}
              color={viewMode === 'text' ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: viewMode === 'text' ? colors.text : colors.textSecondary },
              ]}>
              Text Input
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[
              styles.segmentBtn,
              viewMode === 'grid' && [
                styles.segmentBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}>
            <Ionicons
              name="grid-outline"
              size={15}
              color={viewMode === 'grid' ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: viewMode === 'grid' ? colors.text : colors.textSecondary },
              ]}>
              Grid Preview (원고지)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workspace Area */}
      <View style={styles.workspace}>
        {viewMode === 'text' ? (
          <TextInput
            style={[
              styles.textInputArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="원고지 형식에 맞추어 글을 작성해 보세요..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={handleTextChange}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        ) : (
          <View style={styles.gridContainer}>
            <Text style={[styles.wongojiNotice, { color: colors.textSecondary }]}>
              20 columns per line • Standard Korean TOPIK Wongoji simulation
            </Text>
            {renderWongojiGrid()}
          </View>
        )}
      </View>

      {/* Practice Paused Modal (figma/timerPaused) */}
      <PracticePausedModal
        visible={showPausedModal}
        secondsLeft={secondsLeft}
        onResume={() => {
          setShowPausedModal(false);
          setIsTimerRunning(true);
        }}
        onFinish={async () => {
          setShowPausedModal(false);
          await handleManualSave();
          router.back();
        }}
      />

      {/* Practice Time Up Modal (figma/timeUp) */}
      <PracticeTimeUpModal
        visible={showTimeUpModal}
        questionType={type}
        promptTitle={promptTitle}
        charCount={content.length}
        onReviewAi={() => {
          setShowTimeUpModal(false);
          handleAiReview();
        }}
        onKeepEditing={() => {
          setShowTimeUpModal(false);
        }}
        onSaveFinish={async () => {
          setShowTimeUpModal(false);
          await handleManualSave();
          router.back();
        }}
      />
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
    paddingBottom: Spacing.two,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    gap: 5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  topActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  aiReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiReviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  targetInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  charCountPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  charCountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  charCountTotal: {
    fontSize: 11,
  },
  segmentContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 6,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workspace: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  textInputArea: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    lineHeight: 26,
  },
  gridContainer: {
    flex: 1,
    gap: 8,
  },
  wongojiNotice: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  wongojiSheet: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineNumberText: {
    fontSize: 9,
    color: '#A8A29E',
    width: 22,
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  cellsRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 28,
    height: 28,
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#292524',
  },
});
