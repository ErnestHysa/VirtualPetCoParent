/**
 * PetDisplay Component
 * Main pet view with animations, ambient glow, and mood indicators
 */

import React, { useRef, useEffect, memo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { useUIStore } from '@/stores';
import { Pet } from '@/types';
import { PetSprite } from './PetSprite';
import { StatPill } from '../ui/StatPill';
import { PRIMARY, NEUTRAL } from '@/constants/colors';

interface PetDisplayProps {
  pet: Pet;
  onPress?: () => void;
  onLongPress?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PetDisplay = memo<PetDisplayProps>(({
  pet,
  onPress,
  onLongPress,
}) => {
  const { colorScheme, reduceMotion } = useUIStore();
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  // Store animation references for cleanup
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Combined animations with proper cleanup
  useEffect(() => {
    // Skip animations if reduce motion is enabled
    if (reduceMotion) {
      return;
    }

    // Breathing animation
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.spring(breatheAnim, {
          toValue: 1.03,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }),
        Animated.spring(breatheAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }),
      ])
    );

    // Floating animation
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulsing glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.3,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    // Store references
    animationsRef.current = [breatheLoop, floatLoop, glowLoop];

    // Start all animations
    breatheLoop.start();
    floatLoop.start();
    glowLoop.start();

    // Cleanup function
    return () => {
      animationsRef.current.forEach((animation) => {
        animation.stop();
      });
      animationsRef.current = [];
    };
  }, [reduceMotion]);

  // Get mood glow color
  const getGlowColor = () => {
    const avgStats = (pet.stats.hunger + pet.stats.happiness + pet.stats.energy) / 3;
    if (avgStats >= 70) return PRIMARY.rose;
    if (avgStats >= 40) return PRIMARY.lavender;
    return '#9A948B';
  };

  const glowSize = SCREEN_HEIGHT * 0.5;
  const glowOpacity = 0.3;

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: getGlowColor(),
              opacity: glowOpacity,
              transform: [
                { scale: glowAnim },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowInner,
            {
              backgroundColor: getGlowColor(),
              opacity: glowOpacity * 0.5,
              transform: [
                { scale: glowAnim.interpolate({ inputRange: [1, 1.3], outputRange: [1, 0.7] }) },
              ],
            },
          ]}
        />
      </Animated.View>

      {/* Pet Sprite */}
      <Animated.View
        style={[
          styles.petContainer,
          {
            transform: [
              { scale: breatheAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        <PetSprite
          pet={pet}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      </Animated.View>

      {/* Stats Pills */}
      <View style={styles.statsContainer}>
        <StatPill type="hunger" value={pet.stats.hunger} />
        <StatPill type="happiness" value={pet.stats.happiness} />
        <StatPill type="energy" value={pet.stats.energy} />
      </View>

      {/* Personality Badge */}
      <View style={[
        styles.personalityBadge,
        { backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100] },
      ]}>
        <Text style={[
          styles.personalityText,
          { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] },
        ]}>
          {pet.dominantPersonality}
        </Text>
      </View>
    </View>
  );
});

PetDisplay.displayName = 'PetDisplay';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  glowInner: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    borderRadius: 9999,
  },
  petContainer: {
    zIndex: 10,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  personalityBadge: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  personalityText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
