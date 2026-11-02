import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSaved, SavedDraft } from '@/context/saved-context';
import { useAuth } from '@/context/auth-context';
import { publishCommunityEssay } from '@/services/community-service';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PublishEssayModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { drafts } = useSaved();
  const { user } = useAuth();

  const [selectedDraft, setSelectedDraft] = useState<SavedDraft | null>(
    drafts[0] || null
  );
  const [title, setTitle] = useState(selectedDraft?.title || '');
  const [authorName, setAuthorName] = useState(user?.displayName || 'TOPIK Learner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectDraft = (d: SavedDraft) => {
    setSelectedDraft(d);
    setTitle(d.title);
  };

  const handlePublish = async () => {
    if (!selectedDraft) {
      setErrorMessage('Please select a draft to share.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter an essay title.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const res = await publishCommunityEssay(
      user?.id || 'guest-author',
      authorName.trim(),
      selectedDraft.type,
      title.trim(),
      selectedDraft.content,
      selectedDraft.type === 'Q54' ? 'AI 38 / 50' : 'AI 25 / 30'
    );

    setIsSubmitting(false);

    if (res.success) {
      setIsPublished(true);
    } else {
      setErrorMessage(res.error || 'Failed to publish essay.');
    }
  };

  // SUCCESS PUBLISHED STATE
  if (isPublished) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.successContainer}>
          <View style={[styles.successIconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="sparkles" size={44} color={colors.success} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Your essay is live</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Thank you for sharing • Your words might inspire someone
          </Text>

          <View
            style={[
              styles.publishedCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.publishedAuthor, { color: colors.accent }]}>
              {authorName}
            </Text>
            <Text style={[styles.publishedTitle, { color: colors.text }]}>{title}</Text>
            <Text numberOfLines={3} style={[styles.publishedSnippet, { color: colors.textSecondary }]}>
              {selectedDraft?.content}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, width: '100%' }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Done & Return to Community
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          Share Your Essay
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Encourage another learner</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Share your Korean essay draft with the community to exchange feedback and study together.
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Choose Draft */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            SELECT DRAFT TO SHARE
          </Text>
          {drafts.length === 0 ? (
            <View style={[styles.emptyDraftsCard, { backgroundColor: colors.cardMuted }]}>
              <Text style={[styles.emptyDraftsText, { color: colors.textSecondary }]}>
                No saved drafts found. Write an essay in the Practice tab first!
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.draftsScroll}>
              {drafts.map((d) => {
                const isSelected = selectedDraft?.id === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleSelectDraft(d)}
                    style={[
                      styles.draftChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.draftChipType,
                        { color: isSelected ? colors.accentLight : colors.accent },
                      ]}>
                      {d.type}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.draftChipTitle,
                        { color: isSelected ? colors.primaryContrast : colors.text },
                      ]}>
                      {d.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 2. Essay Title Input */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>ESSAY TITLE</Text>
          <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
            A clear title helps others find and learn from your work.
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="e.g. 배움의 가치와 평생 교육"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* 3. Display Author Name */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>AUTHOR DISPLAY NAME</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="e.g. Min Min • TOPIK candidate"
            placeholderTextColor={colors.textMuted}
            value={authorName}
            onChangeText={setAuthorName}
          />
        </View>

        {/* Selected Content Preview */}
        {selectedDraft && (
          <View style={styles.sectionGroup}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              PREVIEW CONTENT ({selectedDraft.charCount} CHARACTERS)
            </Text>
            <View
              style={[
                styles.previewBox,
                { backgroundColor: colors.cardMuted, borderColor: colors.border },
              ]}>
              <Text numberOfLines={5} style={[styles.previewText, { color: colors.textSecondary }]}>
                {selectedDraft.content}
              </Text>
            </View>
          </View>
        )}

        {/* Publish Action Button */}
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isSubmitting || !selectedDraft}
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary },
            (!selectedDraft || isSubmitting) && { opacity: 0.6 },
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryContrast} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color={colors.primaryContrast} />
              <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                Publish to Community
              </Text>
            </>
          )}
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
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionGroup: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 12,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  draftsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  draftChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 240,
    gap: 2,
  },
  draftChipType: {
    fontSize: 10,
    fontWeight: '800',
  },
  draftChipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyDraftsCard: {
    padding: 16,
    borderRadius: 12,
  },
  emptyDraftsText: {
    fontSize: 13,
  },
  previewBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  publishedCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    marginVertical: 16,
  },
  publishedAuthor: {
    fontSize: 12,
    fontWeight: '700',
  },
  publishedTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  publishedSnippet: {
    fontSize: 13,
    lineHeight: 18,
  },
});
