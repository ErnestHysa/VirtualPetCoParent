import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, spacing } from '../../constants/designTokens';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  padding?: keyof typeof spacing;
  borderRadius?: keyof typeof borderRadius;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 50,
  tint = 'light',
  padding = 'lg',
  borderRadius: borderRadiusProp = 'lg',
}) => {
  const paddingValue = spacing[padding];
  const radiusValue = borderRadius[borderRadiusProp];

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        styles.card,
        {
          padding: paddingValue,
          borderRadius: radiusValue,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
});
