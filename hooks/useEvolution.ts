/**
 * useEvolution Hook
 * Custom hook for managing pet evolution state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { Pet, PetStage, CareAction, Milestone } from '../types';
import {
  checkEvolutionEligibility,
  triggerEvolution,
  getEvolutionProgress,
  checkAndCreateMilestones,
  getCoupleMilestones,
  EvolutionProgress,
  EvolutionRequirement,
  EvolutionResult,
} from '../services/evolutionService';

interface UseEvolutionResult {
  evolutionProgress: EvolutionProgress | null;
  eligibility: EvolutionRequirement | null;
  canEvolve: boolean;
  isEvolving: boolean;
  milestones: Milestone[];
  showCelebration: boolean;
  evolutionResult: EvolutionResult | null;
  checkEligibility: () => Promise<void>;
  evolvePet: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadMilestones: () => Promise<void>;
  dismissCelebration: () => void;
  checkNewMilestones: () => Promise<void>;
}

export const useEvolution = (
  pet: Pet | null,
  careHistory: CareAction[] = []
): UseEvolutionResult => {
  const [evolutionProgress, setEvolutionProgress] = useState<EvolutionProgress | null>(null);
  const [eligibility, setEligibility] = useState<EvolutionRequirement | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<EvolutionResult | null>(null);

  const canEvolve = eligibility?.isEligible ?? false;

  // Check evolution eligibility
  const checkEligibility = useCallback(async () => {
    if (!pet) return;

    try {
      const [eligibilityData, progressData] = await Promise.all([
        checkEvolutionEligibility(pet, careHistory),
        getEvolutionProgress(pet, careHistory),
      ]);

      setEligibility(eligibilityData);
      setEvolutionProgress(progressData);
    } catch (error) {
      console.error('Error checking evolution eligibility:', error);
    }
  }, [pet, careHistory]);

  // Load evolution progress
  const loadProgress = useCallback(async () => {
    if (!pet) return;

    try {
      const progress = await getEvolutionProgress(pet, careHistory);
      setEvolutionProgress(progress);
    } catch (error) {
      console.error('Error loading evolution progress:', error);
    }
  }, [pet, careHistory]);

  // Load milestones
  const loadMilestones = useCallback(async () => {
    if (!pet) return;

    try {
      const milestoneData = await getCoupleMilestones(pet.couple_id);
      setMilestones(milestoneData);
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  }, [pet]);

  // Check for new milestones
  const checkNewMilestones = useCallback(async () => {
    if (!pet) return;

    try {
      const newMilestones = await checkAndCreateMilestones(pet, careHistory);
      if (newMilestones.length > 0) {
        // Refresh milestones list
        await loadMilestones();
        return newMilestones;
      }
      return [];
    } catch (error) {
      console.error('Error checking new milestones:', error);
      return [];
    }
  }, [pet, careHistory, loadMilestones]);

  // Evolve pet
  const evolvePet = useCallback(async () => {
    if (!pet || !eligibility?.isEligible || isEvolving) return;

    setIsEvolving(true);

    try {
      const nextStage = evolutionProgress?.nextStage;
      if (!nextStage) {
        console.warn('No next stage available');
        setIsEvolving(false);
        return;
      }

      const result = await triggerEvolution(pet.id, nextStage);

      if (result.success) {
        setEvolutionResult(result);
        setShowCelebration(true);

        // Check for new milestones after evolution
        await checkNewMilestones();
      } else {
        console.error('Evolution failed:', result.error);
      }
    } catch (error) {
      console.error('Error evolving pet:', error);
    } finally {
      setIsEvolving(false);
    }
  }, [pet, eligibility, evolutionProgress, isEvolving, checkNewMilestones]);

  // Dismiss celebration
  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setEvolutionResult(null);
    // Reload progress after evolution
    loadProgress();
    checkEligibility();
  }, [loadProgress, checkEligibility]);

  // Initial load
  useEffect(() => {
    if (pet) {
      checkEligibility();
      loadMilestones();
    }
  }, [pet, careHistory, checkEligibility, loadMilestones]);

  return {
    evolutionProgress,
    eligibility,
    canEvolve,
    isEvolving,
    milestones,
    showCelebration,
    evolutionResult,
    checkEligibility,
    evolvePet,
    loadProgress,
    loadMilestones,
    dismissCelebration,
    checkNewMilestones,
  };
};
