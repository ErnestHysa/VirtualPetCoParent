import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface GameModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  timer: number;
  isPaused: boolean;
  onPause?: () => void;
  onResume?: () => void;
  children: React.ReactNode;
  showPause?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GameModal: React.FC<GameModalProps> = ({
  visible,
  onClose,
  title,
  timer,
  isPaused,
  onPause,
  onResume,
  children,
  showPause = true,
}) => {
  const { trigger } = useHapticFeedback();
  const [isAccessible, setIsAccessible] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsAccessible);
  }, []);

  const backdropOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(SCREEN_HEIGHT);
  const contentScale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateY.value = withSpring(0, motion.spring);
      contentScale.value = withSpring(1, motion.spring);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      contentTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      contentScale.value = withTiming(0.9, { duration: 250 });
    }
  }, [visible]);

  const handleClose = () => {
    trigger('medium');
    onClose();
  };

  const handlePause = () => {
    trigger('light');
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: contentTranslateY.value },
      { scale: contentScale.value },
    ],
  }));

  const timerColor = timer <= 10 ? '#FF6B6B' : colors.text.primary;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              {/* Close Button */}
              <AnimatedTouchableOpacity
                onPress={handleClose}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Close game"
                accessibilityState={{ expanded: true }}
              >
                <Text style={styles.iconText}>✕</Text>
              </AnimatedTouchableOpacity>

              {/* Title */}
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>

              {/* Pause Button */}
              {showPause && (
                <AnimatedTouchableOpacity
                  onPress={handlePause}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={isPaused ? 'Resume game' : 'Pause game'}
                >
                  <Text style={styles.iconText}>{isPaused ? '▶' : '⏸'}</Text>
                </AnimatedTouchableOpacity>
              )}
            </View>

            {/* Timer */}
            <View
              style={[
                styles.timerContainer,
                timer <= 10 && styles.timerWarning,
              ]}
              accessible={true}
              accessibilityLabel={`Time remaining: ${timer} seconds`}
            >
              <Text style={[styles.timerText, { color: timerColor }]}>
                {Math.ceil(timer)}s
              </Text>
            </View>

            {/* Game Content */}
            <View style={styles.gameContent}>{children}</View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.3)',
  },
  content: {
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  timerContainer: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    transitionProperty: 'border-color',
  },
  timerWarning: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  gameContent: {
    flex: 1,
  },
});

export default GameModal;
