import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { GameModal } from './GameModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_DURATION = 30;
const BEAT_INTERVAL = 600; // ms between beats (100 BPM)

interface BeatTarget {
  id: string;
  createdAt: number;
  hit: boolean;
  missed: boolean;
}

export interface RhythmFeedGameProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (score: number, coOpBonus: boolean) => void;
  partnerPlaying?: boolean;
}

export const RhythmFeedGame: React.FC<RhythmFeedGameProps> = ({
  visible,
  onClose,
  onComplete,
  partnerPlaying = false,
}) => {
  const { trigger } = useHapticFeedback();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [feedback, setFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [hits, setHits] = useState({ perfect: 0, good: 0, miss: 0 });

  const foodScale = useSharedValue(1);
  const foodTranslateY = useSharedValue(0);
  const targetPulse = useSharedValue(1);
  const beatIndicator = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0);
  const streakScale = useSharedValue(1);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBeatTimeRef = useRef<number>(0);

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

  // Beat animation
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    const startBeat = () => {
      lastBeatTimeRef.current = Date.now();
      beatIndicator.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: BEAT_INTERVAL - 100 })
      );
    };

    startBeat();
    beatTimerRef.current = setInterval(startBeat, BEAT_INTERVAL);

    return () => {
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    };
  }, [visible, isPaused, gameState]);

  // Food bouncing animation
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    foodTranslateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: BEAT_INTERVAL / 2, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: BEAT_INTERVAL / 2, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );

    targetPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: BEAT_INTERVAL - 150, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );
  }, [visible, isPaused, gameState]);

  const handleTap = () => {
    if (gameState !== 'playing' || isPaused) return;

    const now = Date.now();
    const timeSinceBeat = now - lastBeatTimeRef.current;
    const timeToNextBeat = BEAT_INTERVAL - timeSinceBeat;
    const timingWindow = Math.min(timeSinceBeat, timeToNextBeat);

    trigger('light');

    if (timingWindow <= 100) {
      // Perfect
      handlePerfect();
    } else if (timingWindow <= 200) {
      // Good
      handleGood();
    } else {
      // Miss (too early/late)
      handleMiss();
    }
  };

  const handlePerfect = () => {
    const points = 30 + Math.min(streak * 3, 30);
    setScore((prev) => prev + points);
    setStreak((prev) => prev + 1);
    setHits((prev) => ({ ...prev, perfect: prev.perfect + 1 }));
    setFeedback('perfect');

    trigger('success');

    foodScale.value = withSequence(
      withSpring(1.4, { damping: 6, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    streakScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    showFeedback();
  };

  const handleGood = () => {
    const points = 15 + Math.min(streak * 2, 15);
    setScore((prev) => prev + points);
    setStreak((prev) => prev + 1);
    setHits((prev) => ({ ...prev, good: prev.good + 1 }));
    setFeedback('good');

    foodScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    showFeedback();
  };

  const handleMiss = () => {
    setStreak(0);
    setHits((prev) => ({ ...prev, miss: prev.miss + 1 }));
    setFeedback('miss');

    trigger('error');

    streakScale.value = withSpring(1, motion.spring);

    showFeedback();
  };

  const showFeedback = () => {
    feedbackOpacity.value = withTiming(1, { duration: 100 });
    feedbackScale.value = withSpring(1.2, { damping: 8, stiffness: 200 });

    setTimeout(() => {
      feedbackOpacity.value = withTiming(0, { duration: 200 });
      feedbackScale.value = withTiming(0, { duration: 200 });
    }, 500);
  };

  const endGame = () => {
    setGameState(score >= 350 ? 'victory' : 'defeat');
    trigger(score >= 350 ? 'success' : 'error');

    setTimeout(() => {
      const coOpBonus = partnerPlaying && score >= 350;
      onComplete(score, coOpBonus);
    }, 2000);
  };

  const handleRestart = () => {
    trigger('medium');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    setGameState('playing');
    setFeedback(null);
    setHits({ perfect: 0, good: 0, miss: 0 });
    foodScale.value = 1;
    streakScale.value = 1;
  };

  const foodAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: foodScale.value },
      { translateY: foodTranslateY.value },
    ],
  }));

  const targetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: targetPulse.value }],
    borderColor: interpolateColor(
      beatIndicator.value,
      [0, 1],
      [colors.primary.rose, colors.semantic.happiness]
    ),
  }));

  const beatAnimatedStyle = useAnimatedStyle(() => ({
    opacity: beatIndicator.value,
    transform: [{ scale: interpolate(beatIndicator.value, [0, 1], [1, 1.3]) }],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const getFeedbackText = () => {
    switch (feedback) {
      case 'perfect':
        return 'PERFECT! ✨';
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
        title="Rhythm Feed"
        timer={timeLeft}
        isPaused={false}
        showPause={false}
      >
        <View style={styles.endContainer}>
          <LinearGradient
            colors={
              gameState === 'victory'
                ? [colors.semantic.happiness, '#FFE58F']
                : [colors.border.light, '#E0E0E0']
            }
            style={styles.endGradient}
          >
            <Text style={styles.endEmoji}>
              {gameState === 'victory' ? '🎵' : '🎶'}
            </Text>
            <Text style={styles.endTitle}>
              {gameState === 'victory' ? 'Rhythm Master!' : 'Keep the Beat!'}
            </Text>
            <Text style={styles.endScore}>Score: {score}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.endStat}>
                Perfect: {hits.perfect}
              </Text>
              <Text style={styles.endStat}>
                Good: {hits.good}
              </Text>
              <Text style={styles.endStat}>
                Miss: {hits.miss}
              </Text>
            </View>
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
      title="Rhythm Feed"
      timer={timeLeft}
      isPaused={isPaused}
      onPause={() => setIsPaused(true)}
      onResume={() => setIsPaused(false)}
    >
      <View style={styles.gameContainer}>
        {/* Score and Streak */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <Animated.View style={streakAnimatedStyle}>
            <View style={styles.streakBox}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streak}</Text>
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

        {/* Beat Indicator */}
        <View style={styles.beatIndicatorContainer}>
          <Text style={styles.beatLabel}>Beat</Text>
          <Animated.View style={[styles.beatIndicator, beatAnimatedStyle]} />
        </View>

        {/* Food and Target */}
        <View style={styles.gameArea}>
          <Animated.View style={targetAnimatedStyle}>
            <View style={styles.targetRing} />
          </Animated.View>

          <TouchableOpacity
            onPress={handleTap}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Tap on beat"
            accessibilityHint="Tap when the food bounces to the center"
            accessibilityState={{ disabled: isPaused }}
            style={styles.foodButton}
          >
            <Animated.View style={foodAnimatedStyle}>
              <Text style={styles.foodEmoji}>🍖</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap on the beat to feed!
          </Text>
          <Text style={styles.instructionSubtext}>
            Time your taps with the bounce
          </Text>
          {partnerPlaying && (
            <Text style={styles.partnerHint}>
              Partner is playing too! Co-op bonus available!
            </Text>
          )}
        </View>
      </View>
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
  streakBox: {
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
  beatIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  beatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  beatIndicator: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.semantic.happiness,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    position: 'relative',
  },
  targetRing: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: colors.primary.rose,
    position: 'absolute',
  },
  foodButton: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: 80,
  },
  instructions: {
    backgroundColor: colors.border.light,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginTop: 20,
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  endStat: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
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

export default RhythmFeedGame;
