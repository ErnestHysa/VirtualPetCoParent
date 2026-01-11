/**
 * Game Store
 * Manages mini-game state, scoring, and co-op sessions
 */

import { create } from 'zustand';
import { GameState, GameType, GameResult } from '@/types';
import { MINI_GAMES } from '@/constants/games';

interface GameStoreState {
  // Active game
  activeGame: GameType | null;
  gameState: GameState | null;
  isPlaying: boolean;
  isPaused: boolean;

  // Results
  lastResult: GameResult | null;
  highScores: Record<GameType, number>;
  totalGamesPlayed: number;

  // Co-op
  isCoopSession: boolean;
  partnerIsPlaying: boolean;
  partnerJoinedAt: Date | null;

  // Actions
  startGame: (gameType: GameType, isCoop?: boolean) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (result: GameResult) => void;
  resetGame: () => void;

  // In-game actions
  updateScore: (points: number) => void;
  updateCombo: (combo: number) => void;
  updateAccuracy: (accuracy: number) => void;

  // Co-op actions
  partnerJoined: () => void;
  partnerLeft: () => void;

  // Get game config
  getGameConfig: (gameType: GameType) => typeof MINI_GAMES[GameType];
}

export const useGameStore = create<GameStoreState>((set) => ({
  // Initial state
  activeGame: null,
  gameState: null,
  isPlaying: false,
  isPaused: false,
  lastResult: null,
  highScores: {
    'tap-pet': 0,
    'swipe-groom': 0,
    'rhythm-feed': 0,
    'fetch-together': 0,
  },
  totalGamesPlayed: 0,
  isCoopSession: false,
  partnerIsPlaying: false,
  partnerJoinedAt: null,

  // Start a game
  startGame: (gameType, isCoop = false) => {
    set({
      activeGame: gameType,
      gameState: {
        gameType,
        isActive: true,
        startTime: new Date(),
        score: 0,
        combo: 0,
        accuracy: 100,
        actions: 0,
        perfectHits: 0,
      },
      isPlaying: true,
      isPaused: false,
      isCoopSession: isCoop,
      partnerIsPlaying: false,
      partnerJoinedAt: null,
    });
  },

  // Pause game
  pauseGame: () => {
    set({ isPaused: true });
  },

  // Resume game
  resumeGame: () => {
    set({ isPaused: false });
  },

  // End game and save results
  endGame: (result) => {
    // Use functional update to prevent race conditions
    set((state) => {
      const { activeGame, highScores, totalGamesPlayed } = state;

      // Create new highScores object immutably
      const newHighScores = { ...highScores };
      if (activeGame && result.score > highScores[activeGame]) {
        newHighScores[activeGame] = result.score;
      }

      return {
        activeGame: null,
        gameState: null,
        isPlaying: false,
        isPaused: false,
        lastResult: result,
        highScores: newHighScores,
        totalGamesPlayed: totalGamesPlayed + 1,
        isCoopSession: false,
        partnerIsPlaying: false,
        partnerJoinedAt: null,
      };
    });
  },

  // Reset game state
  resetGame: () => {
    set({
      activeGame: null,
      gameState: null,
      isPlaying: false,
      isPaused: false,
      isCoopSession: false,
      partnerIsPlaying: false,
      partnerJoinedAt: null,
    });
  },

  // Update score during game
  updateScore: (points) => {
    set((state) => {
      if (!state.gameState) return state;
      return {
        gameState: {
          ...state.gameState,
          score: state.gameState.score + points,
          actions: state.gameState.actions + 1,
        },
      };
    });
  },

  // Update combo
  updateCombo: (combo) => {
    set((state) => {
      if (!state.gameState) return state;
      return {
        gameState: {
          ...state.gameState,
          combo,
        },
      };
    });
  },

  // Update accuracy
  updateAccuracy: (accuracy) => {
    set((state) => {
      if (!state.gameState) return state;
      return {
        gameState: {
          ...state.gameState,
          accuracy,
        },
      };
    });
  },

  // Partner joined co-op session
  partnerJoined: () => {
    set({
      partnerIsPlaying: true,
      partnerJoinedAt: new Date(),
    });
  },

  // Partner left co-op session
  partnerLeft: () => {
    set({
      partnerIsPlaying: false,
    });
  },

  // Get game configuration
  getGameConfig: (gameType) => {
    return MINI_GAMES[gameType];
  },
}));
