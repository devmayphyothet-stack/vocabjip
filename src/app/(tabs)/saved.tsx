import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSaved, SavedDraft } from '@/context/saved-context';
import { VOCAB_DATA } from '@/data/vocab-data';
import { PATTERNS_DATA } from '@/data/patterns-data';

type SavedTab = 'vocab' | 'patterns' | 'drafts';

export default function SavedScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const {
    savedVocabIds,
    savedPatternIds,
    drafts,
    toggleSaveVocab,
    toggleSavePattern,
    deleteDraft,
  } = useSaved();

  const [activeTab, setActiveTab] = useState<SavedTab>('vocab');

  const savedVocabs = VOCAB_DATA.filter((v) => savedVocabIds.includes(v.id));
  const savedPatterns = PATTERNS_DATA.filter((p) => savedPatternIds.includes(p.id));

  const handleDeleteDraft = (draft: SavedDraft) => {
    Alert.alert('Delete Draft', `Are you sure you want to delete "${draft.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDraft(draft.id) },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Collection</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Keep what helps you grow • Offline-ready
        </Text>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: colors.cardMuted }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('vocab')}
            style={[
              styles.tabBtn,
              activeTab === 'vocab' && [
                styles.tabBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'vocab' ? colors.text : colors.textSecondary },
              ]}>
              Vocab ({savedVocabs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('patterns')}
            style={[
              styles.tabBtn,
              activeTab === 'patterns' && [
                styles.tabBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'patterns' ? colors.text : colors.textSecondary },
              ]}>
              Patterns ({savedPatterns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('drafts')}
            style={[
              styles.tabBtn,
              activeTab === 'drafts' && [
                styles.tabBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'drafts' ? colors.text : colors.textSecondary },
              ]}>
              Drafts ({drafts.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab 1: Saved Vocab */}
      {activeTab === 'vocab' && (
        <FlatList
          data={savedVocabs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/modal/vocab-detail',
                  params: { id: item.id },
                })
              }
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.spokenText, { color: colors.textMuted }]}>
                    {item.spoken}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                  <Text style={[styles.writtenText, { color: colors.accent }]}>
                    {item.written}
                  </Text>
                </View>
                <Text style={[styles.meaningText, { color: colors.textSecondary }]}>
                  {item.myanmarMeaning}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleSaveVocab(item.id)}
                style={styles.iconBtn}>
                <Ionicons name="bookmark" size={20} color={colors.accent} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="bookmark-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Make this space yours
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No saved vocabulary yet. Save words from the Learn tab to review them here.
              </Text>
            </View>
          }
        />
      )}

      {/* Tab 2: Saved Patterns */}
      {activeTab === 'patterns' && (
        <FlatList
          data={savedPatterns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/modal/pattern-detail',
                  params: { id: item.id },
                })
              }
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={{ flex: 1 }}>
                <View style={[styles.qTag, { backgroundColor: colors.streakLight }]}>
                  <Text style={[styles.qTagText, { color: colors.streak }]}>
                    {item.questionNumber}
                  </Text>
                </View>
                <Text style={[styles.patternTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.meaningText, { color: colors.textSecondary }]}>
                  {item.myanmarTitle}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleSavePattern(item.id)}
                style={styles.iconBtn}>
                <Ionicons name="bookmark" size={20} color={colors.streak} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="book-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No saved patterns
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Bookmark key TOPIK 51-54 patterns to build your writing reflex.
              </Text>
            </View>
          }
        />
      )}

      {/* Tab 3: Saved Drafts */}
      {activeTab === 'drafts' && (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/modal/wongoji-editor',
                  params: {
                    type: item.type,
                    promptTitle: item.title,
                    initialContent: item.content,
                  },
                })
              }
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={{ flex: 1 }}>
                <View style={styles.draftHeaderRow}>
                  <View style={[styles.qTag, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.qTagText, { color: colors.accent }]}>
                      {item.type}
                    </Text>
                  </View>
                  <Text style={[styles.charTag, { color: colors.textMuted }]}>
                    {item.charCount} chars
                  </Text>
                </View>
                <Text style={[styles.draftTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.draftSnippet, { color: colors.textSecondary }]}>
                  {item.content}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteDraft(item)}
                style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No drafts saved yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Your Wongoji writings will be saved locally so you never lose a sentence.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.four,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  spokenText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  writtenText: {
    fontSize: 16,
    fontWeight: '700',
  },
  meaningText: {
    fontSize: 13,
  },
  qTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  qTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  patternTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  draftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  charTag: {
    fontSize: 11,
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  draftSnippet: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconBtn: {
    padding: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

