/**
 * SessionWarning Component
 * Shows a warning modal when the user's session is about to expire
 * and handles session refresh/timeout
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/designTokens';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SessionWarningProps {
  visible: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  timeRemaining?: number; // seconds
}

export function SessionWarning({
  visible,
  onRefresh,
  onSignOut,
  timeRemaining = 60,
}: SessionWarningProps) {
  const { trigger } = useHapticFeedback();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Pulse animation for warning icon
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 5, stiffness: 150 }),
          withSpring(1, { damping: 5, stiffness: 150 })
        ),
        -1,
        false
      );
      trigger('warning');
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    trigger('medium');
    try {
      await onRefresh();
      trigger('success');
    } catch (error) {
      trigger('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = () => {
    trigger('light');
    onSignOut();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Warning Icon with Animation */}
          <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <Text style={styles.warningIcon}>⚠️</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Session Expiring</Text>

          {/* Message */}
          <Text style={styles.message}>
            Your session will expire in{' '}
            <Text style={styles.timeText}>{formatTime(timeRemaining)}</Text>.
            Would you like to stay signed in?
          </Text>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={[styles.button, styles.refreshButton]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Stay signed in"
            accessibilityState={{ disabled: isRefreshing }}
          >
            <LinearGradient
              colors={['#E8B4B8', '#C5B9CD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {isRefreshing ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.buttonText}>Stay Signed In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.button, styles.signOutButton]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out now"
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/**
 * useSessionTimeout Hook
 * Manages session timeout checking and warning display
 */
export function useSessionTimeout(
  sessionExpiryMs: number | null,
  warningSeconds: number = 60,
  onSessionExpired: () => void
) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!sessionExpiryMs) {
      setShowWarning(false);
      return;
    }

    const checkSession = () => {
      const now = Date.now();
      const expiryTime = sessionExpiryMs;
      const timeUntilExpiry = expiryTime - now;
      const warningThreshold = warningSeconds * 1000;

      if (timeUntilExpiry <= 0) {
        // Session expired
        setShowWarning(false);
        onSessionExpired();
      } else if (timeUntilExpiry <= warningThreshold) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(Math.ceil(timeUntilExpiry / 1000));
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every second
    const interval = setInterval(checkSession, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiryMs, warningSeconds, onSessionExpired]);

  return {
    showWarning,
    timeRemaining,
    dismissWarning: () => setShowWarning(false),
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...shadows.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.scale[4],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.scale[2],
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.lineHeight.relaxed,
  },
  timeText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.rose,
  },
  button: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  refreshButton: {
    minHeight: 52,
  },
  gradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border.light,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
});

export default SessionWarning;
