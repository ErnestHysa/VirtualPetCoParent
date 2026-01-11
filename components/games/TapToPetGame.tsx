import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { GameModal } from './GameModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_DURATION = 30;

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export interface TapToPetGameProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (score: number, coOpBonus: boolean) => void;
  partnerPlaying?: boolean;
}

export const TapToPetGame: React.FC<TapToPetGameProps> = ({
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [showPerfect, setShowPerfect] = useState(false);

  const petScale = useSharedValue(1);
  const petRotation = useSharedValue(0);
  const meterProgress = useSharedValue(0);
  const perfectOpacity = useSharedValue(0);
  const perfectScale = useSharedValue(0);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const perfectTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup all animations on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(petScale);
      cancelAnimation(petRotation);
      cancelAnimation(meterProgress);
      cancelAnimation(perfectOpacity);
      cancelAnimation(perfectScale);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (perfectTimerRef.current) clearTimeout(perfectTimerRef.current);
    };
  }, []);

  // Meter animation
  useEffect(() => {
    meterProgress.value = withSpring(Math.min(score / 500, 1), {
      damping: 15,
      stiffness: 100,
    });
  }, [score]);

  const handleTap = () => {
    if (gameState !== 'playing' || isPaused) return;

    trigger('light');

    // Increase score with streak bonus
    const streakBonus = Math.min(streak * 2, 20);
    const points = 10 + streakBonus;
    setScore((prev) => prev + points);
    setStreak((prev) => prev + 1);

    // Pet animation
    petScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    petRotation.value = withSequence(
      withTiming(-0.1, { duration: 50 }),
      withTiming(0.1, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    // Show perfect indicator
    if (streak >= 4) {
      setShowPerfect(true);
      perfectOpacity.value = withTiming(1, { duration: 100 });
      perfectScale.value = withSpring(1.2, { damping: 8, stiffness: 200 });

      if (perfectTimerRef.current) clearTimeout(perfectTimerRef.current);
      perfectTimerRef.current = setTimeout(() => {
        perfectOpacity.value = withTiming(0, { duration: 200 });
        perfectScale.value = withTiming(0, { duration: 200 });
        setTimeout(() => setShowPerfect(false), 200);
      }, 600);
    }

    // Create particles
    createParticles();
  };

  const createParticles = () => {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2 - 50;
    const newParticles: Particle[] = [];

    const colorsList = [
      colors.primary.rose,
      colors.primary.lavender,
      colors.primary.sky,
      colors.semantic.happiness,
      '#FFD700',
      '#FF69B4',
    ];

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 3 + Math.random() * 2;
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colorsList[Math.floor(Math.random() * colorsList.length)],
        size: 6 + Math.random() * 6,
      });
    }

    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => setParticles([]), 1000);
  };

  const endGame = () => {
    setGameState(score >= 300 ? 'victory' : 'defeat');
    trigger(score >= 300 ? 'success' : 'error');

    setTimeout(() => {
      const coOpBonus = partnerPlaying && score >= 300;
      onComplete(score, coOpBonus);
    }, 2000);
  };

  const handleRestart = () => {
    trigger('medium');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    setGameState('playing');
    setParticles([]);
    meterProgress.value = 0;
  };

  const petAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: petScale.value },
      { rotate: `${petRotation.value}rad` },
    ],
  }));

  const meterAnimatedStyle = useAnimatedStyle(() => ({
    width: `${meterProgress.value * 100}%`,
  }));

  const perfectAnimatedStyle = useAnimatedStyle(() => ({
    opacity: perfectOpacity.value,
    transform: [{ scale: perfectScale.value }],
  }));

  // End screens
  if (gameState !== 'playing') {
    return (
      <GameModal
        visible={visible}
        onClose={onClose}
        title="Tap to Pet"
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
              {gameState === 'victory' ? '🎉' : '💪'}
            </Text>
            <Text style={styles.endTitle}>
              {gameState === 'victory' ? 'Wonderful!' : 'Good Try!'}
            </Text>
            <Text style={styles.endScore}>Score: {score}</Text>
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
      title="Tap to Pet"
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
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{streak}</Text>
          </View>
        </View>

        {/* Perfect Indicator */}
        {showPerfect && (
          <Animated.View style={[styles.perfectContainer, perfectAnimatedStyle]}>
            <Text style={styles.perfectText}>PERFECT! ✨</Text>
          </Animated.View>
        )}

        {/* Affection Meter */}
        <View style={styles.meterContainer}>
          <Text style={styles.meterLabel}>Affection Meter</Text>
          <View style={styles.meterTrack}>
            <Animated.View
              style={[
                styles.meterFill,
                meterAnimatedStyle,
                score >= 500 && styles.meterFull,
              ]}
            />
          </View>
          <Text style={styles.meterTarget}>Target: 500</Text>
        </View>

        {/* Pet Area */}
        <TouchableOpacity
          onPress={handleTap}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Tap to pet"
          accessibilityHint="Tap rapidly to fill the affection meter"
          style={styles.petContainer}
          accessibilityState={{ disabled: isPaused }}
        >
          <Animated.View style={petAnimatedStyle}>
            <Text style={styles.petEmoji}>🐱</Text>
            <Text style={styles.petLabel}>Tap Me!</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Particles */}
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
              },
            ]}
          />
        ))}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap rapidly to show affection!
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
  perfectContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  perfectText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.semantic.happiness,
    textShadowColor: 'rgba(255, 229, 143, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  meterContainer: {
    marginBottom: 30,
  },
  meterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  meterTrack: {
    height: 24,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: colors.primary.rose,
    borderRadius: borderRadius.full,
  },
  meterFull: {
    backgroundColor: colors.semantic.happiness,
  },
  meterTarget: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 6,
  },
  petContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  petEmoji: {
    fontSize: 120,
    textAlign: 'center',
  },
  petLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 12,
  },
  particle: {
    position: 'absolute',
    borderRadius: borderRadius.full,
  },
  instructions: {
    backgroundColor: colors.border.light,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginTop: 20,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  partnerHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.semantic.happiness,
    textAlign: 'center',
    marginTop: 6,
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

export default TapToPetGame;
