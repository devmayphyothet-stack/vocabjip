import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fetchCommunityEssays } from '@/services/community-service';
import { CommunityEssay } from '@/types/community';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FILTER_TABS = ['All', 'Q54 Essays', 'Q53 Graphs', 'Admissions'];

export default function CommunityModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [essays, setEssays] = useState<CommunityEssay[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadEssays = async () => {
    const list = await fetchCommunityEssays();
    setEssays(list);
  };

  useEffect(() => {
    loadEssays();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEssays();
    setRefreshing(false);
  };

  const filteredEssays = essays.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'Q54 Essays') matchesTab = item.type === 'Q54';
    else if (activeTab === 'Q53 Graphs') matchesTab = item.type === 'Q53';
    else if (activeTab === 'Admissions') matchesTab = item.type === 'statement';

    return matchesSearch && matchesTab;
  });

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
          Community Essays
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/modal/publish-essay')}
          style={[styles.publishBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.publishBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Header Info */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.text }]}>Learn from each other</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Browse high-scoring essays and study plans written by fellow TOPIK learners.
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search topics, keywords or authors..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.tabsRow}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: activeTab === tab ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.tabChipText,
                  {
                    color:
                      activeTab === tab
                        ? colors.primaryContrast
                        : colors.textSecondary,
                  },
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Essays Feed */}
      <FlatList
        data={filteredEssays}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/modal/essay-detail',
                params: {
                  essayId: item.id,
                  title: item.title,
                  author: item.authorName,
                  type: item.type,
                  content: item.content,
                  scoreEstimate: item.scoreEstimate,
                  createdAt: item.createdAt,
                  likesCount: String(item.likesCount),
                },
              })
            }
            style={[
              styles.essayCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            {/* Author & Tag Row */}
            <View style={styles.cardTopRow}>
              <View style={styles.authorRow}>
                <View style={[styles.authorAvatar, { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                    {item.authorName.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text }]}>
                    {item.authorName}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {item.createdAt}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      item.type === 'Q54'
                        ? colors.streakLight
                        : item.type === 'Q53'
                        ? colors.accentLight
                        : colors.cardMuted,
                  },
                ]}>
                <Text
                  style={[
                    styles.typeBadgeText,
                    {
                      color:
                        item.type === 'Q54'
                          ? colors.streak
                          : item.type === 'Q53'
                          ? colors.accent
                          : colors.text,
                    },
                  ]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Title & Preview */}
            <Text style={[styles.essayTitle, { color: colors.text }]}>{item.title}</Text>
            <Text numberOfLines={3} style={[styles.essaySnippet, { color: colors.textSecondary }]}>
              {item.content}
            </Text>

            {/* Footer Row: Score & Likes */}
            <View style={styles.cardFooter}>
              <View style={[styles.scorePill, { backgroundColor: colors.cardMuted }]}>
                <Ionicons name="sparkles" size={13} color={colors.accent} />
                <Text style={[styles.scorePillText, { color: colors.accent }]}>
                  {item.scoreEstimate}
                </Text>
              </View>

              <View style={styles.likesRow}>
                <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.likesCountText, { color: colors.textSecondary }]}>
                  {item.likesCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No community essays found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Be the first to share an essay draft to encourage other learners!
            </Text>
          </View>
        }
      />
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
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSection: {
    paddingHorizontal: Spacing.four,
    gap: 10,
    marginBottom: 4,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.four,
    gap: 12,
  },
  essayCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  essayTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  essaySnippet: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCountText: {
    fontSize: 12,
    fontWeight: '600',
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
