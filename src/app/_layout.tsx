import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme, Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/auth-context';
import { SavedProvider } from '@/context/saved-context';
import { AiProvider } from '@/context/ai-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const outerBg = isDark ? '#090D16' : '#F1F5F9';
  const innerBg = isDark ? '#0F172A' : '#FFFFFF';

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <SavedProvider>
            <AiProvider>
              <View style={[styles.outerContainer, { backgroundColor: outerBg }]}>
                <View style={[styles.innerApp, { backgroundColor: innerBg }]}>
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
                    <Stack.Screen
                      name="modal/about"
                      options={{ presentation: 'modal', headerShown: false }}
                    />
                    <Stack.Screen
                      name="modal/feedback"
                      options={{ presentation: 'modal', headerShown: false }}
                    />
                  </Stack>
                </View>
              </View>
            </AiProvider>
          </SavedProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerApp: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 540,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    }),
  },
});
