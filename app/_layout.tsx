/**
 * Root Layout
 * Main app layout with theme provider and error boundary
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUIStore, useAuthStore } from '@/stores';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BACKGROUND } from '@/constants/colors';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // System fonts are used by default
  });

  const colorScheme = useColorScheme();
  const { setColorScheme, hasCompletedOnboarding, toast, hideToast } = useUIStore();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set color scheme based on system preference
    setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
  }, [colorScheme]);

  useEffect(() => {
    // Load user on mount
    async function prepare() {
      try {
        await loadUser();
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    // Hide splash screen when ready
    if (loaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: BACKGROUND.light }]}>
        <ActivityIndicator size="large" color="#E8B4B8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar
            barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light}
          />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
            initialRouteName={
              !isAuthenticated ? '(auth)' : !hasCompletedOnboarding ? '(auth)/onboarding' : '(tabs)'
            }
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="milestones"
              options={{
                headerShown: true,
                title: 'Milestones',
                headerStyle: { backgroundColor: BACKGROUND.light },
                headerTintColor: '#4D4A45',
              }}
            />
          </Stack>
          <Toast
            visible={!!toast}
            message={toast?.message || ''}
            type={toast?.type || 'info'}
            onDismiss={hideToast}
          />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
