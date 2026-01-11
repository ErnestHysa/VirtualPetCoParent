/**
 * Signup Screen
 * User authentication with email/password
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BACKGROUND, PRIMARY, NEUTRAL } from '@/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const { colorScheme } = useUIStore();
  const { signUp, signIn, isLoading } = useAuthStore();

  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const isValid = () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!isLogin && username.length < 2) {
      setError('Username must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!isValid()) return;

    const success = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, username);

    if (success) {
      router.push('/(auth)/onboarding');
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View entering={FadeIn} style={styles.content}>
        {/* Logo/Branding */}
        <View style={styles.branding}>
          <Text style={styles.logo}>🐉</Text>
          <Text style={styles.title}>Virtual Pet</Text>
          <Text style={styles.subtitle}>Co-Parent</Text>
        </View>

        {/* Auth Form */}
        <Card variant="glass" padding={24} style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isLogin
              ? 'Sign in to continue caring for your pet'
              : 'Start your journey with a companion'}
          </Text>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100],
                    color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800],
                  },
                ]}
                placeholder="Choose a username"
                placeholderTextColor={NEUTRAL[400]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100],
                  color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800],
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={NEUTRAL[400]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100],
                  color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800],
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={NEUTRAL[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Button
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            style={styles.submitButton}
          />
        </Card>

        {/* Toggle */}
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.toggleLink}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#E8B4B8',
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#615E57',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D4A45',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    color: '#FF9AA2',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
  toggle: {
    alignItems: 'center',
    padding: 16,
  },
  toggleText: {
    fontSize: 15,
    color: '#615E57',
  },
  toggleLink: {
    color: '#E8B4B8',
    fontWeight: '600',
  },
});
