/**
 * EvolutionProgressCard Component
 * Displays current evolution progress with visual progress indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing, borderRadius, motion } from '../../constants/designTokens';
import { PetStage } from '../../types';
import { EvolutionProgress, STAGE_DISPLAY_NAMES, STAGE_EMOJIS } from '../../services/evolutionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface EvolutionProgressCardProps {
  progress: EvolutionProgress;
  petName: string;
}

const EvolutionProgressCard: React.FC<EvolutionProgressCardProps> = ({ progress, petName }) => {
  const progressAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    progressAnim.value = withSpring(progress.progressPercent / 100, motion.spring);

    // Pulse animation when evolution is ready
    if (progress.canEvolve) {
      pulseAnim.value = withSpring(1.05, { damping: 4, stiffness: 150 });
    }
  }, [progress.progressPercent, progress.canEvolve]);

  const progressDerived = useDerivedValue(() => {
    return `${Math.round(progressAnim.value * 100)}%`;
  });

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: progressDerived.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const stages: PetStage[] = [
    PetStage.EGG,
    PetStage.BABY,
    PetStage.CHILD,
    PetStage.TEEN,
    PetStage.ADULT,
    PetStage.ELDER,
  ];

  const currentStageIndex = stages.indexOf(progress.currentStage);
  const nextStageIndex = progress.nextStage ? stages.indexOf(progress.nextStage) : -1;

  return (
    <Animated.View style={[styles.container, pulseAnimatedStyle]}>
      <BlurView intensity={20} tint="light" style={styles.blurContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Evolution Progress</Text>
          <Text style={styles.subtitle}>{petName}</Text>
        </View>

        {/* Stage indicator */}
        <View style={styles.stagesContainer}>
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isNext = index === nextStageIndex;
            const isLocked = index > currentStageIndex && !isNext;

            return (
              <View key={stage} style={styles.stageItem}>
                {/* Stage dot */}
                <Animated.View
                  style={[
                    styles.stageDot,
                    isCompleted && styles.stageDotCompleted,
                    isCurrent && styles.stageDotCurrent,
                    isNext && styles.stageDotNext,
                    isLocked && styles.stageDotLocked,
                  ]}
                >
                  {isCompleted || isCurrent || isNext ? (
                    <LinearGradient
                      colors={
                        isCurrent
                          ? [colors.primary.rose, colors.primary.lavender]
                          : [colors.primary.lavender, colors.primary.sky]
                      }
                      style={styles.stageDotGradient}
                    >
                      <Text style={styles.stageDotEmoji}>{STAGE_EMOJIS[stage]}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.stageDotLockedInner}>
                      <Text style={styles.stageDotLockedEmoji}>🔒</Text>
                    </View>
                  )}
                </Animated.View>

                {/* Stage label */}
                <Text
                  style={[
                    styles.stageLabel,
                    isCurrent && styles.stageLabelCurrent,
                    isLocked && styles.stageLabelLocked,
                  ]}
                >
                  {STAGE_DISPLAY_NAMES[stage]}
                </Text>

                {/* Connector line */}
                {index < stages.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      isCompleted && styles.connectorLineCompleted,
                      isCurrent && styles.connectorLineCurrent,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        {!progress.hasReachedMaxStage && (
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>
                {progress.canEvolve ? 'Ready to Evolve!' : `${progress.daysUntilNextEvolution} days to go`}
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(progress.progressPercent)}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    progressAnimatedStyle,
                    progress.canEvolve && styles.progressBarFillReady,
                  ]}
                />
              </View>
            </View>

            <Text style={styles.streakInfo}>
              🔥 Current Streak: {progress.currentStreakDays} days
            </Text>
          </View>
        )}

        {/* Max stage message */}
        {progress.hasReachedMaxStage && (
          <View style={styles.maxStageContainer}>
            <Text style={styles.maxStageIcon}>👑</Text>
            <Text style={styles.maxStageTitle}>Maximum Stage Reached!</Text>
            <Text style={styles.maxStageText}>
              {petName} has reached its final form
            </Text>
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.scale[3],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  stageItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stageDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: spacing.sm,
    position: 'relative',
    zIndex: 2,
  },
  stageDotCompleted: {
    borderWidth: 2,
    borderColor: colors.primary.lavender,
  },
  stageDotCurrent: {
    borderWidth: 3,
    borderColor: colors.primary.rose,
    shadowColor: colors.primary.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stageDotNext: {
    borderWidth: 2,
    borderColor: colors.primary.sky,
    borderStyle: 'dashed',
  },
  stageDotLocked: {
    backgroundColor: colors.border.light,
  },
  stageDotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageDotLockedInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageDotEmoji: {
    fontSize: 20,
  },
  stageDotLockedEmoji: {
    fontSize: 14,
  },
  stageLabel: {
    fontSize: typography.scale[0],
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  stageLabelCurrent: {
    color: colors.primary.rose,
    fontWeight: typography.fontWeight.semibold,
  },
  stageLabelLocked: {
    color: colors.text.tertiary,
  },
  connectorLine: {
    position: 'absolute',
    top: 24,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border.light,
    zIndex: 1,
  },
  connectorLineCompleted: {
    backgroundColor: colors.primary.lavender,
  },
  connectorLineCurrent: {
    backgroundColor: colors.primary.rose,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: progress.canEvolve ? colors.primary.rose : colors.text.secondary,
  },
  progressPercent: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.rose,
  },
  progressBar: {
    height: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.rose,
    borderRadius: borderRadius.full,
  },
  progressBarFillReady: {
    backgroundColor: colors.primary.lavender,
  },
  streakInfo: {
    fontSize: typography.scale[0],
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  maxStageContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  maxStageIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  maxStageTitle: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.rose,
    marginBottom: spacing.xs,
  },
  maxStageText: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
  },
});

export default EvolutionProgressCard;
