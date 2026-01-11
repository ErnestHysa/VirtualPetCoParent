/**
 * CareButton Component
 * Interactive care action button with cooldown and animations
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CareActionType } from '@/types';
import { CARE_ACTION_COLORS } from '@/constants/colors';
import { usePetStore } from '@/stores';
import { hapticFeedback } from '@/lib/utils';

interface CareButtonProps {
  type: CareActionType;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CARE_CONFIG: Record<CareActionType, {
  icon: string;
  label: string;
  color: string;
}> = {
  feed: { icon: '🍖', label: 'Feed', color: CARE_ACTION_COLORS.feed },
  play: { icon: '🎮', label: 'Play', color: CARE_ACTION_COLORS.play },
  walk: { icon: '🚶', label: 'Walk', color: CARE_ACTION_COLORS.walk },
  pet: { icon: '💕', label: 'Pet', color: CARE_ACTION_COLORS.pet },
  groom: { icon: '✨', label: 'Groom', color: CARE_ACTION_COLORS.groom },
};

export const CareButton: React.FC<CareButtonProps> = ({
  type,
  onPress,
  disabled: propDisabled,
  size = 'md',
}) => {
  const { pet, canPerformCare, getCareCooldown } = usePetStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const canDo = !propDisabled && canPerformCare(type);
  const cooldown = getCareCooldown(type);

  // Pulse animation when ready
  useEffect(() => {
    if (canDo && pet && pet.currentStage !== 'egg') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [canDo, pet]);

  const handlePress = () => {
    if (!canDo) return;

    hapticFeedback('medium');

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }),
    ]).start();

    onPress();
  };

  const config = CARE_CONFIG[type];
  const sizeStyles = {
    sm: { width: 64, height: 64, iconSize: 22, labelSize: 11 },
    md: { width: 80, height: 80, iconSize: 28, labelSize: 12 },
    lg: { width: 96, height: 96, iconSize: 34, labelSize: 13 },
  }[size];

  const isEgg = pet?.currentStage === 'egg';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          opacity: canDo && !isEgg ? 1 : 0.5,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Pulse effect */}
      {canDo && !isEgg && (
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: config.color,
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.2],
              }),
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={!canDo || isEgg}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: config.color,
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>
          {config.icon}
        </Text>
        <Text style={[styles.label, { fontSize: sizeStyles.labelSize }]}>
          {config.label}
        </Text>

        {/* Cooldown overlay */}
        {cooldown > 0 && !isEgg && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>
              {Math.ceil(cooldown / 1000)}s
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  button: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    lineHeight: 32,
  },
  label: {
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  cooldownOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cooldownText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
