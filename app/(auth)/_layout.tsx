/**
 * Auth Stack Layout
 * Authentication flow screens
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useUIStore } from '@/stores';
import { StatusBar } from 'expo-status-bar';
import { BACKGROUND } from '@/constants/colors';

export default function AuthLayout() {
  const { colorScheme } = useUIStore();

  return (
    <>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light,
          },
        }}
      >
        <Stack.Screen name="signup" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="pair" />
      </Stack>
    </>
  );
}
