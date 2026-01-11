/**
 * Mini-game types
 */
export type GameType = 'tap-pet' | 'swipe-groom' | 'rhythm-feed' | 'fetch-together';

/**
 * Game difficulty levels
 */
export type GameDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Game result
 */
export interface GameResult {
  gameType: GameType;
  score: number;
  accuracy: number;
  isCoop: boolean;
  coopBonus: number;
  timestamp: Date;
}

/**
 * Base mini-game configuration
 */
export interface MiniGame {
  id: GameType;
  name: string;
  description: string;
  duration: number; // seconds
  difficulty: GameDifficulty;
  cooperative: boolean;
  icon: string;
  color: string;
}

/**
 * Game state during play
 */
export interface GameState {
  gameType: GameType;
  isActive: boolean;
  startTime?: Date;
  score: number;
  combo: number;
  accuracy: number;
  actions: number;
  perfectHits: number;
}

/**
 * Tap to Pet game specific state
 */
export interface TapPetState extends GameState {
  gameType: 'tap-pet';
  targetTaps: number;
  currentTaps: number;
  tapZone: { x: number; y: number; radius: number };
}

/**
 * Swipe to Groom game specific state
 */
export interface SwipeGroomState extends GameState {
  gameType: 'swipe-groom';
  currentDirection: 'up' | 'down' | 'left' | 'right' | null;
  successfulSwipes: number;
  targetSwipes: number;
}

/**
 * Rhythm Feed game specific state
 */
export interface RhythmFeedState extends GameState {
  gameType: 'rhythm-feed';
  beats: Array<{ time: number; hit: boolean }>;
  currentBeat: number;
  perfectTiming: number;
}

/**
 * Fetch Together game specific state
 */
export interface FetchTogetherState extends GameState {
  gameType: 'fetch-together';
  playerTurn: 'user1' | 'user2';
  successfulPasses: number;
  targetPasses: number;
}
