import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, borderRadius, motion } from '../constants/designTokens';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: ViewStyle;
  testID?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  style,
  testID,
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming((currentStep + 1) / totalSteps, {
      duration: motion.duration.slow,
    });
  }, [currentStep, totalSteps]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle]} />
      </View>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index <= currentStep && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  track: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary.rose,
    borderRadius: borderRadius.full,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
  },
  dotActive: {
    backgroundColor: colors.primary.rose,
  },
});
