import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EmptyCollectionStateProps {
  onExploreVocab?: () => void;
  onExplorePatterns?: () => void;
}

export function EmptyCollectionState({
  onExploreVocab,
  onExplorePatterns,
}: EmptyCollectionStateProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleVocab = () => {
    if (onExploreVocab) {
      onExploreVocab();
    } else {
      router.push('/(tabs)/learn');
    }
  };

  const handlePatterns = () => {
    if (onExplorePatterns) {
      onExplorePatterns();
    } else {
      router.push('/(tabs)/learn');
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Card matching figma/empty */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.tagRow}>
          <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.tagText}>YOUR COLLECTION</Text>
        </View>

        <Text style={styles.heroTitle}>Keep a phrase.{'\n'}Build a habit.</Text>
        <Text style={styles.heroSubtitle}>Tap the bookmark on a pattern or word.</Text>
      </View>

      {/* Burmese Encouragement */}
      <Text style={[styles.burmeseNotice, { color: colors.textSecondary }]}>
        ကြိုက်နှစ်သက်သော စကားလုံးများကို သိမ်းထားပါ။
      </Text>

      {/* 2 Action Buttons */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          onPress={handleVocab}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
            Explore vocabulary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePatterns}
          style={[
            styles.secondaryBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            Explore writing patterns
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  heroCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  burmeseNotice: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  actionGroup: {
    gap: 10,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 50,
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

