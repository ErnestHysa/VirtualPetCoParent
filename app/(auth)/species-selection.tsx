import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { colors, typography, motion, spacing, borderRadius, shadows } from '../../constants/designTokens';
import { AnimatedPet } from '../../components/AnimatedPet';
import { useOnboardingStore, PetSpecies } from '../../stores/onboardingStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const species = [
  { id: 'dragon' as PetSpecies, emoji: '🐉', name: 'Dragon', description: 'Magical and mischievous' },
  { id: 'cat' as PetSpecies, emoji: '🐱', name: 'Cat', description: 'Independent and affectionate' },
  { id: 'fox' as PetSpecies, emoji: '🦊', name: 'Fox', description: 'Clever and playful' },
  { id: 'puppy' as PetSpecies, emoji: '🐕', name: 'Puppy', description: 'Loyal and energetic' },
];

const DELAY = 100;

export default function SpeciesSelectionScreen() {
  const { trigger } = useHapticFeedback();
  const { setSpecies, petColor } = useOnboardingStore();
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSpeciesSelect = (speciesId: PetSpecies) => {
    trigger('medium');
    setSelectedSpecies(speciesId);
    setSpecies(speciesId);
  };

  const handleContinue = () => {
    if (selectedSpecies) {
      trigger('success');
      router.push('/(auth)/pet-customization');
    }
  };

  const canContinue = selectedSpecies !== null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              Choose Your Companion
            </Text>
            <Text style={styles.subtitle}>
              Select a species to begin your journey
            </Text>
          </View>

          {/* Live Preview */}
          <View style={styles.previewContainer}>
            <View style={styles.petPreview}>
              <AnimatedPet
                species={selectedSpecies || 'dragon'}
                color={petColor || 'rose'}
                size={160}
                emotion="happy"
                testID="species-preview-pet"
              />
            </View>
            <Text style={styles.previewText}>
              {selectedSpecies
                ? species.find(s => s.id === selectedSpecies)?.name
                : 'Select a species'}
            </Text>
          </View>

          {/* Species Grid */}
          <View style={styles.speciesGrid}>
            {species.map((item, index) => (
              <SpeciesCard
                key={item.id}
                {...item}
                delay={DELAY * (index + 1)}
                selected={selectedSpecies === item.id}
                onPress={() => handleSpeciesSelect(item.id)}
              />
            ))}
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!canContinue}
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Continue to customization"
              accessibilityState={{ disabled: !canContinue }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#E8B4B8', '#C5B9CD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, !canContinue && styles.gradientDisabled]}
              >
                <Text style={[styles.continueButtonText, !canContinue && styles.textDisabled]}>
                  Continue
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface SpeciesCardProps {
  id: PetSpecies;
  emoji: string;
  name: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
}

const SpeciesCard: React.FC<SpeciesCardProps> = ({
  id,
  emoji,
  name,
  description,
  selected,
  onPress,
  delay,
}) => {
  const { trigger } = useHapticFeedback();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, motion.spring));
    scale.value = withDelay(delay, withSpring(1, motion.spring));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (selected) return;
    scale.value = withSpring(0.95, motion.spring);
    trigger('light');
  };

  const handlePressOut = () => {
    if (selected) return;
    scale.value = withSpring(1, motion.spring);
  };

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Select ${name}`}
        accessibilityState={{ selected: selected }}
      >
        <View style={styles.cardContent}>
          <View style={[styles.emojiContainer, selected && styles.emojiContainerSelected]}>
            <AnimatedPet
              species={id}
              color={selected ? 'rose' : 'lavender'}
              size={64}
              emotion="happy"
            />
          </View>
          <Text style={[styles.cardName, selected && styles.cardNameSelected]}>{name}</Text>
          <Text style={[styles.cardDescription, selected && styles.cardDescriptionSelected]}>
            {description}
          </Text>
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: typography.scale[1],
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.scale[5],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.scale[2],
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.secondary,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  petPreview: {
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: typography.scale[3],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  cardContainer: {
    width: '48%',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary.rose,
    backgroundColor: `${colors.primary.rose}10`,
    ...shadows.md,
  },
  cardContent: {
    alignItems: 'center',
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary.lavender}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emojiContainerSelected: {
    backgroundColor: `${colors.primary.rose}30`,
  },
  cardName: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardNameSelected: {
    color: colors.primary.rose,
  },
  cardDescription: {
    fontSize: typography.scale[0],
    lineHeight: typography.lineHeight.normal,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cardDescriptionSelected: {
    color: colors.text.tertiary,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  continueButton: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  gradientDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: typography.scale[2],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
});
