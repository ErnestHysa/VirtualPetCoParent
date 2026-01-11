import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, motion, shadows } from '../../constants/designTokens';
import { usePetStore } from '../../stores/usePetStore';
import { useCoupleStore } from '../../stores/useCoupleStore';
import { useUIStore } from '../../stores/useUIStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import StatPill from '../../components/ui/StatPill';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { ActionType, Species } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen() {
  const { pet, careHistory, isLoading, syncPet } = usePetStore();
  const { couple, partnerInfo } = useCoupleStore();
  const { theme } = useUIStore();
  const { trigger } = useHapticFeedback();

  const [refreshing, setRefreshing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Animation values
  const breatheScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const petRotation = useSharedValue(0);

  // Breathing animation
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 20, stiffness: 100 }),
        withSpring(1, { damping: 20, stiffness: 100 })
      ),
      -1,
      false
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withSpring(0.5, { damping: 20, stiffness: 100 }),
        withSpring(0.3, { damping: 20, stiffness: 100 })
      ),
      -1,
      false
    );
  }, []);

  // Get last action from partner
  useEffect(() => {
    if (careHistory.length > 0) {
      const lastCareAction = careHistory[0];
      if (lastCareAction) {
        const actionText = getActionText(lastCareAction.action_type);
        setLastAction(`${partnerInfo?.profile?.username || 'Your partner'} just ${actionText} ${pet?.name || 'your pet'}!`);
      }
    }
  }, [careHistory, partnerInfo, pet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    trigger('light');
    await syncPet();
    setRefreshing(false);
  }, [syncPet, trigger]);

  const getActionText = (action: ActionType): string => {
    const actionTexts: Record<ActionType, string> = {
      [ActionType.FEED]: 'fed',
      [ActionType.PLAY]: 'played with',
      [ActionType.WALK]: 'walked',
      [ActionType.PET]: 'pet',
      [ActionType.GROOM]: 'groomed',
      [ActionType.TRAIN]: 'trained',
      [ActionType.SLEEP]: 'put to sleep',
      [ActionType.BATH]: 'gave a bath to',
    };
    return actionTexts[action] || 'cared for';
  };

  const getPetEmoji = (species?: Species): string => {
    if (!species) return '🐾';
    const emojis: Record<Species, string> = {
      [Species.DOG]: '🐕',
      [Species.CAT]: '🐱',
      [Species.RABBIT]: '🐰',
      [Species.HAMSTER]: '🐹',
      [Species.BIRD]: '🐦',
    };
    return emojis[species] || '🐾';
  };

  const getDaysTogether = (): number => {
    return couple?.days_together || 0;
  };

  const handleQuickAction = (action: ActionType) => {
    trigger('medium');
    // TODO: Implement action handling
  };

  const animatedBreatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isDarkMode = theme === 'dark';

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.rose}
          colors={[colors.primary.rose]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, isDarkMode && styles.textLight]}>
              Good Morning!
            </Text>
            <Text style={[styles.subGreeting, isDarkMode && styles.textTertiary]}>
              Let's check on {pet?.name || 'your pet'}
            </Text>
          </View>
          <Avatar
            name={partnerInfo?.profile?.username}
            uri={partnerInfo?.profile?.avatar_url}
            size="md"
            isOnline={partnerInfo?.isOnline}
          />
        </View>

        {/* Days Together Counter */}
        <View style={styles.daysCounter}>
          <Text style={[styles.daysLabel, isDarkMode && styles.textSecondary]}>
            Days Together
          </Text>
          <Text style={[styles.daysNumber, isDarkMode && styles.textLight]}>
            {getDaysTogether()}
          </Text>
        </View>

        {/* Main Pet Display Area - 60% of screen */}
        <View style={[styles.petContainer, { height: SCREEN_HEIGHT * 0.45 }]}>
          {/* Ambient Glow */}
          <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
            <LinearGradient
              colors={[colors.primary.rose + '40', colors.primary.lavender + '40', colors.primary.sky + '40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Pet Display */}
          <BlurView intensity={80} tint="light" style={styles.petBlur}>
            <AnimatedLinearGradient
              colors={[
                colors.primary.rose + '20',
                colors.primary.lavender + '20',
                colors.primary.sky + '20',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.petGradient}
            >
              <Animated.View style={[styles.petEmojiContainer, animatedBreatheStyle]}>
                <Text style={styles.petEmoji}>
                  {getPetEmoji(pet?.species)}
                </Text>
              </Animated.View>

              <Text style={[styles.petName, isDarkMode && styles.textLight]}>
                {pet?.name || 'Your Pet'}
              </Text>
              <Text style={[styles.petLevel, isDarkMode && styles.textSecondary]}>
                Level {pet?.current_level || 1}
              </Text>
            </AnimatedLinearGradient>
          </BlurView>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatPill
            type="hunger"
            value={pet?.stats?.hunger || 0}
            size="md"
            style={styles.statPill}
          />
          <StatPill
            type="happiness"
            value={pet?.stats?.happiness || 0}
            size="md"
            style={styles.statPill}
          />
          <StatPill
            type="energy"
            value={pet?.stats?.energy || 0}
            size="md"
            style={styles.statPill}
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <Button
            title="Feed"
            variant="primary"
            size="sm"
            onPress={() => handleQuickAction(ActionType.FEED)}
            style={styles.quickButton}
          />
          <Button
            title="Play"
            variant="secondary"
            size="sm"
            onPress={() => handleQuickAction(ActionType.PLAY)}
            style={styles.quickButton}
          />
          <Button
            title="Walk"
            variant="ghost"
            size="sm"
            onPress={() => handleQuickAction(ActionType.WALK)}
            style={styles.quickButton}
          />
          <Button
            title="Pet"
            variant="secondary"
            size="sm"
            onPress={() => handleQuickAction(ActionType.PET)}
            style={styles.quickButton}
          />
        </View>

        {/* Recent Activity Banner */}
        {lastAction && (
          <Card variant="glass" padding="md" style={styles.activityBanner}>
            <View style={styles.activityContent}>
              <Text style={styles.activityEmoji}>💝</Text>
              <View style={styles.activityTextContainer}>
                <Text style={[styles.activityLabel, isDarkMode && styles.textSecondary]}>
                  Recent Activity
                </Text>
                <Text style={[styles.activityText, isDarkMode && styles.textLight]}>
                  {lastAction}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  containerDark: {
    backgroundColor: colors.background.dark,
  },
  content: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.scale[4],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: typography.scale[1],
    color: colors.text.secondary,
  },
  daysCounter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  daysLabel: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  daysNumber: {
    fontSize: typography.scale[5],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.rose,
  },
  petContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  glowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: 300,
    height: 300,
    borderRadius: 150,
    blurRadius: 60,
  },
  petBlur: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  petGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  petEmojiContainer: {
    marginBottom: spacing.lg,
  },
  petEmoji: {
    fontSize: 120,
    textAlign: 'center',
  },
  petName: {
    fontSize: typography.scale[4],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  petLevel: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  quickButton: {
    flexBasis: '48%',
    marginBottom: spacing.sm,
  },
  activityBanner: {
    marginBottom: spacing.lg,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.scale[0],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityText: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  textLight: {
    color: colors.text.inverse,
  },
  textSecondary: {
    color: colors.text.secondary,
  },
  textTertiary: {
    color: colors.text.tertiary,
  },
});

const { typography } = require('../../constants/designTokens');
