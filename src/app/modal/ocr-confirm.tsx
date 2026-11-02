import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UncertainWord } from '@/services/ocr-service';

export default function OcrConfirmModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const params = useLocalSearchParams<{
    extractedText?: string;
    questionType?: string;
    uncertainWordsJson?: string;
  }>();

  const [text, setText] = useState(params.extractedText || '');
  const questionType = (params.questionType as 'Q53' | 'Q54') || 'Q53';

  let uncertainWords: UncertainWord[] = [];
  try {
    if (params.uncertainWordsJson) {
      uncertainWords = JSON.parse(params.uncertainWordsJson);
    }
  } catch (_) {}

  const [uncertainList, setUncertainList] = useState<UncertainWord[]>(uncertainWords);

  const handleApplyCorrection = (item: UncertainWord) => {
    // If user taps suggested correction, replace or dismiss
    setUncertainList((prev) => prev.filter((u) => u.id !== item.id));
  };

  const handleOpenWorkspace = () => {
    // Close modal and route to Wongoji Editor with the extracted text
    router.replace({
      pathname: '/modal/wongoji-editor',
      params: {
        type: questionType,
        promptTitle: questionType === 'Q53' ? 'Handwritten Scanned Draft (Q53)' : 'Handwritten Scanned Essay (Q54)',
        initialContent: text,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Extracted Handwriting
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Check extracted text</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Review and adjust before opening in Wongoji workspace.
          </Text>
        </View>

        {/* Uncertain Characters Section */}
        {uncertainList.length > 0 && (
          <View
            style={[
              styles.uncertainCard,
              { backgroundColor: colors.streakLight },
            ]}>
            <View style={styles.uncertainHeader}>
              <Ionicons name="help-circle" size={18} color={colors.streak} />
              <Text style={[styles.uncertainBadge, { color: colors.streak }]}>
                {uncertainList.length} CHARACTERS TO CHECK
              </Text>
            </View>

            <Text style={[styles.uncertainInstruction, { color: colors.text }]}>
              Tap to confirm or edit highlighted words from handwriting:
            </Text>

            <View style={styles.chipsRow}>
              {uncertainList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleApplyCorrection(item)}
                  style={[styles.wordChip, { backgroundColor: colors.card, borderColor: colors.streak }]}>
                  <Text style={[styles.wordChipText, { color: colors.text }]}>
                    "{item.word}"
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Extracted Text Area */}
        <View style={styles.editorSection}>
          <View style={styles.editorMetaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              EDITABLE TEXT
            </Text>
            <Text style={[styles.charCount, { color: colors.accent }]}>
              {text.length} characters
            </Text>
          </View>

          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleOpenWorkspace}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="grid-outline" size={18} color={colors.primaryContrast} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
            Open in Wongoji Workspace
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
  },
  uncertainCard: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  uncertainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uncertainBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  uncertainInstruction: {
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  wordChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editorSection: {
    gap: 8,
  },
  editorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  textArea: {
    height: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

