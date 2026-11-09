/**
 * VocabJip Theme System
 * Minimalist Korean Stationery Palette with Dark & Light Mode support.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#18181B',
    textSecondary: '#71717A',
    textMuted: '#71717A',
    background: '#FAF9F6', // Warm ivory paper background
    card: '#FFFFFF',
    cardMuted: '#F4F4F5',
    border: '#E4E4E7',
    borderLight: '#F0F0F2',
    primary: '#18181B', // Deep Korean ink
    primaryContrast: '#FFFFFF',
    accent: '#2563EB', // Korean cobalt blue
    accentLight: '#EFF6FF',
    streak: '#D97706', // Warm amber
    streakLight: '#FEF3C7',
    success: '#059669',
    successLight: '#ECFDF5',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    backgroundElement: '#F4F4F5',
    backgroundSelected: '#E4E4E7',
  },
  dark: {
    text: '#F4F4F5',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    background: '#121214',
    card: '#18181B',
    cardMuted: '#27272A',
    border: '#27272A',
    borderLight: '#1F1F23',
    primary: '#F4F4F5',
    primaryContrast: '#18181B',
    accent: '#3B82F6',
    accentLight: '#1E293B',
    streak: '#F59E0B',
    streakLight: '#451A03',
    success: '#10B981',
    successLight: '#064E3B',
    error: '#EF4444',
    errorLight: '#450A0A',
    backgroundElement: '#27272A',
    backgroundSelected: '#3F3F46',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 24, android: 16 }) ?? 16;
export const MaxContentWidth = 720;
