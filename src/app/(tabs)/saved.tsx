import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSaved, SavedDraft } from '@/context/saved-context';
import { EmptyCollectionState } from '@/components/EmptyCollectionState';
import { useCurriculum } from '@/hooks/use-curriculum';

type SavedTab = 'vocab' | 'patterns' | 'drafts';

export default function SavedScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const {
    syncStatus, retrySync, hasGuestItems, importGuestItems,
    savedVocabIds,
    savedPatternIds,
    drafts,
    toggleSaveVocab,
    toggleSavePattern,
    deleteDraft,
  } = useSaved();
  const { vocabularies, patterns } = useCurriculum();

  const [activeTab, setActiveTab] = useState<SavedTab>('vocab');
  const [draftToDelete, setDraftToDelete] = useState<SavedDraft | null>(null);

  const savedVocabs = vocabularies.filter((v) => savedVocabIds.includes(v.id));
  const savedPatterns = patterns.filter((p) => savedPatternIds.includes(p.id));

  const handleDeleteDraft = (draft: SavedDraft) => {
    setDraftToDelete(draft);
  };

  const confirmDeleteDraft = async () => {
    if (!draftToDelete) return;
    const id = draftToDelete.id;
    setDraftToDelete(null);
    try { await deleteDraft(id); } catch (error: any) { Alert.alert('Could not delete draft', error.message); }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Collection</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Keep what helps you grow • Offline-ready
        </Text>

        <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, marginVertical: 8 }}>
          {syncStatus === 'synced' ? 'Synced with your account' : syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'pending' ? 'Saved on device · Waiting to sync' : syncStatus === 'error' ? 'Cloud sync could not finish. Your saved items are on this device.' : 'Saved on this device'}
        </Text>
        {(syncStatus === 'error' || syncStatus === 'pending') && <TouchableOpacity accessibilityRole="button" onPress={() => { void retrySync(); }} style={{ paddingVertical: 10 }}><Text style={{ color: colors.accent }}>Retry cloud sync</Text></TouchableOpacity>}
        {hasGuestItems && <TouchableOpacity accessibilityRole="button" onPress={() => Alert.alert('Import guest items?', 'Move this device’s guest drafts and bookmarks into your current account?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Import', onPress: () => { importGuestItems().catch(() => Alert.alert('Import failed', 'Guest items remain available. Please retry.')); } }])} style={{ paddingVertical: 10 }}><Text style={{ color: colors.accent }}>Import guest drafts and bookmarks</Text></TouchableOpacity>}
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
            <View
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/modal/vocab-detail',
                    params: { id: item.id },
                  })
                }
                style={{ flex: 1 }}>
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
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleSaveVocab(item.id)}
                style={styles.iconBtn}>
                <Ionicons name="bookmark" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyCollectionState
              onExploreVocab={() => router.push('/(tabs)/learn')}
              onExplorePatterns={() => router.push('/(tabs)/learn')}
            />
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
            <View
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/modal/pattern-detail',
                    params: { id: item.id },
                  })
                }
                style={{ flex: 1 }}>
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
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleSavePattern(item.id)}
                style={styles.iconBtn}>
                <Ionicons name="bookmark" size={20} color={colors.streak} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyCollectionState
              onExploreVocab={() => router.push('/(tabs)/learn')}
              onExplorePatterns={() => router.push('/(tabs)/learn')}
            />
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
            <View
              style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: item.type === 'statement' ? '/modal/statement-editor' : '/modal/wongoji-editor',
                    params: {
                      draftId: item.id,
                      type: item.type,
                      promptTitle: item.title,
                    },
                  })
                }
                style={{ flex: 1 }}>
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
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteDraft(item)}
                accessibilityLabel="Delete Draft"
                accessibilityRole="button"
                style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
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

      {/* Cross-Platform Delete Confirmation Modal (Works on Web, iOS & Android) */}
      <Modal
        visible={Boolean(draftToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setDraftToDelete(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={[styles.modalIconCircle, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete Draft?
            </Text>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              "{draftToDelete?.title}" ကို ဖျက်ပစ်ရန် သေချာပါသလား? ဖျက်ပြီးပါက ပြန်လည်ရယူနိုင်မည် မဟုတ်ပါ။
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setDraftToDelete(null)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.cardMuted, borderColor: colors.border },
                ]}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDeleteDraft}
                style={[styles.modalDeleteBtn, { backgroundColor: colors.error }]}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

