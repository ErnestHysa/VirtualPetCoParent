/**
 * Forgot Password Screen
 * Allows users to request a password reset email
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/designTokens';
import { AnimatedPet } from '@/components/AnimatedPet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { supabase } from '@/lib/supabase';

type FormState = 'input' | 'success' | 'error';

export default function ForgotPasswordScreen() {
  const { trigger } = useHapticFeedback();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState<FormState>('input');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const validateEmail = (emailVal: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleResetPassword = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      trigger('error');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      trigger('error');
      return;
    }

    setIsLoading(true);
    trigger('medium');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window?.location?.origin || '', // For web, redirect back to app
      });

      if (resetError) {
        throw resetError;
      }

      setFormState('success');
      trigger('success');
    } catch (err: any) {
      let errorMessage = 'Unable to send reset email. Please try again.';

      if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setFormState('error');
      trigger('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    trigger('light');
    router.back();
  };

  const canSubmit = email.trim().length > 0 && !isLoading && formState === 'input';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Decorative Pet */}
          <View style={styles.petContainer}>
            <AnimatedPet
              species={formState === 'success' ? 'cat' : 'dragon'}
              color={formState === 'success' ? 'sky' : 'rose'}
              size={100}
              emotion={formState === 'success' ? 'happy' : 'excited'}
              testID="forgot-password-pet"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {formState === 'success' ? 'Email Sent!' : 'Forgot Password?'}
            </Text>
            <Text style={styles.subtitle}>
              {formState === 'success'
                ? 'Check your email for a link to reset your password.'
                : 'Enter your email and we\'ll send you a reset link.'
              }
            </Text>
          </View>

          {/* Error Message */}
          {error && formState === 'error' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {formState !== 'success' && (
            <>
              {/* Email Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                    if (formState === 'error') setFormState('input');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.textInput,
                    error && email.trim().length === 0 ? styles.textInputError : null,
                  ]}
                  accessibilityLabel="Email input"
                  accessibilityHint="Enter your email address to receive reset link"
                />
              </View>

              {/* Send Reset Link Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={!canSubmit}
                  style={[styles.resetButton, !canSubmit && styles.resetButtonDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Send password reset email"
                  accessibilityState={{ disabled: !canSubmit }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#E8B4B8', '#C5B9CD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, !canSubmit && styles.gradientDisabled]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.text.inverse} size="small" />
                    ) : (
                      <Text style={[styles.resetButtonText, !canSubmit && styles.textDisabled]}>
                        Send Reset Link
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backContainer}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={styles.backText}>
              {formState === 'success' ? 'Back to' : 'Remember your password?'}{' '}
            </Text>
            <Text style={styles.backLink}>Sign In</Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.scale[5],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.scale[2],
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary.rose}20`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.rose,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.scale[1],
    color: colors.primary.rose,
    fontWeight: typography.fontWeight.medium,
  },
  inputSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.scale[2],
    color: colors.text.primary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  textInputError: {
    borderColor: colors.primary.rose,
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  resetButton: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  gradientDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
  },
  backLink: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.rose,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: typography.scale[1],
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
});
