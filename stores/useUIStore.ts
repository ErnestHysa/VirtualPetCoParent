/**
 * UI Store
 * Manages UI state, theme, navigation, and animations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

interface UIState {
  // Theme
  theme: Theme;
  colorScheme: ColorScheme;

  // UI state
  isTabBarVisible: boolean;
  isStatusBarHidden: boolean;
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;

  // Animation
  reduceMotion: boolean;
  hapticFeedback: boolean;

  // Onboarding
  hasCompletedOnboarding: boolean;
  currentOnboardingStep: number;

  // Internal
  _toastTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setTabBarVisible: (visible: boolean) => void;
  setStatusBarHidden: (hidden: boolean) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  setReduceMotion: (reduce: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;

  // Helpers
  getColor: (lightColor: string, darkColor: string) => string;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'auto',
      colorScheme: 'light',
      isTabBarVisible: true,
      isStatusBarHidden: false,
      isLoading: false,
      toast: null,
      reduceMotion: false,
      hapticFeedback: true,
      hasCompletedOnboarding: false,
      currentOnboardingStep: 0,
      _toastTimer: null,

      // Theme actions
      setTheme: (theme) => set({ theme }),
      setColorScheme: (colorScheme) => set({ colorScheme }),

      // UI visibility
      setTabBarVisible: (isTabBarVisible) => set({ isTabBarVisible }),
      setStatusBarHidden: (isStatusBarHidden) => set({ isStatusBarHidden }),

      // Loading
      setLoading: (isLoading) => set({ isLoading }),

      // Toast
      showToast: (message, type = 'info') => {
        // Clear existing timer if any
        const existingTimer = get()._toastTimer;
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        // Set new toast and timer
        set({ toast: { message, type } });
        const timer = setTimeout(() => {
          get().hideToast();
        }, 3000);
        set({ _toastTimer: timer });
      },
      hideToast: () => {
        const existingTimer = get()._toastTimer;
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        set({ toast: null, _toastTimer: null });
      },

      // Accessibility
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),

      // Onboarding
      setOnboardingComplete: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setCurrentOnboardingStep: (currentOnboardingStep) => set({ currentOnboardingStep }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true, currentOnboardingStep: 0 }),

      // Get color based on theme
      getColor: (lightColor, darkColor) => {
        const { colorScheme } = get();
        return colorScheme === 'dark' ? darkColor : lightColor;
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        theme: state.theme,
        reduceMotion: state.reduceMotion,
        hapticFeedback: state.hapticFeedback,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        // Exclude _toastTimer from persistence (runtime-only)
      }),
    }
  )
);
