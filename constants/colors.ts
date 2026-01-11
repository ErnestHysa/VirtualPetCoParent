/**
 * Design tokens - Colors
 * Whimsical Premium color palette
 */

// Primary palette
export const PRIMARY = {
  rose: '#E8B4B8',
  lavender: '#C5B9CD',
  sky: '#A7C7E7',
} as const;

// Background colors
export const BACKGROUND = {
  light: '#FAF8F5',
  dark: '#1A1A2E',
  darkSecondary: '#16162A',
} as const;

// Semantic colors for pet stats
export const SEMANTIC = {
  hunger: '#FFB5A7',      // Warm peach
  happiness: '#FFE58F',   // Soft gold
  energy: '#B5EAD7',      // Mint green
  love: '#FF9AA2',        // Soft pink
} as const;

// Status colors
export const STATUS = {
  success: '#B5EAD7',
  warning: '#FFE58F',
  error: '#FF9AA2',
  info: '#A7C7E7',
} as const;

// Neutral scale
export const NEUTRAL = {
  50: '#FAF9F7',
  100: '#F5F3F0',
  200: '#E8E5E1',
  300: '#D4D0CA',
  400: '#B5B0A8',
  500: '#9A948B',
  600: '#7B756D',
  700: '#615E57',
  800: '#4D4A45',
  900: '#3F3C38',
} as const;

// Gradient definitions for backgrounds and effects
export const GRADIENTS = {
  // Pet ambient glow
  petGlow: {
    light: ['#E8B4B8', '#C5B9CD'],
    dark: ['#A7C7E7', '#1A1A2E'],
  },
  // Button backgrounds
  primaryButton: ['#E8B4B8', '#D4A8AC'],
  secondaryButton: ['#C5B9CD', '#B5ADC1'],
  // Stage evolution backgrounds
  evolution: ['#FFE58F', '#B5EAD7'],
} as const;

// Care action colors for feedback
export const CARE_ACTION_COLORS = {
  feed: '#FFB5A7',
  play: '#FFE58F',
  walk: '#B5EAD7',
  pet: '#FF9AA2',
  groom: '#C5B9CD',
} as const;
