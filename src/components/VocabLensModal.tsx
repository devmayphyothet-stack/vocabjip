import { Colors, Spacing } from '@/constants/theme';
import { useSaved } from '@/context/saved-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WordDefinition } from '@/services/korean-dictionary-service';
import { SpeechService } from '@/services/speech-service';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface VocabLensModalProps {
  visible: boolean;
  word: WordDefinition | null;
  onClose: () => void;
}

export function VocabLensModal({ visible, word, onClose }: VocabLensModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { toggleSaveVocab, isVocabSaved } = useSaved();

  const [isPlaying, setIsPlaying] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);

  const isSaved = (word?.vocabId && isVocabSaved(word.vocabId)) || localSaved;

  useEffect(() => {
    if (visible && word) {
      setLocalSaved(false);
      // Auto-pronounce word when modal opens for delightful learning experience
      handlePronounce();
    } else {
      SpeechService.stop();
      setIsPlaying(false);
    }
  }, [visible, word]);

  const handlePronounce = async () => {
    if (!word) return;
    setIsPlaying(true);
    await SpeechService.speakKorean(word.korean, {
      rate: 0.88,
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleBookmark = async () => {
    if (!word) return;
    if (word.vocabId) {
      await toggleSaveVocab(word.vocabId);
    } else {
      setLocalSaved(true);
    }
  };

  if (!word) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Top Indicator */}
          <View style={styles.dragIndicator} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <View style={[styles.lensTag, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="sparkles" size={13} color={colors.accent} />
                <Text style={[styles.lensTagText, { color: colors.accent }]}>
                  SMART VOCAB LENS
                </Text>
              </View>
              {word.category && (
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  • {word.category}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Korean Word & Pronounce Row */}
          <View style={styles.wordHeroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.koreanWord, { color: colors.text }]}>
                {word.korean}
              </Text>
              <Text style={[styles.rootWord, { color: colors.accent }]}>
                {word.rootWord !== word.korean ? `Root: ${word.rootWord}` : word.romaja}
              </Text>
            </View>

            {/* Pronunciation Audio Button */}
            <TouchableOpacity
              onPress={handlePronounce}
              style={[
                styles.speakerBtn,
                {
                  backgroundColor: isPlaying ? colors.accent : colors.accentLight,
                  borderColor: colors.accent,
                },
              ]}
              accessibilityLabel="Pronounce Korean Word">
              <Ionicons
                name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
                size={22}
                color={isPlaying ? '#FFFFFF' : colors.accent}
              />
            </TouchableOpacity>
          </View>

          {/* Spoken vs Academic Written Badge (if applicable) */}
          {word.spokenEquivalent && word.writtenEquivalent && (
            <View
              style={[
                styles.comparisonBox,
                { backgroundColor: colors.cardMuted, borderColor: colors.borderLight },
              ]}>
              <View style={styles.compareItem}>
                <Text style={[styles.compareLabel, { color: colors.textMuted }]}>
                  Everyday Spoken
                </Text>
                <Text style={[styles.compareWord, { color: colors.textSecondary }]}>
                  {word.spokenEquivalent}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              <View style={styles.compareItem}>
                <Text style={[styles.compareLabel, { color: colors.accent }]}>
                  Academic Written
                </Text>
                <Text style={[styles.compareWord, { color: colors.accent, fontWeight: '700' }]}>
                  {word.writtenEquivalent}
                </Text>
              </View>
            </View>
          )}

          {/* Meaning Block */}
          <View
            style={[
              styles.meaningBox,
              { backgroundColor: colors.cardMuted, borderColor: colors.borderLight },
            ]}>
            <View style={styles.meaningRow}>
              <Text style={styles.flagEmoji}>🇲🇲</Text>
              <Text style={[styles.myanmarText, { color: colors.text }]}>
                {word.myanmarMeaning}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.meaningRow}>
              <Text style={styles.flagEmoji}>🇬🇧</Text>
              <Text style={[styles.englishText, { color: colors.textSecondary }]}>
                {word.englishMeaning}
              </Text>
            </View>
          </View>

          {/* TOPIK Tip */}
          {word.topikTip && (
            <View style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={16} color={colors.accent} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {word.topikTip}
              </Text>
            </View>
          )}

          {/* Action Row: Listen again & Bookmark */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={handlePronounce}
              style={[
                styles.listenAgainBtn,
                { backgroundColor: colors.cardMuted, borderColor: colors.border },
              ]}>
              <Ionicons name="volume-high-outline" size={16} color={colors.text} />
              <Text style={[styles.listenAgainText, { color: colors.text }]}>
                Listen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBookmark}
              style={[
                styles.bookmarkBtn,
                {
                  backgroundColor: isSaved ? colors.successLight : colors.primary,
                  borderColor: isSaved ? colors.success : colors.primary,
                },
              ]}>
              <Ionicons
                name={isSaved ? 'checkmark' : 'bookmark-outline'}
                size={16}
                color={isSaved ? colors.success : colors.primaryContrast}
              />
              <Text
                style={[
                  styles.bookmarkBtnText,
                  { color: isSaved ? colors.success : colors.primaryContrast },
                ]}>
                {isSaved ? 'Saved!' : 'Save Word'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lensTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lensTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  koreanWord: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rootWord: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  speakerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  compareItem: {
    alignItems: 'center',
    gap: 2,
  },
  compareLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  compareWord: {
    fontSize: 14,
  },
  meaningBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flagEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  myanmarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  divider: {
    height: 1,
  },
  englishText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  listenAgainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  listenAgainText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookmarkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  bookmarkBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
