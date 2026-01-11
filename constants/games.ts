import { MiniGame, GameType } from '@/types/game';

/**
 * Mini-game configurations
 */
export const MINI_GAMES: Record<GameType, MiniGame> = {
  'tap-pet': {
    id: 'tap-pet',
    name: 'Tap to Pet',
    description: 'Tap rapidly to fill the affection meter!',
    duration: 30,
    difficulty: 1,
    cooperative: true,
    icon: '👆',
    color: '#FF9AA2',
  },
  'swipe-groom': {
    id: 'swipe-groom',
    name: 'Swipe to Groom',
    description: 'Follow the arrows with smooth swipes',
    duration: 30,
    difficulty: 2,
    cooperative: true,
    icon: '✨',
    color: '#C5B9CD',
  },
  'rhythm-feed': {
    id: 'rhythm-feed',
    name: 'Rhythm Feed',
    description: 'Tap to the beat for perfect timing!',
    duration: 30,
    difficulty: 3,
    cooperative: true,
    icon: '🎵',
    color: '#FFE58F',
  },
  'fetch-together': {
    id: 'fetch-together',
    name: 'Fetch Together',
    description: 'Pass the ball back and forth in sync!',
    duration: 30,
    difficulty: 2,
    cooperative: true,
    icon: '🎾',
    color: '#A7C7E7',
  },
};

/**
 * Game difficulty modifiers
 */
export const DIFFICULTY_MODIFIERS = {
  1: { multiplier: 1.0, targetScore: 50 },
  2: { multiplier: 1.2, targetScore: 75 },
  3: { multiplier: 1.5, targetScore: 100 },
  4: { multiplier: 2.0, targetScore: 150 },
  5: { multiplier: 2.5, targetScore: 200 },
} as const;

/**
 * Co-op bonus configuration
 */
export const COOP_CONFIG = {
  bothPlayingMultiplier: 1.5,
  syncWindow: 2000, // 2 seconds to count as synced
  perfectSyncBonus: 2.0,
  comboMultiplier: 0.1, // +10% per consecutive sync
} as const;

/**
 * Perfect timing window (ms) for rhythm game
 */
export const PERFECT_TIMING_WINDOW = 150;
export const GOOD_TIMING_WINDOW = 300;
export const OK_TIMING_WINDOW = 500;

/**
 * Scoring thresholds
 */
export const SCORE_THRESHOLDS = {
  bronze: 50,
  silver: 100,
  gold: 150,
  platinum: 200,
} as const;
