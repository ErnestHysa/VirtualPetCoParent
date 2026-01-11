/**
 * StatPill Component
 * Displays pet stat with icon, value, and color coding
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useUIStore } from '@/stores';
import { SEMANTIC, NEUTRAL } from '@/constants/colors';
import { getStatColor, getStatIcon } from '@/lib/utils';

type StatType = 'hunger' | 'happiness' | 'energy';

interface StatPillProps {
  type: StatType;
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const StatPill = memo<StatPillProps>(({
  type,
  value,
  showLabel = false,
  size = 'md',
  style,
}) => {
  const { colorScheme } = useUIStore();

  const sizeStyles = {
    sm: { height: 28, paddingHorizontal: 10, iconSize: 14, fontSize: 12 },
    md: { height: 36, paddingHorizontal: 14, iconSize: 16, fontSize: 14 },
    lg: { height: 44, paddingHorizontal: 18, iconSize: 18, fontSize: 16 },
  };

  const sizing = sizeStyles[size];
  const statColor = getStatColor(value);

  return (
    <View
      style={[
        styles.pill,
        {
          height: sizing.height,
          paddingHorizontal: sizing.paddingHorizontal,
          backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100],
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { fontSize: sizing.iconSize }]}>
        {getStatIcon(type)}
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: sizing.fontSize, color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] },
          ]}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      )}
      <View
        style={[
          styles.valueDot,
          {
            backgroundColor: statColor,
            width: sizing.iconSize + 4,
            height: sizing.iconSize + 4,
          },
        ]}
      />
    </View>
  );
});

StatPill.displayName = 'StatPill';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    gap: 6,
  },
  icon: {
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
  },
  valueDot: {
    borderRadius: 999,
  },
});
