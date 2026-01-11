/**
 * PetSprite Component
 * Renders the pet with species-specific visuals and animations
 */

import React, { useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Pet, PetSpecies, PetStage } from '@/types';
import { PET_SPECIES } from '@/constants/pet';

interface PetSpriteProps {
  pet: Pet;
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const PetSprite = memo<PetSpriteProps>(({
  pet,
  size = 200,
  onPress,
  onLongPress,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Blink animation with proper cleanup
  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(3000 + Math.random() * 2000),
      ])
    );
    blinkLoop.start();
    animationsRef.current.push(blinkLoop);

    return () => {
      blinkLoop.stop();
      animationsRef.current = animationsRef.current.filter(a => a !== blinkLoop);
    };
  }, []);

  const handlePress = () => {
    if (onPress) {
      // Bounce animation on press
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: -10,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
      ]).start();
      onPress();
    }
  };

  const renderPet = () => {
    const species = PET_SPECIES[pet.species];
    const emoji = species.emoji;

    if (pet.currentStage === 'egg') {
      return <EggSprite size={size} color={pet.color} />;
    }

    return (
      <Animated.View
        style={[
          styles.petWrapper,
          {
            width: size,
            height: size,
            transform: [
              { translateY: bounceAnim },
              { scaleY: blinkAnim },
            ],
          },
        ]}
      >
        <Text
          style={[
            styles.emoji,
            {
              fontSize: size * 0.8,
              textShadowColor: pet.color,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            },
          ]}
        >
          {emoji}
        </Text>
        {/* Stage indicator overlay */}
        {pet.currentStage !== 'baby' && (
          <View style={[styles.stageGlow, { backgroundColor: pet.color + '40' }]} />
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      {renderPet()}
    </TouchableOpacity>
  );
});

PetSprite.displayName = 'PetSprite';

/**
 * Egg Sprite Component
 */
const EggSprite = memo<{ size: number; color: string }>(({ size, color }) => {
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wobbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    wobbleLoop.start();

    return () => wobbleLoop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.eggContainer,
        {
          width: size * 0.6,
          height: size * 0.8,
        },
        {
          transform: [
            {
              rotate: wobbleAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-5deg', '5deg'],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.egg,
          {
            backgroundColor: color + '80',
            borderColor: color,
          },
        ]}
      >
        <View style={styles.eggHighlight} />
        <View style={styles.eggShadow} />
      </View>
    </Animated.View>
  );
});

EggSprite.displayName = 'EggSprite';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
    lineHeight: 0,
  },
  stageGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  eggContainer: {
    position: 'relative',
  },
  egg: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 2,
    overflow: 'hidden',
  },
  eggHighlight: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '30%',
    height: '20%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  eggShadow: {
    position: 'absolute',
    bottom: '15%',
    right: '20%',
    width: '25%',
    height: '15%',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
