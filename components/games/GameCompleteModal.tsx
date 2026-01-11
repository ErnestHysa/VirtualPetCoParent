import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GameCompleteModalProps {
  visible: boolean;
  score: number;
  targetScore: number;
  stars: number;
  coOpBonus: boolean;
  onPlayAgain: () => void;
  onDone: () => void;
  gameTitle: string;
}

export const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
  visible,
  score,
  targetScore,
  stars,
  coOpBonus,
  onPlayAgain,
  onDone,
  gameTitle,
}) => {
  const { trigger } = useHapticFeedback();
  const [showStars, setShowStars] = useState(false);

  const containerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);
  const buttonTranslateY = useSharedValue(100);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      containerOpacity.value = withTiming(1, { duration: 300 });
      containerScale.value = withSpring(1, motion.spring);

      // Animate score
      scoreScale.value = withDelay(200, withSpring(1, motion.spring));

      // Animate stars with stagger
      setTimeout(() => {
        setShowStars(true);
        star1Scale.value = withSpring(1, { damping: 8, stiffness: 200 });
        star2Scale.value = withDelay(150, withSpring(1, { damping: 8, stiffness: 200 }));
        star3Scale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 200 }));
      }, 500);

      // Animate buttons
      buttonTranslateY.value = withDelay(600, withSpring(0, motion.spring));

      // Show confetti for 3 stars
      if (stars === 3) {
        confettiOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
        trigger('success');
      }
    } else {
      // Reset
      containerOpacity.value = withTiming(0, { duration: 200 });
      containerScale.value = withTiming(0, { duration: 200 });
      scoreScale.value = 0;
      setShowStars(false);
      star1Scale.value = 0;
      star2Scale.value = 0;
      star3Scale.value = 0;
      buttonTranslateY.value = 100;
      confettiOpacity.value = 0;
    }
  }, [visible]);

  const handlePlayAgain = () => {
    trigger('medium');
    onPlayAgain();
  };

  const handleDone = () => {
    trigger('light');
    onDone();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const star1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: star1Scale.value }],
  }));

  const star2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: star2Scale.value }],
  }));

  const star3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: star3Scale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const getStarsArray = () => {
    return [1, 2, 3].map((_, index) => index < stars);
  };

  const getStarAnimatedStyle = (index: number) => {
    switch (index) {
      case 0:
        return star1AnimatedStyle();
      case 1:
        return star2AnimatedStyle();
      case 2:
        return star3AnimatedStyle();
      default:
        return {};
    }
  };

  const getStarColor = (index: number) => {
    if (index < stars) {
      return colors.semantic.happiness;
    }
    return colors.border.light;
  };

  const getPerformanceMessage = () => {
    const percentage = (score / targetScore) * 100;
    if (percentage >= 120) return 'PHENOMENAL!';
    if (percentage >= 100) return 'EXCELLENT!';
    if (percentage >= 80) return 'GREAT JOB!';
    if (percentage >= 60) return 'GOOD EFFORT!';
    return 'KEEP PRACTICING!';
  };

  const getPerformanceEmoji = () => {
    if (stars === 3) return '🏆';
    if (stars === 2) return '🌟';
    if (stars === 1) return '👍';
    return '💪';
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={['rgba(250, 248, 245, 0.98)', 'rgba(250, 248, 245, 0.95)']}
        style={styles.content}
      >
        {/* Confetti for 3 stars */}
        {stars === 3 && (
          <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
            <View style={styles.confetti}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.confettiPiece,
                    {
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: [
                        colors.primary.rose,
                        colors.primary.lavender,
                        colors.primary.sky,
                        colors.semantic.happiness,
                        colors.semantic.energy,
                      ][Math.floor(Math.random() * 5)],
                      transform: [
                        { rotate: `${Math.random() * 360}deg` },
                        { scale: 0.5 + Math.random() * 0.5 },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Title */}
        <Text style={styles.gameTitle}>{gameTitle}</Text>

        {/* Performance */}
        <Animated.View style={scoreAnimatedStyle}>
          <Text style={styles.performanceEmoji}>{getPerformanceEmoji()}</Text>
          <Text style={styles.performanceText}>{getPerformanceMessage()}</Text>
        </Animated.View>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {getStarsArray().map((earned, index) => (
            <Animated.View
              key={index}
              style={[styles.starWrapper, getStarAnimatedStyle(index)]}
            >
              <Text
                style={[
                  styles.star,
                  { color: getStarColor(index) },
                  earned && styles.starEarned,
                ]}
              >
                ⭐
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Score */}
        <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreTarget}>Target: {targetScore}</Text>
          {score >= targetScore && (
            <Text style={styles.scoreSuccess}>Target Reached! ✓</Text>
          )}
        </Animated.View>

        {/* Co-op Bonus */}
        {coOpBonus && (
          <View style={styles.coOpBonusContainer}>
            <Text style={styles.coOpBonusText}>🎉 Co-op Bonus Active!</Text>
            <Text style={styles.coOpBonusSubtext}>
              +50% Bonus for playing together
            </Text>
          </View>
        )}

        {/* Buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Play again"
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    zIndex: 1000,
  },
  content: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  confetti: {
    flex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  performanceEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 8,
  },
  performanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  starWrapper: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    fontSize: 48,
    opacity: 0.3,
  },
  starEarned: {
    opacity: 1,
    textShadowColor: colors.semantic.happiness,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreContainer: {
    width: '100%',
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  scoreTarget: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  scoreSuccess: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.semantic.energy,
  },
  coOpBonusContainer: {
    width: '100%',
    backgroundColor: `${colors.semantic.happiness}20`,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.semantic.happiness,
  },
  coOpBonusText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  coOpBonusSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: colors.primary.rose,
    borderRadius: borderRadius.full,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: colors.primary.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  doneButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.text.secondary,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default GameCompleteModal;
