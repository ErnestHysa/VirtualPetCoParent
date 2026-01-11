import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
  Modal as RNModal,
  StatusBar,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, borderRadius, motion } from '../../constants/designTokens';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showBackdrop?: boolean;
  backdropColor?: string;
  dismissOnBackdropPress?: boolean;
  dismissOnSwipeDown?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  animationType?: 'slide' | 'fade' | 'scale';
  accessibilityLabel?: string;
  testID?: string;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  showBackdrop = true,
  backdropColor,
  dismissOnBackdropPress = true,
  dismissOnSwipeDown = true,
  style,
  contentContainerStyle,
  animationType = 'slide',
  accessibilityLabel,
  testID,
}) => {
  const { trigger } = useHapticFeedback();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });

      switch (animationType) {
        case 'slide':
          translateY.value = withSpring(0, motion.spring);
          break;
        case 'fade':
          opacity.value = withTiming(1, { duration: 300 });
          break;
        case 'scale':
          scale.value = withSpring(1, motion.spring);
          break;
      }
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 200 });

      switch (animationType) {
        case 'slide':
          translateY.value = withTiming(100, { duration: 200 });
          break;
        case 'fade':
          opacity.value = withTiming(0, { duration: 200 });
          break;
        case 'scale':
          scale.value = withTiming(0, { duration: 200 });
          break;
      }
    }
  }, [visible, animationType]);

  const handleClose = () => {
    trigger('medium');
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (dismissOnSwipeDown && event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (dismissOnSwipeDown && event.translationY > 100) {
        translateY.value = withTiming(400, { duration: 200 }, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withSpring(0, motion.spring);
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slide':
        return {
          transform: [{ translateY: translateY.value }],
        };
      case 'fade':
        return {
          opacity: opacity.value,
        };
      case 'scale':
        return {
          transform: [{ scale: scale.value }],
        };
      default:
        return {};
    }
  });

  const renderBackdrop = () => {
    if (!showBackdrop) return null;

    return (
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <BlurView
          intensity={20}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdropPress ? handleClose : undefined}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            disabled={!dismissOnBackdropPress}
          />
        </BlurView>
      </Animated.View>
    );
  };

  const renderContent = () => {
    return (
      <View style={[styles.container, style]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.content,
              animatedContentStyle,
              contentContainerStyle,
            ]}
          >
            {dismissOnSwipeDown && (
              <View style={styles.dragHandle} />
            )}
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      testID={testID}
      onRequestClose={handleClose}
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
      />
      {renderBackdrop()}
      {renderContent()}
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default Modal;
