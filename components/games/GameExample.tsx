/**
 * Game Integration Example
 *
 * This file demonstrates how to integrate the mini-games into your app.
 * Copy this pattern wherever you need to launch a game.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  TapToPetGame,
  SwipeToGroomGame,
  RhythmFeedGame,
  FetchTogetherGame,
  GameCompleteModal,
} from './index';

type GameType = 'tap' | 'swipe' | 'rhythm' | 'fetch';

export const GameLauncher: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [gameData, setGameData] = useState({
    score: 0,
    targetScore: 0,
    stars: 0,
    coOpBonus: false,
  });

  // Example: Check if partner is currently playing
  // This would come from your backend/store
  const partnerPlaying = true;

  const handleGameComplete = (score: number, coOpBonus: boolean) => {
    const targetScore = getTargetScore(activeGame!);
    const stars = calculateStars(score, targetScore);

    setGameData({
      score,
      targetScore,
      stars,
      coOpBonus,
    });

    // Show results after a short delay
    setTimeout(() => {
      setActiveGame(null);
      setShowResults(true);
    }, 500);
  };

  const getTargetScore = (game: GameType): number => {
    switch (game) {
      case 'tap':
        return 500;
      case 'swipe':
        return 400;
      case 'rhythm':
        return 350;
      case 'fetch':
        return 400;
    }
  };

  const calculateStars = (score: number, target: number): number => {
    const percentage = (score / target) * 100;
    if (percentage >= 120) return 3;
    if (percentage >= 100) return 2;
    if (percentage >= 80) return 1;
    return 0;
  };

  const getGameTitle = (game: GameType): string => {
    switch (game) {
      case 'tap':
        return 'Tap to Pet';
      case 'swipe':
        return 'Swipe to Groom';
      case 'rhythm':
        return 'Rhythm Feed';
      case 'fetch':
        return 'Fetch Together';
    }
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    setActiveGame((prev) => prev); // Keep same game active
  };

  const handleDone = () => {
    setShowResults(false);
    setActiveGame(null);
  };

  return (
    <View style={styles.container}>
      {/* Game Launcher Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => setActiveGame('tap')}
        >
          <Text style={styles.buttonEmoji}>🐱</Text>
          <Text style={styles.buttonText}>Tap to Pet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => setActiveGame('swipe')}
        >
          <Text style={styles.buttonEmoji}>✨</Text>
          <Text style={styles.buttonText}>Swipe to Groom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => setActiveGame('rhythm')}
        >
          <Text style={styles.buttonEmoji}>🎵</Text>
          <Text style={styles.buttonText}>Rhythm Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => setActiveGame('fetch')}
        >
          <Text style={styles.buttonEmoji}>🎾</Text>
          <Text style={styles.buttonText}>Fetch Together</Text>
        </TouchableOpacity>
      </View>

      {/* Tap to Pet Game */}
      <TapToPetGame
        visible={activeGame === 'tap'}
        onClose={() => setActiveGame(null)}
        onComplete={handleGameComplete}
        partnerPlaying={partnerPlaying}
      />

      {/* Swipe to Groom Game */}
      <SwipeToGroomGame
        visible={activeGame === 'swipe'}
        onClose={() => setActiveGame(null)}
        onComplete={handleGameComplete}
        partnerPlaying={partnerPlaying}
      />

      {/* Rhythm Feed Game */}
      <RhythmFeedGame
        visible={activeGame === 'rhythm'}
        onClose={() => setActiveGame(null)}
        onComplete={handleGameComplete}
        partnerPlaying={partnerPlaying}
      />

      {/* Fetch Together Game */}
      <FetchTogetherGame
        visible={activeGame === 'fetch'}
        onClose={() => setActiveGame(null)}
        onComplete={handleGameComplete}
        partnerPlaying={partnerPlaying}
      />

      {/* Game Complete Modal */}
      <GameCompleteModal
        visible={showResults}
        score={gameData.score}
        targetScore={gameData.targetScore}
        stars={gameData.stars}
        coOpBonus={gameData.coOpBonus}
        onPlayAgain={handlePlayAgain}
        onDone={handleDone}
        gameTitle={getGameTitle(activeGame!)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  gameButton: {
    backgroundColor: '#E8B4B8',
    borderRadius: 16,
    padding: 16,
    width: 150,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
  },
});

export default GameLauncher;

/**
 * USAGE IN YOUR APP:
 *
 * 1. Import the games:
 *    import { TapToPetGame, GameCompleteModal } from './components/games';
 *
 * 2. Create state for game visibility:
 *    const [showGame, setShowGame] = useState(false);
 *
 * 3. Handle completion:
 *    const handleComplete = (score: number, coOpBonus: boolean) => {
 *      // Save score, update achievements, etc.
 *    };
 *
 * 4. Render the game:
 *    <TapToPetGame
 *      visible={showGame}
 *      onClose={() => setShowGame(false)}
 *      onComplete={handleComplete}
 *      partnerPlaying={true} // Check if partner is online
 *    />
 *
 * 5. That's it! The game handles everything else internally.
 */
