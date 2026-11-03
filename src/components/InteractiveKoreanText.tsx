import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SpeechService } from '@/services/speech-service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface InteractiveKoreanTextProps {
  content: string;
  onPressWord: (word: string) => void;
  activeWord?: string | null;
}

/**
 * Renders a tapped Korean word with a character-by-character subtle
 * yellow/gold text-color wave animation (no background highlight).
 */
function GoldenWaveWord({ word }: { word: string }) {
  const chars = word.split('');
  const animValuesRef = useRef<Animated.Value[]>([]);

  if (animValuesRef.current.length !== chars.length) {
    animValuesRef.current = chars.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    const animations = animValuesRef.current.map((val, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 110),
          Animated.timing(val, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      )
    );

    animations.forEach((anim) => anim.start());
    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [word]);

  return (
    <View style={styles.waveWordRow}>
      {chars.map((ch, idx) => {
        const animVal = animValuesRef.current[idx] || new Animated.Value(0);
        const textColor = animVal.interpolate({
          inputRange: [0, 0.35, 0.7, 1],
          outputRange: ['#B45309', '#D97706', '#F59E0B', '#EAB308'],
        });
        const translateY = animVal.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -1.8, 0],
        });

        return (
          <Animated.Text
            key={`${idx}-${ch}`}
            style={[
              styles.wordText,
              styles.waveCharText,
              {
                color: textColor,
                transform: [{ translateY }],
              },
            ]}>
            {ch}
          </Animated.Text>
        );
      })}
      <Text style={styles.wordText}> </Text>
    </View>
  );
}

export function InteractiveKoreanText({
  content,
  onPressWord,
  activeWord,
}: InteractiveKoreanTextProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [tappedTokenKey, setTappedTokenKey] = useState<string | null>(null);

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
            tap the words
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
                const tokenKey = `${pIdx}-${wIdx}`;
                const cleanWord = word.replace(/[.,!?'"~()·]/g, '');
                const isTapped =
                  tappedTokenKey === tokenKey ||
                  (Boolean(activeWord) &&
                    !tappedTokenKey &&
                    cleanWord === activeWord);

                return (
                  <TouchableOpacity
                    key={tokenKey}
                    activeOpacity={0.65}
                    onPress={() => {
                      setTappedTokenKey(tokenKey);
                      onPressWord(cleanWord);
                    }}
                    style={styles.wordTouchable}>
                    {isTapped ? (
                      <GoldenWaveWord word={word} />
                    ) : (
                      <Text style={[styles.wordText, { color: colors.text }]}>
                        {word}{' '}
                      </Text>
                    )}
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
  waveWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  waveCharText: {
    fontWeight: '700',
  },
});
