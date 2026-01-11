/**
 * AuthGuard Component
 * Protects routes that require authentication.
 * Redirects unauthenticated users to the login screen.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/constants/designTokens';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * useProtectedRoute hook - manages navigation based on auth state
 */
function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    // If user is not signed in and trying to access a protected route,
    // redirect to login
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    }

    // If user is signed in and trying to access auth screens,
    // redirect to the main app
    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);
}

/**
 * AuthGuard Component
 * Wraps the app and handles authentication redirects
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  // Set up protected route logic
  useProtectedRoute(user);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.rose} />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * withAuth HOC
 * Higher-order component to wrap screens that require authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.replace('/(auth)/login');
      }
    }, [user]);

    if (!user) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.rose} />
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
});

export default AuthGuard;
