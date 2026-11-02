import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { SavedProvider } from '@/context/saved-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen smoothly once mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SavedProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal/vocab-detail"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/pattern-detail"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/quiz"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/wongoji-editor"
              options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
          </Stack>
        </SavedProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
