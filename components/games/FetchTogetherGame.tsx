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
const TURN_DURATION = 3000; // 3 seconds per turn

export interface FetchTogetherGameProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (score: number, coOpBonus: boolean) => void;
  partnerPlaying?: boolean;
  isPlayerTurn?: boolean;
}

export const FetchTogetherGame: React.FC<FetchTogetherGameProps> = ({
  visible,
  onClose,
  onComplete,
  partnerPlaying = false,
  isPlayerTurn = true,
}) => {
  const { trigger } = useHapticFeedback();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [syncBonus, setSyncBonus] = useState(0);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_DURATION);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [lastTapTime, setLastTapTime] = useState(0);

  const ballScale = useSharedValue(1);
  const ballRotation = useSharedValue(0);
  const ballPositionX = useSharedValue(0);
  const ballPositionY = useSharedValue(0);
  const turnIndicatorOpacity = useSharedValue(0);
  const syncBonusScale = useSharedValue(0);
  const streakScale = useSharedValue(1);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ballAnimationRef = useRef<NodeJS.Timeout | null>(null);

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

  // Turn timer
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    turnTimerRef.current = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 100) {
          switchTurn();
          return TURN_DURATION;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [visible, isPaused, gameState, playerTurn]);

  // Ball floating animation
  useEffect(() => {
    if (!visible || isPaused || gameState !== 'playing') return;

    ballPositionX.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(20, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    ballPositionY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 800, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );
  }, [visible, isPaused, gameState]);

  // Show turn indicator
  useEffect(() => {
    turnIndicatorOpacity.value = withTiming(1, { duration: 300 });
    const timeout = setTimeout(() => {
      turnIndicatorOpacity.value = withTiming(0, { duration: 500 });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [playerTurn]);

  const switchTurn = () => {
    setPlayerTurn((prev) => !prev);
    trigger('light');
  };

  const handleTap = () => {
    if (gameState !== 'playing' || isPaused || !playerTurn) return;

    const now = Date.now();
    const timeSinceLastTap = lastTapTime ? now - lastTapTime : 0;

    trigger('light');

    // Calculate score
    const basePoints = 20;
    let bonusPoints = 0;

    // Streak bonus
    if (streak >= 3) {
      bonusPoints += Math.min(streak * 5, 25);
    }

    // Sync bonus for quick taps
    if (timeSinceLastTap > 0 && timeSinceLastTap < 500) {
      const syncPoints = Math.floor((500 - timeSinceLastTap) / 50);
      bonusPoints += syncPoints;
      setSyncBonus(syncPoints);
      showSyncBonus();
    }

    const points = basePoints + bonusPoints;
    setScore((prev) => prev + points);
    setStreak((prev) => prev + 1);
    setLastTapTime(now);

    // Ball animation
    ballScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    ballRotation.value = withSequence(
      withTiming(-0.3, { duration: 100 }),
      withTiming(0.3, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Streak animation
    streakScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, motion.spring)
    );

    // Reset turn timer on successful tap
    setTurnTimeLeft(TURN_DURATION);
  };

  const showSyncBonus = () => {
    syncBonusScale.value = withSpring(1.2, { damping: 8, stiffness: 200 });
    setTimeout(() => {
      syncBonusScale.value = withTiming(0, { duration: 300 });
    }, 800);
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
    setStreak(0);
    setSyncBonus(0);
    setPlayerTurn(true);
    setTurnTimeLeft(TURN_DURATION);
    setGameState('playing');
    setLastTapTime(0);
    ballScale.value = 1;
    streakScale.value = 1;
    syncBonusScale.value = 0;
  };

  const ballAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: ballScale.value },
      { rotate: `${ballRotation.value}rad` },
      { translateX: ballPositionX.value },
      { translateY: ballPositionY.value },
    ],
  }));

  const turnIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: turnIndicatorOpacity.value,
    transform: [
      {
        scale: interpolate(turnIndicatorOpacity.value, [0, 1], [0.8, 1]),
      },
    ],
  }));

  const syncBonusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: syncBonusScale.value,
    transform: [{ scale: syncBonusScale.value }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const getTurnText = () => {
    return playerTurn ? 'YOUR TURN!' : "PARTNER'S TURN!";
  };

  const getTurnColor = () => {
    return playerTurn ? colors.semantic.energy : colors.primary.lavender;
  };

  // End screens
  if (gameState !== 'playing') {
    return (
      <GameModal
        visible={visible}
        onClose={onClose}
        title="Fetch Together"
        timer={timeLeft}
        isPaused={false}
        showPause={false}
      >
        <View style={styles.endContainer}>
          <LinearGradient
            colors={
              gameState === 'victory'
                ? [colors.primary.sky, '#A7C7E7']
                : [colors.border.light, '#E0E0E0']
            }
            style={styles.endGradient}
          >
            <Text style={styles.endEmoji}>
              {gameState === 'victory' ? '🎾' : '🤝'}
            </Text>
            <Text style={styles.endTitle}>
              {gameState === 'victory' ? 'Team Victory!' : 'Great Teamwork!'}
            </Text>
            <Text style={styles.endScore}>Score: {score}</Text>
            <Text style={styles.endStat}>Best Streak: {streak}</Text>
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
      title="Fetch Together"
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

        {/* Sync Bonus */}
        {syncBonus > 0 && (
          <Animated.View style={[styles.syncBonusContainer, syncBonusAnimatedStyle]}>
            <Text style={styles.syncBonusText}>
              Sync Bonus! +{syncBonus}
            </Text>
          </Animated.View>
        )}

        {/* Turn Indicator */}
        <Animated.View style={[styles.turnIndicator, turnIndicatorAnimatedStyle]}>
          <Text style={[styles.turnText, { color: getTurnColor() }]}>
            {getTurnText()}
          </Text>
        </Animated.View>

        {/* Turn Timer */}
        <View style={styles.turnTimerContainer}>
          <Text style={styles.turnTimerLabel}>Turn Time</Text>
          <View style={styles.turnTimerBar}>
            <View
              style={[
                styles.turnTimerFill,
                {
                  width: `${(turnTimeLeft / TURN_DURATION) * 100}%`,
                  backgroundColor: getTurnColor(),
                },
              ]}
            />
          </View>
        </View>

        {/* Ball Area */}
        <View style={styles.ballArea}>
          <TouchableOpacity
            onPress={handleTap}
            activeOpacity={0.8}
            disabled={!playerTurn}
            accessibilityRole="button"
            accessibilityLabel={playerTurn ? "Tap to throw ball" : "Wait for partner's turn"}
            accessibilityState={{ disabled: !playerTurn }}
            style={styles.ballButton}
          >
            <Animated.View style={ballAnimatedStyle}>
              <View style={[styles.ball, !playerTurn && styles.ballDisabled]}>
                <Text style={styles.ballEmoji}>🎾</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Player avatars */}
          <View style={styles.avatarsContainer}>
            <View style={[styles.avatar, playerTurn && styles.avatarActive]}>
              <Text style={styles.avatarEmoji}>😊</Text>
              <Text style={styles.avatarLabel}>You</Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.avatar, !playerTurn && styles.avatarActive]}>
              <Text style={styles.avatarEmoji}>💑</Text>
              <Text style={styles.avatarLabel}>Partner</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {playerTurn ? 'Tap to throw!' : "Partner's turn..."}
          </Text>
          <Text style={styles.instructionSubtext}>
            Take turns and tap quickly for sync bonuses!
          </Text>
          {partnerPlaying && (
            <Text style={styles.partnerHint}>
              Playing together! Co-op bonus available!
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
    backgroundColor: colors.primary.sky,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: colors.primary.sky,
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
  syncBonusContainer: {
    alignSelf: 'center',
    backgroundColor: colors.semantic.happiness,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginBottom: 12,
  },
  syncBonusText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  turnIndicator: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  turnText: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  turnTimerContainer: {
    marginBottom: 20,
  },
  turnTimerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  turnTimerBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  turnTimerFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  ballArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  ballButton: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ball: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.semantic.energy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary.sky,
    shadowColor: colors.primary.sky,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ballDisabled: {
    opacity: 0.5,
    backgroundColor: colors.border.light,
    borderColor: colors.border.medium,
  },
  ballEmoji: {
    fontSize: 60,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    width: '100%',
  },
  avatar: {
    alignItems: 'center',
    opacity: 0.4,
    padding: 12,
    borderRadius: borderRadius.lg,
  },
  avatarActive: {
    opacity: 1,
    backgroundColor: `${colors.semantic.energy}30`,
  },
  avatarEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  vsContainer: {
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.tertiary,
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
    marginBottom: 4,
  },
  endStat: {
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

export default FetchTogetherGame;
