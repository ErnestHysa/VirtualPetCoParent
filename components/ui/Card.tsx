/**
 * Card Component
 * Elegant container with glassmorphism and subtle shadows
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useUIStore } from '@/stores';
import { BACKGROUND, NEUTRAL } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: number;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
  padding = 16,
  accessible,
  accessibilityLabel,
}) => {
  const { colorScheme } = useUIStore();

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.card,
      padding,
    };

    switch (variant) {
      case 'glass':
        base.backgroundColor = 'transparent';
        break;
      case 'elevated':
        base.shadowOpacity = 0.12;
        base.shadowRadius = 16;
        base.shadowOffset = { width: 0, height: 4 };
        base.elevation = 8;
        break;
      case 'bordered':
        base.borderWidth = 1;
        base.borderColor = colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[200];
        break;
      default:
        base.shadowOpacity = 0.08;
        base.shadowRadius = 8;
        base.shadowOffset = { width: 0, height: 2 };
        base.elevation = 4;
    }

    return base;
  };

  const getBackgroundColor = () => {
    if (variant === 'glass') {
      return colorScheme === 'dark'
        ? 'rgba(22, 22, 42, 0.7)'
        : 'rgba(250, 248, 245, 0.7)';
    }
    return colorScheme === 'dark' ? BACKGROUND.darkSecondary : BACKGROUND.light;
  };

  const content = (
    <>
      {variant === 'glass' ? (
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.absolute}
        >
          <View style={[getCardStyle(), { backgroundColor: getBackgroundColor() }, style]}>
            {children}
          </View>
        </BlurView>
      ) : (
        <View style={[getCardStyle(), { backgroundColor: getBackgroundColor() }, style]}>
          {children}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    overflow: 'hidden',
  },
});
