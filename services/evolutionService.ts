/**
 * Evolution Service for Virtual Pet Co-Parent
 * Handles pet evolution logic, eligibility checking, and milestone tracking
 */

import { Pet, PetStage, CareAction, Milestone } from '../types';
import { supabase } from '../supabase/client';

// ==================== TYPES ====================

export interface EvolutionRequirement {
  stage: PetStage;
  currentStreakDays: number;
  requiredStreakDays: number;
  progressPercent: number;
  isEligible: boolean;
}

export interface EvolutionProgress {
  currentStage: PetStage;
  nextStage: PetStage | null;
  currentStreakDays: number;
  daysUntilNextEvolution: number;
  progressPercent: number;
  canEvolve: boolean;
  hasReachedMaxStage: boolean;
}

export interface EvolutionResult {
  success: boolean;
  previousStage: PetStage;
  newStage: PetStage;
  milestone?: Milestone;
  error?: string;
}

export interface CareStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCareDate: string | null;
  streakHistory: { date: string; actions: number }[];
}

// ==================== CONSTANTS ====================

export const EVOLUTION_REQUIREMENTS: Record<PetStage, { daysRequired: number; nextStage: PetStage | null }> = {
  [PetStage.EGG]: { daysRequired: 0, nextStage: PetStage.BABY },
  [PetStage.BABY]: { daysRequired: 3, nextStage: PetStage.CHILD },
  [PetStage.CHILD]: { daysRequired: 14, nextStage: PetStage.TEEN },
  [PetStage.TEEN]: { daysRequired: 30, nextStage: PetStage.ADULT },
  [PetStage.ADULT]: { daysRequired: 60, nextStage: PetStage.ELDER },
  [PetStage.ELDER]: { daysRequired: 100, nextStage: null },
};

export const STAGE_DISPLAY_NAMES: Record<PetStage, string> = {
  [PetStage.EGG]: 'Egg',
  [PetStage.BABY]: 'Baby',
  [PetStage.CHILD]: 'Child',
  [PetStage.TEEN]: 'Teen',
  [PetStage.ADULT]: 'Adult',
  [PetStage.ELDER]: 'Elder',
};

export const STAGE_EMOJIS: Record<PetStage, string> = {
  [PetStage.EGG]: '🥚',
  [PetStage.BABY]: '👶',
  [PetStage.CHILD]: '🧒',
  [PetStage.TEEN]: '🧑',
  [PetStage.ADULT]: '👨',
  [PetStage.ELDER]: '🧓',
};

// ==================== CARE STREAK CALCULATION ====================

/**
 * Calculate current care streak from care history
 * A streak day counts if at least one care action was performed
 */
