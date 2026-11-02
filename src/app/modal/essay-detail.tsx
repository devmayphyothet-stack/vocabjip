import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function EssayDetailModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const params = useLocalSearchParams<{
    essayId?: string;
    title?: string;
    author?: string;
    type?: string;
    content?: string;
    scoreEstimate?: string;
    createdAt?: string;
    likesCount?: string;
  }>();

  const title = params.title || 'Community Essay';
  const author = params.author || 'TOPIK Learner';
  const type = params.type || 'Q54';
  const content = params.content || '';
  const scoreEstimate = params.scoreEstimate || 'AI Reviewed';
  const createdAt = params.createdAt || 'Recent';

  const [likes, setLikes] = useState(parseInt(params.likesCount || '24', 10));
  const [isLiked, setIsLiked] = useState(false);

  const handleToggleLike = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleReport = () => {
    router.push({
      pathname: '/modal/report-essay',
      params: {
        essayTitle: title,
        authorName: author,
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
          Community • {type.toUpperCase()}
        </Text>
        <TouchableOpacity
          onPress={handleReport}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="flag-outline" size={17} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Author Header */}
        <View style={styles.authorHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>
              {author.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { color: colors.text }]}>{author}</Text>
            <Text style={[styles.postDate, { color: colors.textMuted }]}>
              Shared {createdAt}
            </Text>
          </View>

          <View style={[styles.scorePill, { backgroundColor: colors.streakLight }]}>
            <Ionicons name="sparkles" size={13} color={colors.streak} />
            <Text style={[styles.scorePillText, { color: colors.streak }]}>
              {scoreEstimate}
            </Text>
          </View>
        </View>

        {/* Essay Title */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {/* Essay Content Card */}
        <View
          style={[
            styles.essayCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.essayBody, { color: colors.text }]}>{content}</Text>
        </View>

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            onPress={handleToggleLike}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isLiked ? colors.errorLight : colors.card,
                borderColor: isLiked ? colors.error : colors.border,
              },
            ]}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? colors.error : colors.text}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isLiked ? colors.error : colors.text },
              ]}>
              {likes} Helpful
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Study Tip', 'You can read high-scoring essays to memorize natural connective words like 따라서, 반면에, 그러므로.')
            }
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="bulb-outline" size={18} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Study Tip</Text>
          </TouchableOpacity>
        </View>
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
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  scorePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  essayCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  essayBody: {
    fontSize: 16,
    lineHeight: 28,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

