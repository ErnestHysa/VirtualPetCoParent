/**
 * usePetAnimation Hook
 * Handles pet animation states and transitions
 */

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native-reanimated';

export type PetAnimation =
  | 'idle'
  | 'breathe'
  | 'bounce'
  | 'wiggle'
  | 'blink'
  | 'sleep'
  | 'happy'
  | 'sad'
  | 'eat'
  | 'play';

interface UsePetAnimationOptions {
  duration?: number;
  reduceMotion?: boolean;
}

export function usePetAnimation(
  currentAnimation: PetAnimation = 'idle',
  options: UsePetAnimationOptions = {}
) {
  const { duration = 300, reduceMotion = false } = options;

  // Animation values
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Run animation based on type
  useEffect(() => {
    if (reduceMotion) return;

    switch (currentAnimation) {
      case 'idle':
      case 'breathe':
        Animated.loop(
          Animated.sequence([
            Animated.spring(scale, {
              toValue: 1.03,
              useNativeDriver: true,
              ...{ damping: 20, stiffness: 100 },
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              ...{ damping: 20, stiffness: 100 },
            }),
          ])
        ).start();
        break;

      case 'bounce':
        Animated.sequence([
          Animated.spring(translateY, {
            toValue: -20,
            useNativeDriver: true,
            ...{ damping: 15, stiffness: 200 },
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            ...{ damping: 15, stiffness: 200 },
          }),
        ]).start();
        break;

      case 'wiggle':
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, {
              toValue: 5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'blink':
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'happy':
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -15,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'sad':
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 10,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      default:
        break;
    }
  }, [currentAnimation, reduceMotion]);

  // Reset all animations
  const reset = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return {
    scale,
    rotate,
    translateY,
    translateX,
    opacity,
    reset,
  };
}
