/**
 * ProgressBar Component
 * Smooth animated progress indicator
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Text } from 'react-native';
import { useUIStore } from '@/stores';
import { SEMANTIC, NEUTRAL } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar = memo<ProgressBarProps>(({
  progress,
  color,
  height = 8,
  showLabel = false,
  label,
  animated = true,
  style,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { colorScheme } = useUIStore();

  // Get color based on progress value
  const getColor = () => {
    if (color) return color;
    if (progress >= 70) return SEMANTIC.energy;
    if (progress >= 40) return SEMANTIC.happiness;
    return SEMANTIC.hunger;
  };

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: progress,
        useNativeDriver: false,
        damping: 20,
        stiffness: 150,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] }]}>
            {label || 'Progress'}
          </Text>
          <Text style={[styles.label, { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[200],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth,
              height,
              backgroundColor: getColor(),
            },
          ]}
        />
      </View>
    </View>
  );
});

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
});
