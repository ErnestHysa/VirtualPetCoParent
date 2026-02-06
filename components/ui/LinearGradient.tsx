import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';

type Point = { x: number; y: number };

interface LinearGradientProps {
  children?: React.ReactNode;
  colors: string[];
  start?: Point;
  end?: Point;
  style?: StyleProp<ViewStyle>;
}

/**
 * Lightweight gradient fallback component.
 * Uses the first color as a solid background when native gradient module
 * is unavailable in this environment.
 */
export function LinearGradient({ children, colors, style }: LinearGradientProps) {
  return <View style={[{ backgroundColor: colors[0] ?? 'transparent' }, style]}>{children}</View>;
}
