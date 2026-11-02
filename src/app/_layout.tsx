import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { SavedProvider } from '@/context/saved-context';
import { AiProvider } from '@/context/ai-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SavedProvider>
          <AiProvider>
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
              <Stack.Screen
                name="modal/ai-connect"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/ai-feedback"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/scan-handwriting"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/ocr-confirm"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/admissions"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/statement-editor"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/statement-feedback"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/community"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/essay-detail"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/publish-essay"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/report-essay"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/account-privacy"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </AiProvider>
        </SavedProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
