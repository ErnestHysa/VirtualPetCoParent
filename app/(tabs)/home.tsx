/**
 * Home Screen
 * Main pet display with care options
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePetStore, useAuthStore, useUIStore } from '@/stores';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { CareButton } from '@/components/pet/CareButton';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BACKGROUND, NEUTRAL, PRIMARY, SEMANTIC } from '@/constants/colors';
import { daysBetween } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useUIStore();
  const { pet, performCare } = usePetStore();
  const { couple, partner } = useAuthStore();

  // Mock pet for now - in production this would come from the store
  const mockPet = pet || {
    id: '1',
    coupleId: '1',
    species: 'dragon' as const,
    color: '#E8B4B8',
    name: 'Luna',
    currentStage: 'baby' as const,
    stats: { hunger: 75, happiness: 80, energy: 65 },
    personality: { playful: 35, calm: 20, mischievous: 15, affectionate: 30 },
    dominantPersonality: 'playful' as const,
    xp: 150,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  };

  const daysTogether = couple?.daysTogether || 7;

  useEffect(() => {
    // Simulate stat decay every minute
    const interval = setInterval(() => {
      // usePetStore.getState().decayStats();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCare = async (action: 'feed' | 'play' | 'walk' | 'pet' | 'groom') => {
    await performCare(action);
    useUIStore.getState().showToast(
      `You ${action}ed ${mockPet.name}! 💕`,
      'success'
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] }]}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},
          </Text>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800] }]}>
            {partner?.username || 'Your partner'} & you
          </Text>
        </View>
        <TouchableOpacity
          style={styles.milestoneButton}
          onPress={() => router.push('/milestones')}
        >
          <View style={styles.milestoneBadge}>
            <Text style={styles.milestoneDays}>{daysTogether}</Text>
          </View>
          <Text style={[styles.milestoneLabel, { color: NEUTRAL[500] }]}>days</Text>
        </TouchableOpacity>
      </View>

      {/* Pet Display */}
      <Animated.View entering={FadeIn} style={styles.petSection}>
        <PetDisplay
          pet={mockPet}
          onPress={() => handleCare('pet')}
          onLongPress={() => router.push('/(tabs)/care')}
        />
      </Animated.View>

      {/* Quick Care Buttons */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.careSection}>
        <View style={styles.careButtons}>
          <CareButton type="feed" onPress={() => handleCare('feed')} />
          <CareButton type="play" onPress={() => handleCare('play')} />
          <CareButton type="pet" onPress={() => handleCare('pet')} />
          <CareButton type="groom" onPress={() => handleCare('groom')} />
        </View>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <Card variant="elevated" padding={20} style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
            {mockPet.name}'s Stats
          </Text>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Hunger</Text>
            <ProgressBar
              progress={mockPet.stats.hunger}
              color={SEMANTIC.hunger}
              height={24}
              style={styles.statBar}
            />
          </View>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Happiness</Text>
            <ProgressBar
              progress={mockPet.stats.happiness}
              color={SEMANTIC.happiness}
              height={24}
              style={styles.statBar}
            />
          </View>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Energy</Text>
            <ProgressBar
              progress={mockPet.stats.energy}
              color={SEMANTIC.energy}
              height={24}
              style={styles.statBar}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Mood Message */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <Card variant="glass" padding={16} style={styles.moodCard}>
          <Text style={[styles.moodText, { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] }]}>
            {mockPet.stats.happiness > 70
              ? `${mockPet.name} is so happy to see you both! 🌟`
              : `${mockPet.name} could use some love and attention...`}
          </Text>
        </Card>
      </Animated.View>

      {/* Action Cards */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.actionCards}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: PRIMARY.lavender + '40' }]}
          onPress={() => router.push('/(tabs)/games')}
        >
          <Text style={styles.actionEmoji}>🎮</Text>
          <Text style={[styles.actionTitle, { color: NEUTRAL[700] }]}>Play Games</Text>
          <Text style={[styles.actionSubtitle, { color: NEUTRAL[500] }]}>
            Earn XP together
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: PRIMARY.sky + '40' }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.actionEmoji}>🎨</Text>
          <Text style={[styles.actionTitle, { color: NEUTRAL[700] }]}>Customize</Text>
          <Text style={[styles.actionSubtitle, { color: NEUTRAL[500] }]}>
            Change appearance
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  milestoneButton: {
    alignItems: 'center',
  },
  milestoneBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8B4B8' + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  milestoneDays: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8B4B8',
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  petSection: {
    alignItems: 'center',
    minHeight: 320,
  },
  careSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  careButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
  },
  statBar: {
    flex: 1,
  },
  moodCard: {
    marginBottom: 16,
  },
  moodText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
