/**
 * MilestoneTracker Component
 * Displays and tracks all relationship and pet milestones
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, motion } from '../../constants/designTokens';
import { Milestone } from '../../types';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { getMilestoneProgress, MILESTONE_TYPES } from '../../services/evolutionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MilestoneTrackerProps {
  coupleId: string;
  milestones: Milestone[];
  onMilestonePress?: (milestone: Milestone) => void;
}

interface MilestoneItemProps {
  milestone: Milestone;
  index: number;
  onPress?: () => void;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  coupleId,
  milestones,
  onMilestonePress,
}) => {
  const { trigger } = useHapticFeedback();
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    loadProgress();
  }, [milestones]);

  const loadProgress = async () => {
    const progressData = await getMilestoneProgress(coupleId);
    setProgress(progressData);
    progressWidth.value = withSpring(progressData.percent / 100, motion.spring);
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Milestones</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>
          <Text style={styles.progressText}>
            {progress.completed}/{progress.total}
          </Text>
        </View>
      </View>

      {/* Milestones list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {milestones.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Milestones Yet</Text>
            <Text style={styles.emptyText}>
              Care for your pet together to unlock special moments!
            </Text>
          </View>
        ) : (
          milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              index={index}
              onPress={() => {
                trigger('light');
                onMilestonePress?.(milestone);
              }}
            />
          ))
        )}

        {/* Locked milestones preview */}
        {milestones.length < MILESTONE_TYPES.length && (
          <View style={styles.lockedSection}>
            <Text style={styles.lockedTitle}>Up Next</Text>
            {MILESTONE_TYPES.slice(milestones.length, milestones.length + 3).map((type, index) => (
              <View key={type.id} style={styles.lockedMilestone}>
                <Text style={styles.lockedIcon}>{type.icon}</Text>
                <View style={styles.lockedInfo}>
                  <Text style={styles.lockedMilestoneTitle}>{type.title}</Text>
                  <Text style={styles.lockedMilestoneDesc}>{type.description}</Text>
                </View>
                <Text style={styles.lockedText}>🔒</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const MilestoneItem: React.FC<MilestoneItemProps> = ({ milestone, index, onPress }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(50);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withSpring(1));
    scale.value = withDelay(index * 100, withSpring(1, motion.spring));
    translateX.value = withDelay(index * 100, withSpring(0, motion.spring));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.milestoneItem, animatedStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.milestonePressable,
          pressed && styles.milestonePressed,
        ]}
      >
        <BlurView intensity={20} tint="light" style={styles.milestoneBlur}>
          <View style={styles.milestoneIconContainer}>
            <LinearGradient
              colors={[colors.primary.rose, colors.primary.lavender]}
              style={styles.iconGradient}
            >
              <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
            </LinearGradient>
          </View>

          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
          </View>

          <View style={styles.milestoneDateContainer}>
            <Text style={styles.milestoneDate}>
              {formatMilestoneDate(milestone.achieved_at)}
            </Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const formatMilestoneDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.scale[4],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.rose,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    minWidth: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  milestoneItem: {
    marginBottom: spacing.md,
  },
  milestonePressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  milestonePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  milestoneBlur: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  milestoneIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIcon: {
    fontSize: 28,
  },
  milestoneInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  milestoneTitle: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  milestoneDescription: {
    fontSize: typography.scale[0],
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  milestoneDateContainer: {
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  milestoneDate: {
    fontSize: typography.scale[0],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.scale[3],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  lockedSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  lockedTitle: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.border.light + '30',
    borderRadius: borderRadius.md,
    opacity: 0.6,
  },
  lockedIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  lockedInfo: {
    flex: 1,
  },
  lockedMilestoneTitle: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  lockedMilestoneDesc: {
    fontSize: typography.scale[0],
    color: colors.text.tertiary,
  },
  lockedText: {
    fontSize: 20,
  },
});

export default MilestoneTracker;
