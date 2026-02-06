/**
 * EvolutionCelebration Component
 * Full-screen celebration when a pet evolves to a new stage
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  Share,
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
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, motion } from '../../constants/designTokens';
import { PetStage, STAGE_DISPLAY_NAMES, STAGE_EMOJIS } from '../../services/evolutionService';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import Button from '../ui/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EvolutionCelebrationProps {
  petName: string;
  previousStage: PetStage;
  newStage: PetStage;
  petImage?: string;
  onAnimationComplete?: () => void;
  visible: boolean;
}

interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
}

const CONFETTI_COLORS = [
  colors.primary.rose,
  colors.primary.lavender,
  colors.primary.sky,
  '#FFD700',
  '#FF69B4',
  '#00CED1',
  '#FF6347',
  '#7B68EE',
];

const EvolutionCelebration: React.FC<EvolutionCelebrationProps> = ({
  petName,
  previousStage,
  newStage,
  petImage,
  onAnimationComplete,
  visible,
}) => {
  const { trigger } = useHapticFeedback();
  const overlayOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0);
  const rotationValue = useSharedValue(0);
  const petOpacity = useSharedValue(0);
  const petScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const confettiParticles = useSharedValue<ConfettiParticle[]>([]);
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  const hasAnimated = useRef(false);

  // Generate confetti particles
  const generateConfetti = () => {
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        id: `confetti-${i}`,
        x: Math.random() * SCREEN_WIDTH,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 8 + Math.random() * 12,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: 2 + Math.random() * 4,
      });
    }
    confettiParticles.value = particles;
  };

  const handleShare = async () => {
    try {
      const message = `🎉 ${petName} evolved from ${STAGE_DISPLAY_NAMES[previousStage]} to ${STAGE_DISPLAY_NAMES[newStage]}! in Virtual Pet Co-Parent`;
      const url = Platform.select({
        ios: 'https://apps.apple.com/app/virtual-pet-coparent',
        android: 'https://play.google.com/store/apps/details?id=com.virtualpet.coparent',
      });

      await Share.share({
        message: url ? `${message} ${url}` : message,
        url,
      });
      trigger('medium');
    } catch (error) {
      console.warn('Error sharing:', error);
    }
  };

  const handleComplete = () => {
    trigger('heavy');
    onAnimationComplete?.();
  };

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      // Trigger haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Start animations
      overlayOpacity.value = withTiming(1, { duration: 300 });

      // Confetti explosion
      generateConfetti();

      // Pet appearance animation
      scaleValue.value = withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.cubic) })
      );

      rotationValue.value = withSequence(
        withTiming(-10, { duration: 300 }),
        withTiming(10, { duration: 300 }),
        withTiming(-5, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );

      // Pet reveal
      petOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
      petScale.value = withDelay(400, withSpring(1, motion.spring));

      // Text reveal
      textOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
      textTranslateY.value = withDelay(800, withSpring(0, motion.spring));

      // Sparkle effect
      sparkleOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
      sparkleScale.value = withDelay(600, withSpring(1, motion.spring));

      // Button reveal
      buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    }
  }, [visible]);

  // Reset animation state when not visible
  useEffect(() => {
    if (!visible) {
      hasAnimated.current = false;
      overlayOpacity.value = 0;
      scaleValue.value = 0;
      rotationValue.value = 0;
      petOpacity.value = 0;
      petScale.value = 0.5;
      textOpacity.value = 0;
      textTranslateY.value = 50;
      buttonOpacity.value = 0;
      sparkleOpacity.value = 0;
      sparkleScale.value = 0;
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { rotate: `${rotationValue.value}deg` },
    ],
  }));

  const petAnimatedStyle = useAnimatedStyle(() => ({
    opacity: petOpacity.value,
    transform: [{ scale: petScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]}>
      <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.primary.rose + '40', colors.primary.lavender + '40', colors.primary.sky + '40']}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>

      {/* Confetti particles */}
      <ConfettiAnimation particles={confettiParticles} />

      <SafeAreaView style={styles.container}>
        {/* Sparkle effects */}
        <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const distance = 120;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            return (
              <View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: SCREEN_WIDTH / 2 + x - 10,
                    top: SCREEN_HEIGHT * 0.35 + y - 10,
                  },
                ]}
              >
                <Sparkle />
              </View>
            );
          })}
        </Animated.View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Pet display */}
          <Animated.View style={[styles.petContainer, glowAnimatedStyle]}>
            <View style={styles.glowRing}>
              <LinearGradient
                colors={[colors.primary.rose, colors.primary.lavender, colors.primary.sky]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowGradient}
              />
            </View>

            <Animated.View style={[styles.petWrapper, petAnimatedStyle]}>
              {petImage ? (
                <Animated.Image
                  source={{ uri: petImage }}
                  style={styles.petImage}
                />
              ) : (
                <View style={styles.petPlaceholder}>
                  <Text style={styles.petEmoji}>{STAGE_EMOJIS[newStage]}</Text>
                </View>
              )}
            </Animated.View>

            {/* Stage badge */}
            <View style={styles.stageBadge}>
              <LinearGradient
                colors={[colors.primary.rose, colors.primary.lavender]}
                style={styles.badgeGradient}
              >
                <Text style={styles.stageText}>{STAGE_DISPLAY_NAMES[newStage]}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Evolution message */}
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <Text style={styles.evolutionText}>EVOLVED!</Text>
            <Text style={styles.nameText}>{petName}</Text>
            <Text style={styles.stageChangeText}>
              {STAGE_DISPLAY_NAMES[previousStage]} → {STAGE_DISPLAY_NAMES[newStage]}
            </Text>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <Button
              title="Share"
              variant="secondary"
              size="lg"
              onPress={handleShare}
              style={styles.shareButton}
            />
            <Button
              title="Continue"
              variant="primary"
              size="lg"
              onPress={handleComplete}
              fullWidth
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

