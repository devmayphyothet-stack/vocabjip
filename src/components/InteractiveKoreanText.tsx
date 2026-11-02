import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SpeechService } from '@/services/speech-service';

interface InteractiveKoreanTextProps {
  content: string;
  onPressWord: (word: string) => void;
}

export function InteractiveKoreanText({ content, onPressWord }: InteractiveKoreanTextProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [isPlayingFull, setIsPlayingFull] = useState(false);

  // Split into paragraphs by newline
  const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);

  const handleToggleFullAudio = async () => {
    if (isPlayingFull) {
      await SpeechService.stop();
      setIsPlayingFull(false);
    } else {
      setIsPlayingFull(true);
      await SpeechService.speakKorean(content, {
        rate: 0.85,
        onDone: () => setIsPlayingFull(false),
        onError: () => setIsPlayingFull(false),
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Audio Toolbar & Helper Banner */}
      <View
        style={[
          styles.toolbarRow,
          { backgroundColor: colors.cardMuted, borderColor: colors.borderLight },
        ]}>
        <View style={styles.tipBox}>
          <Ionicons name="hand-left-outline" size={14} color={colors.accent} />
          <Text style={[styles.tipBannerText, { color: colors.textSecondary }]}>
            စကားလုံးကို နှိပ်၍ အသံထွက်နှင့် ဘာသာပြန် ကြည့်ပါ
          </Text>
        </View>

        {/* Read Aloud Full Essay Button */}
        <TouchableOpacity
          onPress={handleToggleFullAudio}
          style={[
            styles.fullAudioBtn,
            {
              backgroundColor: isPlayingFull ? colors.accent : colors.card,
              borderColor: colors.accent,
            },
          ]}>
          <Ionicons
            name={isPlayingFull ? 'pause' : 'volume-high-outline'}
            size={14}
            color={isPlayingFull ? '#FFFFFF' : colors.accent}
          />
          <Text
            style={[
              styles.fullAudioBtnText,
              { color: isPlayingFull ? '#FFFFFF' : colors.accent },
            ]}>
            {isPlayingFull ? 'Pause' : 'Read Aloud'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Paragraphs with Interactive Words */}
      <View style={styles.paragraphsContainer}>
        {paragraphs.map((para, pIdx) => {
          // Tokenize into words by whitespace
          const words = para.split(' ');

          return (
            <View key={pIdx} style={styles.paragraphRow}>
              {words.map((word, wIdx) => {
                const cleanWord = word.replace(/[.,!?'"~()·]/g, '');

                return (
                  <TouchableOpacity
                    key={`${pIdx}-${wIdx}`}
                    activeOpacity={0.65}
                    onPress={() => onPressWord(cleanWord)}
                    style={styles.wordTouchable}>
                    <Text style={[styles.wordText, { color: colors.text }]}>
                      {word}{' '}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tipBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipBannerText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  fullAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  fullAudioBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paragraphsContainer: {
    gap: 14,
  },
  paragraphRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    lineHeight: 28,
  },
  wordTouchable: {
    paddingVertical: 2,
    borderRadius: 4,
  },
  wordText: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
});
