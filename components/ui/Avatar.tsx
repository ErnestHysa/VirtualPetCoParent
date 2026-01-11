import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, borderRadius, motion } from '../../constants/designTokens';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
  isOnline?: boolean;
  showStatus?: boolean;
  borderColor?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  accessibilityLabel?: string;
  testID?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  variant = 'circle',
  isOnline = false,
  showStatus = true,
  borderColor,
  style,
  imageStyle,
  accessibilityLabel,
  testID,
}) => {
  const scale = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, motion.spring);
  }, []);

  const getSizeValue = () => {
    switch (size) {
      case 'xs':
        return { container: 32, fontSize: 12, statusSize: 8 };
      case 'sm':
        return { container: 40, fontSize: 14, statusSize: 10 };
      case 'md':
        return { container: 56, fontSize: 20, statusSize: 12 };
      case 'lg':
        return { container: 72, fontSize: 26, statusSize: 14 };
      case 'xl':
        return { container: 96, fontSize: 36, statusSize: 16 };
      default:
        return { container: 56, fontSize: 20, statusSize: 12 };
    }
  };

  const sizeValue = getSizeValue();

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getInitialsBackgroundColor = (name?: string) => {
    if (!name) return colors.border.medium;
    const colorsList = [
      colors.primary.rose,
      colors.primary.lavender,
      colors.primary.sky,
      colors.semantic.hunger,
      colors.semantic.happiness,
      colors.semantic.energy,
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorsList[Math.abs(hash) % colorsList.length];
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    width: sizeValue.container,
    height: sizeValue.container,
    borderRadius: variant === 'circle' ? sizeValue.container / 2 : borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.light,
    borderWidth: borderColor ? 2 : 0,
    borderColor: borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  const initialsStyle = {
    width: sizeValue.container,
    height: sizeValue.container,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: getInitialsBackgroundColor(name),
  };

  const imageBaseStyle: ImageStyle = {
    width: sizeValue.container,
    height: sizeValue.container,
  };

  const statusPosition = sizeValue.container - 4;

  return (
    <View testID={testID}>
      <Animated.View style={[containerStyle, animatedStyle]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={[imageBaseStyle, imageStyle]}
            accessibilityLabel={accessibilityLabel || `Avatar of ${name || 'user'}`}
          />
        ) : (
          <View style={initialsStyle}>
            <Text
              style={{
                fontSize: sizeValue.fontSize,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.inverse,
              }}
            >
              {getInitials(name)}
            </Text>
          </View>
        )}
      </Animated.View>

      {showStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: sizeValue.statusSize,
              height: sizeValue.statusSize,
              borderRadius: sizeValue.statusSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline ? '#4CAF50' : colors.text.tertiary,
                width: sizeValue.statusSize,
                height: sizeValue.statusSize,
                borderRadius: sizeValue.statusSize / 2,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusIndicator: {
    position: 'absolute',
    padding: 2,
    backgroundColor: colors.background.light,
    borderRadius: 999,
  },
  statusDot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Avatar;
