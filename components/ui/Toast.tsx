/**
 * Toast Component
 * Elegant notification overlay
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useUIStore } from '@/stores';
import * as Haptics from 'expo-haptics';
import { STATUS, NEUTRAL } from '@/constants/colors';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const { colorScheme } = useUIStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Animate in
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      );

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timerRef.current = setTimeout(onDismiss, duration);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#B5EAD7', text: '#1A4D3E' };
      case 'error':
        return { bg: '#FF9AA2', text: '#5C1A24' };
      case 'warning':
        return { bg: '#FFE58F', text: '#5C4D1A' };
      case 'info':
        return { bg: '#A7C7E7', text: '#1A2E4D' };
    }
  };

  const colors = getColors();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          styles.toast,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={[styles.dismiss, { color: NEUTRAL[400] }]}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  dismissBtn: {
    padding: 4,
  },
  dismiss: {
    fontSize: 14,
  },
});
