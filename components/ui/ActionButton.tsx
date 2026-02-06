import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { colors, typography, borderRadius, spacing, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export interface ActionButtonProps {
  title: string;
  icon: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  onCooldown?: boolean;
  cooldownRemaining?: number;
  variant?: 'primary' | 'secondary' | 'care';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
  onCooldown = false,
  cooldownRemaining = 0,
  variant = 'primary',
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}) => {
  const { trigger } = useHapticFeedback();
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (disabled || loading || onCooldown) return;
    setIsPressed(true);
    scale.value = withSpring(0.95, motion.spring);
    trigger('light');
  };

  const handlePressOut = () => {
    if (disabled || loading || onCooldown) return;
    setIsPressed(false);
    scale.value = withSpring(1, motion.spring);
  };

  const handlePress = () => {
    if (disabled || loading || onCooldown) return;
    trigger('medium');
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: 56, iconSize: 24, fontSize: typography.scale[0] };
      case 'md':
        return { height: 72, iconSize: 28, fontSize: typography.scale[1] };
      case 'lg':
        return { height: 88, iconSize: 32, fontSize: typography.scale[2] };
      default:
        return { height: 72, iconSize: 28, fontSize: typography.scale[1] };
    }
  };

  const sizeStyles = getSizeStyles();

  const isDisabled = disabled || loading || onCooldown;

  const ButtonContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.text.inverse} />
      ) : onCooldown ? (
        <View style={styles.cooldownContainer}>
          <Text style={styles.cooldownText}>{Math.ceil(cooldownRemaining / 1000)}s</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>{icon}</Text>
          <Text style={[styles.title, { fontSize: sizeStyles.fontSize }]}>{title}</Text>
        </>
      )}
    </View>
  );

  if (variant === 'care') {
    return (
      <AnimatedTouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: isDisabled }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.careButton, { height: sizeStyles.height }, animatedStyle, style]}
      >
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={
              isDisabled
                ? ['rgba(200, 200, 200, 0.3)', 'rgba(200, 200, 200, 0.3)']
                : ['rgba(232, 180, 184, 0.6)', 'rgba(197, 185, 205, 0.6)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </BlurView>
        <ButtonContent />
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled }}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { height: sizeStyles.height },
        variant === 'secondary' && styles.buttonSecondary,
        animatedStyle,
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={
          isDisabled
            ? ['rgba(200, 200, 200, 0.5)', 'rgba(200, 200, 200, 0.5)']
            : variant === 'primary'
            ? [colors.primary.rose, colors.primary.lavender]
            : ['rgba(232, 180, 184, 0.3)', 'rgba(197, 185, 205, 0.3)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ButtonContent />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    minWidth: 100,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: colors.primary.rose,
  },
  careButton: {
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  cooldownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  cooldownText: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});
