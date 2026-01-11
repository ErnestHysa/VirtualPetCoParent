/**
 * Index Screen
 * Redirects to appropriate screen based on auth state
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore, useUIStore } from '@/stores';
import { BACKGROUND } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { hasCompletedOnboarding } = useUIStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/signup');
    } else if (!hasCompletedOnboarding) {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, hasCompletedOnboarding]);

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND.light, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#E8B4B8" />
    </View>
  );
}
