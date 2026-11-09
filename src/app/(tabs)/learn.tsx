import { CurriculumStatus } from '@/components/CurriculumStatus';
import { useLearningPreferences } from '@/context/learning-preferences-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useSaved } from '@/context/saved-context';
import { PatternItem } from '@/data/patterns-data';
import { VocabItem } from '@/data/vocab-data';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCurriculum } from '@/hooks/use-curriculum';

type TabMode = 'vocab' | 'patterns';

const CATEGORIES = [
  'All',
  'Cause & Effect',
  'Contrast',
  'Society',
  'Education',
  'Economy',
  'Environment',
  'Technology',
  'General',
];
const QUESTION_FILTERS = ['All', 'Q51', 'Q52', 'Q53', 'Q54'];

export default function LearnScreen() {
  const { preferences, t } = useLearningPreferences();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { isVocabSaved, toggleSaveVocab, isPatternSaved, toggleSavePattern } = useSaved();
  const { vocabularies, patterns, isSyncing, syncNow } = useCurriculum();

  const [activeTab, setActiveTab] = useState<TabMode>('vocab');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedQuestion, setSelectedQuestion] = useState('All');

  // Filtered Vocab (combines offline bundled + dynamic approved words)
  const filteredVocab = vocabularies.filter((item) => {
    const matchesSearch =
      item.spoken.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.written.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.myanmarMeaning.includes(searchQuery) ||
      item.englishMeaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Patterns (combines offline bundled + dynamic approved patterns)
  const filteredPatterns = patterns.filter((pat) => {
    const matchesSearch =
      pat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.myanmarTitle.includes(searchQuery) ||
      pat.exampleKorean.includes(searchQuery);
    const matchesQ = selectedQuestion === 'All' || pat.questionNumber === selectedQuestion;
    return matchesSearch && matchesQ;
  });

  const renderVocabCard = ({ item }: { item: VocabItem }) => {
    const saved = isVocabSaved(item.id);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <Text
              style={[
                styles.categoryBadge,
                { backgroundColor: colors.cardMuted, color: colors.textSecondary },
              ]}
            >
              {item.category}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleSaveVocab(item.id)}
            style={styles.bookmarkBtn}
            accessibilityRole="button"
            accessibilityLabel={t(saved ? 'removeBookmark' : 'addBookmark')}
            accessibilityState={{ selected: saved }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${item.spoken}, ${item.written}. ${preferences.language === 'my' ? item.myanmarMeaning : item.englishMeaning}`}
          onPress={() => router.push({ pathname: '/modal/vocab-detail', params: { id: item.id } })}
          style={{ minHeight: 44, gap: 10 }}
        >
          <View style={styles.comparisonRow}>
            <View style={styles.spokenBox}>
              <Text style={[styles.microLabel, { color: colors.textMuted }]}>{t('spoken')}</Text>
              <Text style={[styles.spokenWord, { color: colors.textSecondary }]}>
                {item.spoken}
              </Text>
            </View>

            <View style={[styles.arrowPill, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </View>

            <View style={styles.writtenBox}>
              <Text style={[styles.microLabel, { color: colors.accent }]}>{t('academic')}</Text>
              <Text style={[styles.writtenWord, { color: colors.text }]}>{item.written}</Text>
            </View>
          </View>

          <Text style={[styles.myanmarMeaning, { color: colors.textSecondary }]}>
            {preferences.language === 'my' ? item.myanmarMeaning : item.englishMeaning}
          </Text>
        </TouchableOpacity>
        {item.authorName ? (
          <View style={[styles.contributorFooter, { borderTopColor: colors.borderLight }]}>
            <View style={styles.contributorRow}>
              <Ionicons name="person-circle-outline" size={15} color={colors.accent} />
              <Text style={[styles.contributorName, { color: colors.textSecondary }]}>
                {item.authorName}
              </Text>
            </View>
            {/* {item.authorRank ? (
              <View style={[styles.rankPill, { backgroundColor: colors.streakLight }]}>
                <Ionicons name="trophy" size={10} color={colors.streak} />
                <Text style={[styles.rankPillText, { color: colors.streak }]}>
                  {item.authorRank}
                </Text>
              </View>
            ) : null} */}
          </View>
        ) : null}
      </View>
    );
  };

  const renderPatternCard = ({ item }: { item: PatternItem }) => {
    const saved = isPatternSaved(item.id);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.qBadge, { backgroundColor: colors.streakLight }]}>
            <Text style={[styles.qBadgeText, { color: colors.streak }]}>{item.questionNumber}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t(saved ? 'removeBookmark' : 'addBookmark')}
            accessibilityState={{ selected: saved }}
            onPress={() => toggleSavePattern(item.id)}
            style={styles.bookmarkBtn}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? colors.streak : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={preferences.language === 'my' ? item.myanmarTitle : item.title}
          onPress={() =>
            router.push({ pathname: '/modal/pattern-detail', params: { id: item.id } })
          }
          style={{ minHeight: 44, gap: 10 }}
        >
          <Text style={[styles.patternTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.patternMyanmar, { color: colors.textSecondary }]}>
            {item.myanmarTitle}
          </Text>

          <View style={[styles.formulaBox, { backgroundColor: colors.cardMuted }]}>
            <Text
              style={[
                styles.formulaText,
                {
                  color: colors.text,
                  fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
                },
              ]}
            >
              {item.patternFormula}
            </Text>
          </View>
        </TouchableOpacity>
        {item.authorName ? (
          <View style={[styles.contributorFooter, { borderTopColor: colors.borderLight }]}>
            <View style={styles.contributorRow}>
              <Ionicons name="person-circle-outline" size={15} color={colors.accent} />
              <Text style={[styles.contributorName, { color: colors.textSecondary }]}>
                {item.authorName}
              </Text>
            </View>
            {/* {item.authorRank ? (
              <View style={[styles.rankPill, { backgroundColor: colors.streakLight }]}>
                <Ionicons name="trophy" size={10} color={colors.streak} />
                <Text style={[styles.rankPillText, { color: colors.streak }]}>
                  {item.authorRank}
                </Text>
              </View>
            ) : null} */}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <CurriculumStatus />
      {/* Title & Segmented Control */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn')}</Text>

        <View style={[styles.segmentContainer, { backgroundColor: colors.cardMuted }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'vocab' }}
            onPress={() => setActiveTab('vocab')}
            style={[
              styles.segmentBtn,
              activeTab === 'vocab' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'vocab' ? colors.text : colors.textSecondary },
              ]}
            >
              {/* Everyday → Academic ({vocabularies.length}) */}
              {t('spoken')} → {t('academic')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'patterns' }}
            onPress={() => setActiveTab('patterns')}
            style={[
              styles.segmentBtn,
              activeTab === 'patterns' && [
                styles.segmentBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'patterns' ? colors.text : colors.textSecondary,
                },
              ]}
            >
              {/* Writing Patterns ({patterns.length}) */}
              {t('patterns')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel={t(activeTab === 'vocab' ? 'searchVocab' : 'searchPatterns')}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t(activeTab === 'vocab' ? 'searchVocab' : 'searchPatterns')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('clearSearch')}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterScroll}>
          {activeTab === 'vocab'
            ? CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat === 'All' ? t('all') : cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedCategory === cat ? colors.primaryContrast : colors.textSecondary,
                      },
                    ]}
                  >
                    {cat === 'All' ? t('all') : cat}
                  </Text>
                </TouchableOpacity>
              ))
            : QUESTION_FILTERS.map((q) => (
                <TouchableOpacity
                  key={q === 'All' ? t('all') : q}
                  onPress={() => setSelectedQuestion(q)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedQuestion === q ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedQuestion === q ? colors.primaryContrast : colors.textSecondary,
                      },
                    ]}
                  >
                    {q === 'All' ? t('all') : q}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>
      </View>

      {/* Content List */}
      {activeTab === 'vocab' ? (
        <FlatList
          data={filteredVocab}
          keyExtractor={(item) => item.id}
          renderItem={renderVocabCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncNow}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('noMatches')}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedQuestion('All');
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.accent }}>{t('clearFilters')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredPatterns}
          keyExtractor={(item) => item.id}
          renderItem={renderPatternCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncNow}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('noMatches')}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedQuestion('All');
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.accent }}>{t('clearFilters')}</Text>
              </TouchableOpacity>
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
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.four,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookmarkBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spokenBox: {
    flex: 1,
  },
  microLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  spokenWord: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  arrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writtenBox: {
    flex: 1,
  },
  writtenWord: {
    fontSize: 17,
    fontWeight: '700',
  },
  myanmarMeaning: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 1,
  },
  qBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 2,
  },
  patternMyanmar: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 1,
  },
  formulaBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  formulaText: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  contributorFooter: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contributorName: {
    fontSize: 11,
    fontWeight: '700',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
