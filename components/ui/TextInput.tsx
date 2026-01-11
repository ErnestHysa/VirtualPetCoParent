import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  showClearButton?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showClearButton = false,
  containerStyle,
  inputStyle,
  value,
  onChangeText,
  onFocus,
  onBlur,
  testID,
  ...rest
}) => {
  const { trigger } = useHapticFeedback();
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const borderScale = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    labelPosition.value = withSpring(1, motion.spring);
    borderScale.value = withSpring(1, motion.spring);
    trigger('light');
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      labelPosition.value = withSpring(0, motion.spring);
    }
    borderScale.value = withSpring(0, motion.spring);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    if (text && !isFocused) {
      labelPosition.value = withSpring(1, motion.spring);
    } else if (!text && !isFocused) {
      labelPosition.value = withSpring(0, motion.spring);
    }
  };

  const handleClear = () => {
    onChangeText?.('');
    trigger('medium');
  };

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withSpring(labelPosition.value * -24, motion.spring),
      },
    ],
  }));

  const animatedLabelColor = useAnimatedStyle(() => {
    const color = withTiming(
      error
        ? '#FF6B6B'
        : isFocused || labelPosition.value === 1
        ? colors.primary.rose
        : colors.text.tertiary,
      { duration: 200 }
    );
    return { color };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = withTiming(
      error ? '#FF6B6B' : isFocused ? colors.primary.rose : colors.border.medium,
      { duration: 200 }
    );
    return {
      borderColor,
      borderWidth: withTiming(isFocused || error ? 2 : 1, { duration: 200 }),
    };
  });

  const containerStyleBase: ViewStyle = {
    marginBottom: 16,
    ...containerStyle,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  };

  const iconContainerStyle: ViewStyle = {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: typography.scale[2],
    color: colors.text.primary,
    paddingVertical: 16,
    paddingHorizontal: leftIcon ? 12 : 16,
    minHeight: 56,
    ...inputStyle,
  };

  return (
    <View style={containerStyleBase} testID={testID}>
      {label && (
        <Animated.Text
          style={[
            styles.label,
            animatedLabelStyle,
            animatedLabelColor,
            leftIcon ? { left: 48 } : { left: 16 },
          ]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>
      )}

      <Animated.View style={[inputContainerStyle, animatedBorderStyle]}>
        {leftIcon && <View style={iconContainerStyle}>{leftIcon}</View>}

        <AnimatedTextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[textInputStyle, !label && { paddingLeft: leftIcon ? 12 : 16 }]}
          placeholderTextColor={colors.text.tertiary}
          underlineColorAndroid="transparent"
          selectionColor={colors.primary.rose}
          {...rest}
        />

        {(rightIcon || (showClearButton && value)) && (
          <TouchableOpacity
            onPress={rightIcon ? onRightIconPress : handleClear}
            style={[iconContainerStyle, { paddingRight: 16 }]}
            disabled={!rightIcon && !showClearButton}
            accessibilityRole="button"
            accessibilityLabel={rightIcon ? 'Right icon action' : 'Clear text'}
          >
            {rightIcon || (showClearButton && value && (
              <Text style={{ fontSize: 20, color: colors.text.tertiary }}>✕</Text>
            ))}
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    top: 16,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    zIndex: 1,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: typography.scale[0],
    color: '#FF6B6B',
  },
});

export default TextInput;
