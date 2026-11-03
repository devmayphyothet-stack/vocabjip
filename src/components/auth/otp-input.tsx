import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OtpInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  code,
  onCodeChange,
  length = 6,
  error = false,
  autoFocus = true,
}: OtpInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  const digits = code.split('');

  return (
    <Pressable onPress={handleBoxPress} style={styles.container}>
      {/* Hidden real TextInput that captures all typing & clipboard paste */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => {
          // Allow only numeric digits up to specified length
          const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
          onCodeChange(cleaned);
        }}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Render 6 visually distinct boxes */}
      <View style={styles.boxesContainer}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrent = index === digits.length;
          const isFilled = Boolean(digit);

          let borderColor: string = colors.border;
          if (error) {
            borderColor = colors.error;
          } else if (isCurrent) {
            borderColor = colors.accent;
          } else if (isFilled) {
            borderColor = colors.text;
          }

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor,
                  backgroundColor: colors.card,
                },
                isCurrent && styles.boxCurrent,
                error && { backgroundColor: colors.errorLight },
              ]}>
              <Text
                style={[
                  styles.digitText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
                  },
                ]}>
                {digit}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 10,
    fontSize: 18,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  box: {
    width: 48,
    minWidth: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCurrent: {
    borderWidth: 2,
    transform: [{ scale: 1.03 }],
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
  },
});
