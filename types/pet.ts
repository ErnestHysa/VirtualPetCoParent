/**
 * Pet species types available for adoption
 */
export type PetSpecies = 'dragon' | 'cat' | 'fox' | 'puppy';

/**
 * Pet evolution stages
 */
export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';

/**
 * Pet personality traits
 */
export type PersonalityType = 'playful' | 'calm' | 'mischievous' | 'affectionate';

/**
 * Pet stats (0-100 scale)
 */
export interface PetStats {
  hunger: number;      // 100 = full, 0 = starving
  happiness: number;   // 100 = elated, 0 = depressed
  energy: number;      // 100 = energetic, 0 = exhausted
}

/**
 * Personality trait values
 */
export interface PersonalityTraits {
  playful: number;
  calm: number;
  mischievous: number;
  affectionate: number;
}

/**
 * Care action types
 */
export type CareActionType = 'feed' | 'play' | 'walk' | 'pet' | 'groom';

/**
 * Full pet data structure
 */
export interface Pet {
  id: string;
  coupleId: string;
  species: PetSpecies;
  color: string;
  name: string;
  currentStage: PetStage;
  stats: PetStats;
  personality: PersonalityTraits;
  dominantPersonality: PersonalityType;
  xp: number;
  createdAt: Date;
  lastCareAt?: Date;
}

/**
 * Care action record
 */
export interface CareAction {
  id: string;
  petId: string;
  userId: string;
  actionType: CareActionType;
  timestamp: Date;
  bonusPoints: number;
}

/**
 * Pet evolution milestone
 */
export interface EvolutionMilestone {
  id: string;
  coupleId: string;
  milestoneType: string;
  achievedAt: Date;
  evolutionUnlocked: PetStage;
}

/**
 * XP required for each evolution stage
 */
export const STAGE_XP_REQUIREMENTS: Record<PetStage, number> = {
  egg: 0,
  baby: 100,
  child: 500,
  teen: 1500,
  adult: 3500,
  elder: 7000,
};

/**
 * Days required for evolution stages (consecutive care)
 */
export const STAGE_DAY_REQUIREMENTS: Record<PetStage, number> = {
  egg: 0,
  baby: 3,
  child: 14,
  teen: 30,
  adult: 60,
  elder: 100,
};
