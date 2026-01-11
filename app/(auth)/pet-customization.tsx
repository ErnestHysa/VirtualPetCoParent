import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, motion, spacing, borderRadius, shadows } from '../../constants/designTokens';
import { AnimatedPet } from '../../components/AnimatedPet';
import { useOnboardingStore, PetColor } from '../../stores/onboardingStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const petColors: { id: PetColor; name: string; hex: string }[] = [
  { id: 'rose', name: 'Rose', hex: colors.primary.rose },
  { id: 'lavender', name: 'Lavender', hex: colors.primary.lavender },
  { id: 'sky', name: 'Sky', hex: colors.primary.sky },
  { id: 'mint', name: 'Mint', hex: colors.semantic.energy },
  { id: 'sunset', name: 'Sunset', hex: colors.semantic.hunger },
  { id: 'ocean', name: 'Ocean', hex: '#7EC8E3' },
];

const DELAY = 100;

export default function PetCustomizationScreen() {
  const { trigger } = useHapticFeedback();
  const {
    petSpecies,
    petColor,
    petName,
    displayName,
    setPetName,
    setDisplayName,
    setColor,
  } = useOnboardingStore();
  const [localPetName, setLocalPetName] = useState(petName);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [nameError, setNameError] = useState('');
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

  const handleColorSelect = (colorId: PetColor) => {
    trigger('medium');
    setColor(colorId);
  };

  const handlePetNameChange = (name: string) => {
    setLocalPetName(name);
    setNameError('');
    setPetName(name);
  };

  const validateAndContinue = () => {
    if (!localPetName.trim()) {
      setNameError('Please give your pet a name');
      trigger('error');
      return;
    }

    if (localPetName.length > 20) {
      setNameError('Name must be 20 characters or less');
      trigger('error');
      return;
    }

    if (!localDisplayName.trim()) {
      setNameError('Please enter your name');
      trigger('error');
      return;
    }

    trigger('success');
    router.push('/(auth)/signup');
  };

  const canContinue = localPetName.trim().length > 0 && localDisplayName.trim().length > 0;
  const characterCount = localPetName.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              Personalize Your Pet
            </Text>
            <Text style={styles.subtitle}>
              Give your companion a name and choose its style
            </Text>
          </View>

          {/* Live Preview */}
          <View style={styles.previewContainer}>
            <AnimatedPet
              species={petSpecies || 'dragon'}
              color={petColor || 'rose'}
              size={140}
              emotion="excited"
              testID="customization-preview-pet"
            />
          </View>

          {/* Pet Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Pet's Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={localPetName}
              onChangeText={handlePetNameChange}
              placeholder="e.g., Sparky"
              placeholderTextColor={colors.text.tertiary}
              maxLength={20}
              style={[
                styles.textInput,
                nameError ? styles.textInputError : null,
              ]}
              accessibilityLabel="Pet name input"
              accessibilityHint="Enter a name for your pet, maximum 20 characters"
            />
            <View style={styles.characterCountContainer}>
              <Text style={[
                styles.characterCount,
                characterCount >= 20 && styles.characterCountWarning
              ]}>
                {characterCount}/20
              </Text>
            </View>
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>

          {/* Your Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Your Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={localDisplayName}
              onChangeText={setLocalDisplayName}
              placeholder="e.g., Alex"
              placeholderTextColor={colors.text.tertiary}
              style={styles.textInput}
              accessibilityLabel="Your name input"
              accessibilityHint="Enter your display name"
            />
          </View>

          {/* Color Palette */}
          <View style={styles.colorSection}>
            <Text style={styles.sectionTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {petColors.map((color, index) => (
                <ColorOption
                  key={color.id}
                  color={color}
                  selected={petColor === color.id}
                  onPress={() => handleColorSelect(color.id)}
                  delay={DELAY * (index + 1)}
                />
              ))}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={validateAndContinue}
              disabled={!canContinue}
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Continue to sign up"
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
    </KeyboardAvoidingView>
  );
}

interface ColorOptionProps {
  color: { id: PetColor; name: string; hex: string };
  selected: boolean;
  onPress: () => void;
  delay: number;
}

const ColorOption: React.FC<ColorOptionProps> = ({ color, selected, onPress, delay }) => {
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
    scale.value = withSpring(0.9, motion.spring);
    trigger('light');
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring);
  };

  return (
    <Animated.View style={[styles.colorContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.colorButton, selected && styles.colorButtonSelected]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Select ${color.name} color`}
        accessibilityState={{ selected: selected }}
      >
        <View
          style={[
            styles.colorSwatch,
            { backgroundColor: color.hex },
            selected && styles.colorSwatchSelected,
          ]}
        />
        {selected && (
          <View style={styles.colorCheckmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
        <Text style={[styles.colorName, selected && styles.colorNameSelected]}>
          {color.name}
        </Text>
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
    marginBottom: spacing.lg,
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
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.primary.rose,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.scale[2],
    color: colors.text.primary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  textInputError: {
    borderColor: colors.primary.rose,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  characterCount: {
    fontSize: typography.scale[0],
    color: colors.text.tertiary,
  },
  characterCountWarning: {
    color: colors.primary.rose,
    fontWeight: typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: typography.scale[0],
    color: colors.primary.rose,
    marginTop: spacing.xs,
  },
  colorSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorContainer: {
    width: '31%',
    marginBottom: spacing.md,
  },
  colorButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  colorButtonSelected: {
    opacity: 1,
  },
  colorSwatch: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  colorSwatchSelected: {
    borderColor: colors.primary.rose,
    ...shadows.md,
  },
  colorCheckmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 8,
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
  colorName: {
    fontSize: typography.scale[1],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  colorNameSelected: {
    color: colors.primary.rose,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
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
