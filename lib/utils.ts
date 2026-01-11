/**
 * Utility functions for Virtual Pet Co-Parent
 */

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Format a date as a relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format number with K suffix for thousands
 */
export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Generate a random pairing code
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add formatting: XXX-XXX
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Validate pairing code format
 */
export function isValidPairingCode(code: string): boolean {
  return /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if care streak is maintained
 */
export function checkCareStreak(
  lastCareDate: Date,
  maxGapHours: number = 48
): boolean {
  const now = new Date();
  const diffHours = (now.getTime() - lastCareDate.getTime()) / (1000 * 60 * 60);
  return diffHours < maxGapHours;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse pet name for validation
 */
export function isValidPetName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && /^[a-zA-Z\s'-]+$/.test(trimmed);
}

/**
 * Get color brightness (for accessibility)
 */
export function getColorBrightness(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Determine if text should be light or dark based on background
 */
export function getContrastColor(backgroundColor: string): 'light' | 'dark' {
  return getColorBrightness(backgroundColor) > 128 ? 'dark' : 'light';
}

/**
 * Haptic feedback helper
 */
export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  try {
    const Haptics = await import('expo-haptics');
    switch (type) {
      case 'light':
        await Haptics.Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
}

/**
 * Animation spring config matching Apple's feel
 */
export const appleSpring = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

/**
 * Standard transition duration
 */
export const TRANSITION_DURATION = 300;

/**
 * Screen safe area insets helper
 */
export function getSafeAreaPadding() {
  return {
    paddingTop: 50, // Default safe area top
    paddingBottom: 20, // Default safe area bottom
  };
}

/**
 * Format stat value for display (0-100)
 */
export function formatStatValue(value: number): string {
  return Math.round(clamp(value, 0, 100)).toString();
}

/**
 * Get stat color based on value
 */
export function getStatColor(value: number): string {
  if (value >= 70) return '#B5EAD7'; // Good - mint
  if (value >= 40) return '#FFE58F'; // Warning - gold
  return '#FF9AA2'; // Critical - pink
}

/**
 * Get stat icon
 */
export function getStatIcon(type: 'hunger' | 'happiness' | 'energy'): string {
  switch (type) {
    case 'hunger':
      return '🍖';
    case 'happiness':
      return '❤️';
    case 'energy':
      return '⚡';
  }
}

/**
 * Calculate personality based on care actions
 */
export interface PersonalityCalculation {
  playful: number;
  calm: number;
  mischievous: number;
  affectionate: number;
}

export function calculatePersonality(
  actions: Array<{ type: string; count: number }>
): PersonalityCalculation {
  const personality: PersonalityCalculation = {
    playful: 0,
    calm: 0,
    mischievous: 0,
    affectionate: 0,
  };

  actions.forEach(action => {
    switch (action.type) {
      case 'play':
        personality.playful += action.count * 2;
        break;
      case 'pet':
        personality.affectionate += action.count * 2;
        break;
      case 'groom':
        personality.calm += action.count;
        personality.affectionate += action.count;
        break;
      case 'feed':
        personality.affectionate += action.count;
        break;
      case 'walk':
        personality.playful += action.count;
        personality.mischievous += action.count * 0.5;
        break;
    }
  });

  // Normalize to 0-100 scale
  const total = Object.values(personality).reduce((a, b) => a + b, 0) || 1;
  Object.keys(personality).forEach(key => {
    personality[key as keyof PersonalityCalculation] = Math.round(
      (personality[key as keyof PersonalityCalculation] / total) * 100
    );
  });

  return personality;
}