// Confetti Animation Component
const ConfettiAnimation: React.FC<{ particles: Animated.SharedValue<ConfettiParticle[]> }> = ({ particles }) => {
  const animatedParticles = useSharedValue<ConfettiParticle[]>([]);

  useEffect(() => {
    animatedParticles.value = particles.value;
  }, [particles.value]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {animatedParticles.value.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}
    </View>
  );
};

const ConfettiParticle: React.FC<{ particle: ConfettiParticle }> = ({ particle }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 3000 + Math.random() * 2000,
      easing: Easing.linear,
    });

    translateX.value = withTiming(
      particle.velocityX * 100,
      {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad),
      }
    );

    rotate.value = withTiming(
      particle.rotation + 720,
      {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.linear,
      }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
};

// Sparkle Component
const Sparkle: React.FC = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const pulseAnimation = () => {
      scale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }),
        withSpring(0.5, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      rotation.value = withTiming(360, { duration: 2000, easing: Easing.linear });
      opacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
    };

    pulseAnimation();
    const interval = setInterval(pulseAnimation, 2000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.sparkleShape, animatedStyle]}>
      <Text style={styles.sparkleText}>✨</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  petContainer: {
    position: 'relative',
    marginBottom: spacing.xxl,
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
    left: -20,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
    opacity: 0.3,
  },
  petWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  petPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.rose,
  },
  petEmoji: {
    fontSize: 80,
  },
  stageBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stageText: {
    color: colors.text.inverse,
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.bold,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  evolutionText: {
    fontSize: typography.scale[4],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.rose,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  nameText: {
    fontSize: typography.scale[5],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stageChangeText: {
    fontSize: typography.scale[2],
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  shareButton: {
    marginBottom: spacing.sm,
  },
  confettiParticle: {
    position: 'absolute',
    borderRadius: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleShape: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleText: {
    fontSize: 16,
  },
});

export default EvolutionCelebration;
