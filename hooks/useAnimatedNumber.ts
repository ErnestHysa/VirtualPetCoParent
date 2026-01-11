import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedValue,
  useDerivedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

/**
 * Hook for animating number values smoothly
 */
export const useAnimatedNumber = (
  value: number,
  options?: {
    duration?: number;
    spring?: boolean;
  }
) => {
  const animatedValue = useAnimatedValue(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      animatedValue.value = options?.spring
        ? withSpring(value, { damping: 15, stiffness: 150 })
        : withTiming(value, { duration: options?.duration || 300 });
      prevValue.current = value;
    }
  }, [value, animatedValue, options]);

  const animatedString = useDerivedValue(() => {
    return Math.round(animatedValue.value).toString();
  });

  return {
    animatedValue,
    animatedString,
  };
};
