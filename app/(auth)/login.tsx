import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { colors, typography, motion, spacing, borderRadius, shadows } from '../../constants/designTokens';
import { AnimatedPet } from '../../components/AnimatedPet';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores/useAuthStore';

export default function LoginScreen() {
  const { trigger } = useHapticFeedback();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
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

    if (!password.trim()) {
      setError('Please enter your password');
      trigger('error');
      return;
    }

    setIsLoading(true);
    trigger('medium');

    try {
      // Call the auth store signIn method
      const success = await signIn(email, password);
      if (!success) {
        throw new Error('Invalid login credentials');
      }

      trigger('success');
      router.replace('/(tabs)');
    } catch (err: any) {
      // Handle different error types
      let errorMessage = 'Unable to sign in. Please check your credentials and try again.';

      if (err?.message) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      trigger('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    trigger('light');
    // Navigate to forgot password screen (to be implemented)
    router.push('/(auth)/forgot-password');
  };

  const handleSignup = () => {
    trigger('light');
    router.push('/(auth)/signup');
  };

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !isLoading;

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
              species="dragon"
              color="rose"
              size={100}
              emotion="happy"
              testID="login-pet"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>
              Sign in to continue caring for your pet
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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
              accessibilityHint="Enter your email address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!showPassword}
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  error && password.trim().length === 0 ? styles.textInputError : null,
                ]}
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password"
              />
              <TouchableOpacity
                onPress={() => {
                  setShowPassword(!showPassword);
                  trigger('light');
                }}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordButton}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canSubmit}
              style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
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
                  <Text style={[styles.loginButtonText, !canSubmit && styles.textDisabled]}>
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleSignup}
              accessibilityRole="button"
              accessibilityLabel="Sign up for a new account"
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm + 2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.rose,
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  loginButton: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  loginButtonDisabled: {
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
  loginButtonText: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  signupText: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
  },
  signupLink: {
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
