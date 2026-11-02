import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PracticePausedModalProps {
  visible: boolean;
  secondsLeft: number;
  onResume: () => void;
  onFinish: () => void;
}

export function PracticePausedModal({
  visible,
  secondsLeft,
  onResume,
  onFinish,
}: PracticePausedModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.screenTitle, { color: colors.text }]}>
                Practice paused
              </Text>
              <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
                Your time is on hold
              </Text>
            </View>
          </View>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <View style={styles.tagRow}>
              <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.tagText}>TIME REMAINING</Text>
            </View>
            <Text style={styles.timeBig}>{timeFormatted}</Text>
            <Text style={styles.heroSubtext}>
              Your draft has been saved on this device.
            </Text>
          </View>

          {/* Tip Card */}
          <View
            style={[
              styles.tipCard,
              { backgroundColor: colors.card, borderColor: colors.borderLight },
            ]}>
            <Text style={[styles.tipTitle, { color: colors.accent }]}>
              A pause is part of practice
            </Text>
            <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
              Take a breath. Resume when you are ready.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.btnStack}>
            <TouchableOpacity
              onPress={onResume}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                Resume practice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onFinish}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Finish & save draft
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface PracticeTimeUpModalProps {
  visible: boolean;
  questionType: 'Q53' | 'Q54';
  promptTitle: string;
  charCount: number;
  onReviewAi: () => void;
  onKeepEditing: () => void;
  onSaveFinish: () => void;
}

export function PracticeTimeUpModal({
  visible,
  questionType,
  promptTitle,
  charCount,
  onReviewAi,
  onKeepEditing,
  onSaveFinish,
}: PracticeTimeUpModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.screenTitle, { color: colors.text }]}>
                Practice time is up
              </Text>
              <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
                Your draft has been saved
              </Text>
            </View>
          </View>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <View style={styles.tagRow}>
              <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.tagText}>SESSION COMPLETE</Text>
            </View>
            <Text style={styles.heroTitle}>You made time{'\n'}for your future.</Text>
            <Text style={styles.heroSubtext}>Question {questionType} • 20 minutes</Text>
          </View>

          {/* Draft Summary Box */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.summaryTitleRow}>
              <Ionicons name="pencil" size={16} color={colors.accent} />
              <Text numberOfLines={1} style={[styles.summaryTitle, { color: colors.text }]}>
                {promptTitle}
              </Text>
            </View>
            <Text style={[styles.summaryChars, { color: colors.textSecondary }]}>
              {charCount} characters • In target range
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.btnStack}>
            <TouchableOpacity
              onPress={onReviewAi}
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
                Review my writing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onKeepEditing}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Keep editing without timer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSaveFinish}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Save & finish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBig: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  tipCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryChars: {
    fontSize: 12,
    marginLeft: 22,
  },
  btnStack: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

