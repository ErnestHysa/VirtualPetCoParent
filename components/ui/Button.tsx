/**
 * Button Component
 * Apple-caliber button with smooth animations and haptic feedback
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useUIStore } from '@/stores';
import { hapticFeedback } from '@/lib/utils';
import { PRIMARY, BACKGROUND } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colorScheme, hapticFeedback: hapticEnabled } = useUIStore();

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      ...{ damping: 15, stiffness: 150 },
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...{ damping: 15, stiffness: 150 },
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticEnabled) {
      hapticFeedback('light');
    }
    onPress();
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    // Size
    switch (size) {
      case 'sm':
        baseStyle.height = 36;
        baseStyle.paddingHorizontal = 16;
        break;
      case 'lg':
        baseStyle.height = 52;
        baseStyle.paddingHorizontal = 28;
        break;
      default:
        baseStyle.height = 44;
        baseStyle.paddingHorizontal = 20;
    }

    // Variant
    if (disabled || loading) {
      baseStyle.backgroundColor = colorScheme === 'dark' ? '#2A2A3E' : '#E8E5E1';
      baseStyle.opacity = 0.6;
    } else {
      switch (variant) {
        case 'primary':
          baseStyle.backgroundColor = PRIMARY.rose;
          break;
        case 'secondary':
          baseStyle.backgroundColor = PRIMARY.lavender;
          break;
        case 'ghost':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 1.5;
          baseStyle.borderColor = colorScheme === 'dark' ? '#4D4A45' : '#E8E5E1';
          break;
        case 'danger':
          baseStyle.backgroundColor = '#FF9AA2';
          break;
      }
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const base: TextStyle = { ...styles.text };

    switch (size) {
      case 'sm':
        base.fontSize = 13;
        break;
      case 'lg':
        base.fontSize = 17;
        break;
      default:
        base.fontSize = 15;
    }

    if (variant === 'ghost') {
      base.color = colorScheme === 'dark' ? '#F5F3F0' : '#4D4A45';
    } else {
      base.color = '#FFFFFF';
    }

    return base;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        style={[getButtonStyles(), style]}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
            size={size === 'sm' ? 'small' : 'small'}
          />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text style={[getTextStyles(), textStyle, icon && { marginLeft: 8 }]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
