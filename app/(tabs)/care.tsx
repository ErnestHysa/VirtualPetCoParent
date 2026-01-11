/**
 * Care Screen
 * Detailed care options for the pet
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { usePetStore, useUIStore } from '@/stores';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { CareButton } from '@/components/pet/CareButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACKGROUND, NEUTRAL, CARE_ACTION_COLORS, SEMANTIC } from '@/constants/colors';

const CARE_DETAILS: Record<string, { title: string; description: string; effect: string; emoji: string }> = {
  feed: { title: 'Feed', description: 'Give your pet a delicious meal', effect: '+20 Hunger, +5 Energy', emoji: '🍖' },
  play: { title: 'Play', description: 'Have fun together', effect: '+25 Happiness, -10 Energy', emoji: '🎮' },
  walk: { title: 'Walk', description: 'Go for a nice stroll', effect: '+15 Happiness, -10 Energy', emoji: '🚶' },
  pet: { title: 'Pet', description: 'Show some love', effect: '+10 Happiness', emoji: '💕' },
  groom: { title: 'Groom', description: 'Brush and clean', effect: '+15 Happiness, -5 Energy', emoji: '✨' },
};

export default function CareScreen() {
  const { colorScheme } = useUIStore();
  const { pet } = usePetStore();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Mock pet for display
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
    createdAt: new Date(),
  };

  const handleCare = (action: string) => {
    setSelectedAction(action);
    useUIStore.getState().showToast(
      `You ${CARE_DETAILS[action].title.toLowerCase()}ed ${mockPet.name}!`,
      'success'
    );
    setTimeout(() => setSelectedAction(null), 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800] }]}>
          Care for {mockPet.name}
        </Text>
        <Text style={[styles.subtitle, { color: NEUTRAL[500] }]}>
          Keep your companion happy and healthy
        </Text>

        {/* Mini Pet Display */}
        <View style={styles.petPreview}>
          <PetDisplay pet={mockPet} />
        </View>

        {/* Care Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
            Actions
          </Text>

          {(Object.keys(CARE_DETAILS) as Array<keyof typeof CARE_DETAILS>).map((action, index) => {
            const detail = CARE_DETAILS[action];
            return (
              <Animated.View
                key={action}
                entering={FadeInDown.delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => handleCare(action)}
                  activeOpacity={0.7}
                >
                  <Card
                    variant="bordered"
                    padding={16}
                    style={[
                      styles.actionCard,
                      selectedAction === action && styles.actionCardSelected,
                    ]}
                  >
                    <View style={styles.actionContent}>
                      <View style={[styles.actionIcon, { backgroundColor: CARE_ACTION_COLORS[action] + '30' }]}>
                        <Text style={styles.actionEmoji}>{detail.emoji}</Text>
                      </View>
                      <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
                          {detail.title}
                        </Text>
                        <Text style={[styles.actionDescription, { color: NEUTRAL[500] }]}>
                          {detail.description}
                        </Text>
                        <Text style={[styles.actionEffect, { color: SEMANTIC.energy }]}>
                          {detail.effect}
                        </Text>
                      </View>
                      <View style={styles.actionArrow}>
                        <Text style={{ fontSize: 16, color: NEUTRAL[400] }}>→</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
            Quick Tap
          </Text>
          <View style={styles.quickButtons}>
            <CareButton type="feed" onPress={() => handleCare('feed')} size="lg" />
            <CareButton type="play" onPress={() => handleCare('play')} size="lg" />
            <CareButton type="pet" onPress={() => handleCare('pet')} size="lg" />
          </View>
        </View>

        {/* Tips Card */}
        <Card variant="glass" padding={20} style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
            💡 Care Tips
          </Text>
          <Text style={[styles.tipsText, { color: NEUTRAL[500] }]}>
            • Feed your pet every few hours to keep hunger up{'\n'}
            • Play games together for bonus happiness{'\n'}
            • Don't forget to let them rest when energy is low{'\n'}
            • Both partners caring = happier pet!
          </Text>
        </Card>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    marginBottom: 24,
  },
  petPreview: {
    height: 280,
    marginBottom: 24,
  },
  actionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionCard: {
    marginBottom: 12,
  },
  actionCardSelected: {
    opacity: 0.6,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionEffect: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionArrow: {
    width: 24,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
