/**
 * EvolutionDemo Component
 * Example implementation of the evolution system
 * This demonstrates how to integrate all evolution components together
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/designTokens';
import { Pet, PetStage, CareAction } from '../../types';
import { useEvolution } from '../../hooks/useEvolution';
import EvolutionProgressCard from './EvolutionProgressCard';
import EvolutionCelebration from './EvolutionCelebration';
import MilestoneTracker from './MilestoneTracker';
import Button from '../ui/Button';

export interface EvolutionDemoProps {
  pet: Pet;
  careHistory: CareAction[];
}

const EvolutionDemo: React.FC<EvolutionDemoProps> = ({ pet, careHistory }) => {
  const {
    evolutionProgress,
    eligibility,
    canEvolve,
    isEvolving,
    milestones,
    showCelebration,
    evolutionResult,
    checkEligibility,
    evolvePet,
    loadMilestones,
    dismissCelebration,
    checkNewMilestones,
  } = useEvolution(pet, careHistory);

  const [newMilestonesCount, setNewMilestonesCount] = useState(0);

  useEffect(() => {
    // Check for new milestones when care history changes
    const checkMilestones = async () => {
      const newMilestones = await checkNewMilestones();
      setNewMilestonesCount(newMilestones.length);
    };

    checkMilestones();
  }, [careHistory, checkNewMilestones]);

  if (!pet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.rose} />
        <Text style={styles.loadingText}>Loading pet data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Evolution Progress Card */}
        {evolutionProgress && (
          <EvolutionProgressCard
            progress={evolutionProgress}
            petName={pet.name}
          />
        )}

        {/* New Milestones Notification */}
        {newMilestonesCount > 0 && (
          <View style={styles.newMilestonesBanner}>
            <Text style={styles.newMilestonesText}>
              🎉 You unlocked {newMilestonesCount} new milestone{newMilestonesCount > 1 ? 's' : ''}!
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={canEvolve ? 'Evolve Now!' : 'Check Progress'}
            variant={canEvolve ? 'primary' : 'secondary'}
            size="lg"
            onPress={canEvolve ? evolvePet : checkEligibility}
            loading={isEvolving}
            disabled={!canEvolve}
            fullWidth
            style={styles.evolveButton}
          />

          {!canEvolve && eligibility && (
            <Text style={styles.hintText}>
              Care for your pet for {eligibility.requiredStreakDays - eligibility.currentStreakDays} more days to evolve
            </Text>
          )}
        </View>

        {/* Milestone Tracker */}
        <View style={styles.milestoneSection}>
          <MilestoneTracker
            coupleId={pet.couple_id}
            milestones={milestones}
            onMilestonePress={(milestone) => {
              console.log('Milestone pressed:', milestone);
              // Navigate to milestone detail or show modal
            }}
          />
        </View>
      </ScrollView>

      {/* Evolution Celebration Modal */}
      <EvolutionCelebration
        visible={showCelebration}
        petName={pet.name}
        previousStage={evolutionResult?.previousStage || PetStage.EGG}
        newStage={evolutionResult?.newStage || PetStage.BABY}
        onAnimationComplete={dismissCelebration}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  evolveButton: {
    marginBottom: spacing.sm,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  milestoneSection: {
    flex: 1,
    marginTop: spacing.md,
  },
  newMilestonesBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary.rose + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.rose,
  },
  newMilestonesText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.rose,
  },
});

export default EvolutionDemo;