export const calculateCareStreak = (careHistory: CareAction[]): CareStreakInfo => {
  if (careHistory.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCareDate: null,
      streakHistory: [],
    };
  }

  // Group actions by date
  const actionsByDate = new Map<string, number>();
  careHistory.forEach((action) => {
    const date = new Date(action.created_at).toISOString().split('T')[0];
    actionsByDate.set(date, (actionsByDate.get(date) || 0) + 1);
  });

  // Sort dates
  const sortedDates = Array.from(actionsByDate.keys()).sort();
  const streakHistory = sortedDates.map((date) => ({
    date,
    actions: actionsByDate.get(date)!,
  }));

  // Calculate current streak
  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check backwards from today
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = sortedDates[i];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - (sortedDates.length - 1 - i));
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (date === expectedDateStr) {
      tempStreak++;
    } else {
      tempStreak = 0;
    }

    if (i === sortedDates.length - 1 || date === expectedDateStr) {
      if (i === sortedDates.length - 1) {
        currentStreak = tempStreak;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // If no action today, check if yesterday had action
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (sortedDates[sortedDates.length - 1] !== today && sortedDates[sortedDates.length - 1] !== yesterdayStr) {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    lastCareDate: sortedDates[sortedDates.length - 1] || null,
    streakHistory,
  };
};

// ==================== EVOLUTION ELIGIBILITY ====================

/**
 * Check if a pet is eligible for evolution
 */
export const checkEvolutionEligibility = async (
  pet: Pet,
  careHistory: CareAction[]
): Promise<EvolutionRequirement> => {
  const streakInfo = calculateCareStreak(careHistory);
  const currentRequirement = EVOLUTION_REQUIREMENTS[pet.stage];

  if (!currentRequirement.nextStage) {
    return {
      stage: pet.stage,
      currentStreakDays: streakInfo.currentStreak,
      requiredStreakDays: currentRequirement.daysRequired,
      progressPercent: 100,
      isEligible: false,
    };
  }

  const progressPercent = Math.min(
    (streakInfo.currentStreak / currentRequirement.daysRequired) * 100,
    100
  );

  return {
    stage: pet.stage,
    currentStreakDays: streakInfo.currentStreak,
    requiredStreakDays: currentRequirement.daysRequired,
    progressPercent,
    isEligible: streakInfo.currentStreak >= currentRequirement.daysRequired,
  };
};

// ==================== EVOLUTION PROGRESS ====================

/**
 * Get detailed evolution progress for a pet
 */
export const getEvolutionProgress = async (pet: Pet, careHistory: CareAction[]): Promise<EvolutionProgress> => {
  const streakInfo = calculateCareStreak(careHistory);
  const currentRequirement = EVOLUTION_REQUIREMENTS[pet.stage];
  const hasReachedMaxStage = currentRequirement.nextStage === null;

  if (hasReachedMaxStage) {
    return {
      currentStage: pet.stage,
      nextStage: null,
      currentStreakDays: streakInfo.currentStreak,
      daysUntilNextEvolution: 0,
      progressPercent: 100,
      canEvolve: false,
      hasReachedMaxStage: true,
    };
  }

  const daysUntil = Math.max(0, currentRequirement.daysRequired - streakInfo.currentStreak);
  const progressPercent = Math.min(
    (streakInfo.currentStreak / currentRequirement.daysRequired) * 100,
    100
  );

  return {
    currentStage: pet.stage,
    nextStage: currentRequirement.nextStage,
    currentStreakDays: streakInfo.currentStreak,
    daysUntilNextEvolution: daysUntil,
    progressPercent,
    canEvolve: streakInfo.currentStreak >= currentRequirement.daysRequired,
    hasReachedMaxStage: false,
  };
};

// ==================== TRIGGER EVOLUTION ====================

/**
 * Trigger evolution for a pet
 */
export const triggerEvolution = async (petId: string, newStage: PetStage): Promise<EvolutionResult> => {
  try {
    // Fetch current pet data
    const { data: pet, error: fetchError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (fetchError || !pet) {
      return {
        success: false,
        previousStage: PetStage.EGG,
        newStage,
        error: 'Pet not found',
      };
    }

    const previousStage = pet.stage;

    // Update pet stage
    const { error: updateError } = await supabase
      .from('pets')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', petId);

    if (updateError) {
      return {
        success: false,
        previousStage,
        newStage,
        error: updateError.message,
      };
    }

    // Create milestone record
    const milestoneTitle = `${STAGE_DISPLAY_NAMES[newStage]} Stage`;
    const milestoneDescription = `${pet.name} evolved to ${STAGE_DISPLAY_NAMES[newStage]}!`;

    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .insert({
        couple_id: pet.couple_id,
        title: milestoneTitle,
        description: milestoneDescription,
        icon: STAGE_EMOJIS[newStage],
        achieved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (milestoneError) {
      console.warn('Failed to create milestone:', milestoneError.message);
    }

    return {
      success: true,
      previousStage,
      newStage,
      milestone: milestone || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      previousStage: PetStage.EGG,
      newStage,
      error: error.message || 'Unknown error occurred',
    };
  }
};

// ==================== MILESTONE TRACKING ====================

export interface MilestoneType {
  id: string;
  title: string;
  description: string;
  icon: string;
  checkEligibility: (pet: Pet, careHistory: CareAction[], coupleData?: any) => boolean;
}

export const MILESTONE_TYPES: MilestoneType[] = [
  {
    id: 'first_care',
    title: 'First Care',
    description: 'Performed your first care action',
    icon: '💝',
    checkEligibility: (pet, careHistory) => careHistory.length >= 1,
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Cared for your pet for 3 days in a row',
    icon: '🔥',
    checkEligibility: (pet, careHistory) => calculateCareStreak(careHistory).currentStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Cared for your pet for 7 days in a row',
    icon: '⭐',
    checkEligibility: (pet, careHistory) => calculateCareStreak(careHistory).currentStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Cared for your pet for 30 days in a row',
    icon: '👑',
    checkEligibility: (pet, careHistory) => calculateCareStreak(careHistory).currentStreak >= 30,
  },
  {
    id: 'first_evolution',
    title: 'First Evolution',
    description: 'Your pet evolved for the first time',
    icon: '✨',
    checkEligibility: (pet) => pet.stage !== PetStage.EGG,
  },
  {
    id: 'max_stage',
    title: 'Fully Grown',
    description: 'Your pet reached its final stage',
    icon: '🏆',
    checkEligibility: (pet) => pet.stage === PetStage.ELDER,
  },
  {
    id: 'first_video_call',
    title: 'Video Call',
    description: 'Had your first video call together',
    icon: '📹',
    checkEligibility: (_pet, _careHistory, coupleData) => {
      return coupleData?.videoCallsCompleted > 0;
    },
  },
  {
    id: 'distance_traveled',
    title: 'World Traveler',
    description: 'Traveled 1000 virtual miles together',
    icon: '🌍',
    checkEligibility: (_pet, _careHistory, coupleData) => {
      return coupleData?.distanceTraveled >= 1000;
    },
  },
  {
    id: 'anniversary_7',
    title: 'One Week Together',
    description: 'Celebrated one week as co-parents',
    icon: '💑',
    checkEligibility: (_pet, _careHistory, coupleData) => {
      return coupleData?.daysTogether >= 7;
    },
  },
  {
    id: 'anniversary_30',
    title: 'One Month Together',
    description: 'Celebrated one month as co-parents',
    icon: '💕',
    checkEligibility: (_pet, _careHistory, coupleData) => {
      return coupleData?.daysTogether >= 30;
    },
  },
];

/**
 * Check for new milestones and create them
 */
export const checkAndCreateMilestones = async (
  pet: Pet,
  careHistory: CareAction[],
  coupleData?: any
): Promise<Milestone[]> => {
  const newMilestones: Milestone[] = [];

  // Get existing milestones for this couple
  const { data: existingMilestones } = await supabase
    .from('milestones')
    .select('title')
    .eq('couple_id', pet.couple_id);

  const existingTitles = new Set(existingMilestones?.map((m) => m.title) || []);

  // Check each milestone type
  for (const milestoneType of MILESTONE_TYPES) {
    // Skip if already achieved
    if (existingTitles.has(milestoneType.title)) {
      continue;
    }

    // Check eligibility
    if (milestoneType.checkEligibility(pet, careHistory, coupleData)) {
      const { data: milestone, error } = await supabase
        .from('milestones')
        .insert({
          couple_id: pet.couple_id,
          title: milestoneType.title,
          description: milestoneType.description,
          icon: milestoneType.icon,
          achieved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && milestone) {
        newMilestones.push(milestone);
      }
    }
  }

  return newMilestones;
};

/**
 * Get all milestones for a couple
 */
export const getCoupleMilestones = async (coupleId: string): Promise<Milestone[]> => {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('couple_id', coupleId)
    .order('achieved_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
};

/**
 * Calculate milestone completion percentage
 */
export const getMilestoneProgress = async (coupleId: string): Promise<{ completed: number; total: number; percent: number }> => {
  const milestones = await getCoupleMilestones(coupleId);
  const completed = milestones.length;
  const total = MILESTONE_TYPES.length;
  const percent = Math.round((completed / total) * 100);

  return { completed, total, percent };
};
