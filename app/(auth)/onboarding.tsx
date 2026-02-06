/**
 * Onboarding Screen
 * Pet species and color selection
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PetSpecies } from '@/types';
import { PET_SPECIES, PET_COLORS } from '@/constants/pet';
import { BACKGROUND, PRIMARY, NEUTRAL } from '@/constants/colors';

const STEPS = ['species', 'color', 'name'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colorScheme } = useUIStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>('dragon');
  const [selectedColor, setSelectedColor] = useState<string>(PET_COLORS[0].id);
  const [petName, setPetName] = useState('');

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedSpecies;
      case 1:
        return !!selectedColor;
      case 2:
        return petName.length >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      useUIStore.getState().completeOnboarding();
      router.replace('/(auth)/pair');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const renderSpeciesStep = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your companion</Text>
      <Text style={styles.stepSubtitle}>
        Each species has unique personality traits
      </Text>

      <View style={styles.speciesGrid}>
        {Object.entries(PET_SPECIES).map(([key, species], index) => (
          <Animated.View
            key={key}
            entering={FadeInDown.delay(index * 100)}
          >
            <TouchableOpacity
              style={[
                styles.speciesCard,
                selectedSpecies === key && styles.speciesCardSelected,
                {
                  backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100],
                  borderColor: selectedSpecies === key ? species.baseColor : 'transparent',
                },
              ]}
              onPress={() => setSelectedSpecies(key as PetSpecies)}
            >
              <Text style={styles.speciesEmoji}>{species.emoji}</Text>
              <Text
                style={[
                  styles.speciesName,
                  { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] },
                ]}
              >
                {species.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderColorStep = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pick a color</Text>
      <Text style={styles.stepSubtitle}>
        Make your pet uniquely yours
      </Text>

      <View style={styles.colorGrid}>
        {PET_COLORS.map((color, index) => (
          <Animated.View
            key={color.id}
            entering={FadeInDown.delay(index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.colorCard,
                selectedColor === color.id && styles.colorCardSelected,
              ]}
              onPress={() => setSelectedColor(color.id)}
            >
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: color.color },
                  selectedColor === color.id && {
                    shadowColor: color.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 8,
                  },
                ]}
              />
              <Text
                style={[
                  styles.colorName,
                  { color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] },
                ]}
              >
                {color.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderNameStep = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Name your pet</Text>
      <Text style={styles.stepSubtitle}>
        What will you call your new friend?
      </Text>

      <Card variant="bordered" style={styles.nameInputContainer}>
        <Text style={styles.namePreview}>
          {PET_SPECIES[selectedSpecies].emoji} {petName || '...'}
        </Text>
        <TextInput
          style={[
            styles.nameInput,
            { color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800] },
          ]}
          placeholder="Enter a name"
          placeholderTextColor={NEUTRAL[400]}
          value={petName}
          onChangeText={setPetName}
          maxLength={20}
          autoFocus
        />
      </Card>

      <View style={styles.nameSuggestions}>
        <Text style={styles.suggestionsTitle}>Suggestions:</Text>
        {['Luna', 'Cosmo', 'Buddy', 'Star', 'Willow', 'Mochi'].map((name) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.suggestionChip,
              { backgroundColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[100] },
            ]}
            onPress={() => setPetName(name)}
          >
            <Text
              style={{ color: colorScheme === 'dark' ? NEUTRAL[300] : NEUTRAL[600] }}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotComplete,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderSpeciesStep()}
        {currentStep === 1 && renderColorStep()}
        {currentStep === 2 && renderNameStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={currentStep === STEPS.length - 1 ? 'Start Journey' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed()}
          fullWidth
        />
      </View>
    </View>
  );
}

const TextInput = require('react-native').TextInput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 50,
  },
  backText: {
    fontSize: 16,
    color: '#4D4A45',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E5E1',
  },
  dotActive: {
    backgroundColor: '#E8B4B8',
    width: 24,
  },
  dotComplete: {
    backgroundColor: '#E8B4B8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 17,
    color: '#615E57',
    marginBottom: 32,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  speciesCardSelected: {
    borderWidth: 3,
  },
  speciesEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 15,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorCard: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  colorCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  colorPreview: {
    width: 56,
    height: 56,
    borderRadius: 999,
  },
  colorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  nameInputContainer: {
    padding: 24,
    alignItems: 'center',
  },
  namePreview: {
    fontSize: 48,
    marginBottom: 16,
  },
  nameInput: {
    width: '100%',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E8B4B8',
    paddingBottom: 8,
  },
  nameSuggestions: {
    marginTop: 32,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#615E57',
    marginBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E5E1',
  },
});
