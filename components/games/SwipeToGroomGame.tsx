import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { GameModal } from './GameModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_DURATION = 30;

type Direction = 'up' | 'down' | 'left' | 'right';

interface ArrowPrompt {
  id: string;
  direction: Direction;
  createdAt: number;
}

export interface SwipeToGroomGameProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (score: number, coOpBonus: boolean) => void;
  partnerPlaying?: boolean;
}

export const SwipeToGroomGame: React.FC<SwipeToGroomGameProps> = ({
  visible,
  onClose,
  onComplete,
  partnerPlaying = false,
}) => {
  const { trigger } = useHapticFeedback();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [currentArrow, setCurrentArrow] = useState<ArrowPrompt | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [feedback, setFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);

  const arrowScale = useSharedValue(0);
  const arrowRotation = useSharedValue(0);
  const arrowOpacity = useSharedValue(1);
  const comboScale = useSharedValue(1);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const arrowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [visible, isPaused, gameState]);

  // Generate arrows
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    generateNewArrow();

    arrowTimerRef.current = setInterval(() => {
      generateNewArrow();
    }, 2000);

    return () => {
      if (arrowTimerRef.current) clearInterval(arrowTimerRef.current);
    };
  }, [visible, isPaused, gameState]);

  const generateNewArrow = () => {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    const newArrow: ArrowPrompt = {
      id: `arrow-${Date.now()}`,
      direction: randomDirection,
      createdAt: Date.now(),
    };

    setCurrentArrow(newArrow);

    // Animate arrow in
    arrowScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    arrowOpacity.value = withTiming(1, { duration: 200 });

    // Set rotation based on direction
    const rotations = { up: 0, right: 90, down: 180, left: 270 };
    arrowRotation.value = withTiming(rotations[randomDirection], {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  };

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (gameState !== 'playing' || isPaused || !currentArrow) return;

      const { translationX, translationY } = event;
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      let swipedDirection: Direction | null = null;

      // Determine swipe direction (minimum threshold of 50)
      if (Math.max(absX, absY) < 50) return;

      if (absX > absY) {
        swipedDirection = translationX > 0 ? 'right' : 'left';
      } else {
        swipedDirection = translationY > 0 ? 'down' : 'up';
      }

      if (swipedDirection === currentArrow.direction) {
        runOnJS(handleCorrectSwipe)();
      } else {
        runOnJS(handleMissedSwipe)();
      }
    });

  const handleCorrectSwipe = () => {
    trigger('light');

    // Calculate score with combo bonus
    const comboBonus = Math.min(combo * 5, 50);
    const points = 25 + comboBonus;
    setScore((prev) => prev + points);
    setCombo((prev) => prev + 1);

    // Show feedback
    setFeedback(combo >= 5 ? 'perfect' : 'good');
    showFeedback();

    // Combo animation
    comboScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    // Arrow animation
    arrowOpacity.value = withTiming(0, { duration: 150 });
    arrowScale.value = withSpring(1.5, { damping: 8, stiffness: 150 });

    // Generate new arrow quickly
    setTimeout(() => {
      if (gameState === 'playing' && !isPaused) {
        generateNewArrow();
      }
    }, 200);
  };

  const handleMissedSwipe = () => {
    trigger('error');

    setCombo(0);
    setFeedback('miss');
    showFeedback();

    // Reset combo animation
    comboScale.value = withSpring(1, motion.spring);
  };

  const showFeedback = () => {
    feedbackOpacity.value = withTiming(1, { duration: 100 });
    feedbackScale.value = withSpring(1.2, { damping: 8, stiffness: 200 });

    setTimeout(() => {
      feedbackOpacity.value = withTiming(0, { duration: 200 });
      feedbackScale.value = withTiming(0, { duration: 200 });
    }, 600);
  };

  const endGame = () => {
    setGameState(score >= 400 ? 'victory' : 'defeat');
    trigger(score >= 400 ? 'success' : 'error');

    setTimeout(() => {
      const coOpBonus = partnerPlaying && score >= 400;
      onComplete(score, coOpBonus);
    }, 2000);
  };

  const handleRestart = () => {
    trigger('medium');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCombo(0);
    setGameState('playing');
    setFeedback(null);
    arrowScale.value = 0;
    arrowOpacity.value = 1;
  };

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [
      { scale: arrowScale.value },
      { rotate: `${arrowRotation.value}deg` },
    ],
  }));

  const comboAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const getArrowEmoji = (direction: Direction) => {
    return '⬆️'; // All arrows will be rotated
  };

  const getFeedbackText = () => {
    switch (feedback) {
      case 'perfect':
        return 'PERFECT! 🔥';
      case 'good':
        return 'GOOD! ✓';
      case 'miss':
        return 'MISS ✗';
      default:
        return '';
    }
  };

  const getFeedbackColor = () => {
    switch (feedback) {
      case 'perfect':
        return colors.semantic.happiness;
      case 'good':
        return colors.semantic.energy;
      case 'miss':
        return '#FF6B6B';
      default:
        return colors.text.primary;
    }
  };

  // End screens
  if (gameState !== 'playing') {
    return (
      <GameModal
        visible={visible}
        onClose={onClose}
        title="Swipe to Groom"
        timer={timeLeft}
        isPaused={false}
        showPause={false}
      >
        <View style={styles.endContainer}>
          <LinearGradient
            colors={
              gameState === 'victory'
                ? [colors.semantic.energy, '#B5EAD7']
                : [colors.border.light, '#E0E0E0']
            }
            style={styles.endGradient}
          >
            <Text style={styles.endEmoji}>
              {gameState === 'victory' ? '✨' : '🔄'}
            </Text>
            <Text style={styles.endTitle}>
              {gameState === 'victory' ? 'Grooming Pro!' : 'Keep Practicing!'}
            </Text>
            <Text style={styles.endScore}>Score: {score}</Text>
            <Text style={styles.endCombo}>Max Combo: {combo}</Text>
            {gameState === 'victory' && partnerPlaying && (
              <Text style={styles.coOpBonus}>Co-op Bonus Active!</Text>
            )}
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={handleRestart}
              accessibilityRole="button"
              accessibilityLabel="Play again"
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close game"
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </GameModal>
    );
  }

  return (
    <GameModal
      visible={visible}
      onClose={onClose}
      title="Swipe to Groom"
      timer={timeLeft}
      isPaused={isPaused}
      onPause={() => setIsPaused(true)}
      onResume={() => setIsPaused(false)}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.gameContainer}>
          {/* Score and Combo */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <Animated.View style={comboAnimatedStyle}>
              <View style={styles.comboBox}>
                <Text style={styles.statLabel}>Combo</Text>
                <Text style={styles.statValue}>{combo}x</Text>
              </View>
            </Animated.View>
          </View>

          {/* Feedback */}
          {feedback && (
            <Animated.View style={[styles.feedbackContainer, feedbackAnimatedStyle]}>
              <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
                {getFeedbackText()}
              </Text>
            </Animated.View>
          )}

          {/* Arrow Display */}
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowLabel}>Swipe This Way:</Text>
            <Animated.View style={arrowAnimatedStyle}>
              <View style={styles.arrowBox}>
                <Text style={styles.arrowEmoji}>{getArrowEmoji(currentArrow?.direction || 'up')}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Swipe in the direction of the arrow!
            </Text>
            <Text style={styles.instructionSubtext}>
              Build combos for bonus points
            </Text>
            {partnerPlaying && (
              <Text style={styles.partnerHint}>
                Partner is playing too! Co-op bonus available!
              </Text>
            )}
          </View>

          {/* Swipe Area Visualization */}
          <View style={styles.swipeArea}>
            <Text style={styles.swipeAreaText}>Swipe anywhere</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </GameModal>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: colors.border.light,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  comboBox: {
    backgroundColor: colors.semantic.happiness,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: colors.semantic.happiness,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  feedbackContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  arrowContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  arrowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  arrowBox: {
    width: 150,
    height: 150,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.rose,
  },
  arrowEmoji: {
    fontSize: 80,
  },
  instructions: {
    backgroundColor: colors.border.light,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  partnerHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.semantic.happiness,
    textAlign: 'center',
    marginTop: 8,
  },
  swipeArea: {
    backgroundColor: `${colors.primary.rose}15`,
    padding: 20,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary.rose}30`,
    borderStyle: 'dashed',
  },
  swipeAreaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.rose,
  },
  endContainer: {
    flex: 1,
  },
  endGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  endEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  endTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 12,
  },
  endScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  endCombo: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  coOpBonus: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.rose,
    marginBottom: 40,
  },
  playAgainButton: {
    backgroundColor: colors.primary.rose,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: borderRadius.full,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  closeButton: {
    borderWidth: 2,
    borderColor: colors.text.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default SwipeToGroomGame;
