/**
 * Design Tokens for Virtual Pet Co-Parent
 * Whimsical Premium Design System
 */

export const colors = {
  primary: {
    rose: '#E8B4B8',
    lavender: '#C5B9CD',
    sky: '#A7C7E7',
  },
  background: {
    light: '#FAF8F5',
    dark: '#1A1A2E',
  },
  semantic: {
    hunger: '#FFB5A7',
    happiness: '#FFE58F',
    energy: '#B5EAD7',
  },
  text: {
    primary: '#1A1A2E',
    secondary: '#4A4A5E',
    tertiary: '#8A8A9E',
    inverse: '#FFFFFF',
  },
  border: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.12)',
    dark: 'rgba(0, 0, 0, 0.16)',
  },
} as const;

export const typography = {
  scale: [12, 14, 17, 20, 24, 32] as const,
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const motion = {
  spring: {
    damping: 15,
    stiffness: 150,
  },
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  stagger: {
    offset: 100,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const accessibility = {
  minTouchTarget: 44,
  minContrastRatio: 4.5, // WCAG AA
} as const;
