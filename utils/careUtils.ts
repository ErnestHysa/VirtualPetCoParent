/**
 * Care Utility Functions
 *
 * Helper functions for pet care calculations, stat management, and evolution
 */

export type StatType = 'hunger' | 'happiness' | 'energy' | 'cleanliness';
export type StatStatus = 'critical' | 'low' | 'moderate' | 'healthy';
export type EvolutionStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';
export type CareAction = 'feed' | 'play' | 'walk' | 'pet' | 'groom' | 'train' | 'sleep' | 'bath';

/**
 * Decay rates per hour for each stat type
 */
const DECAY_RATES: Record<StatType, number> = {
  hunger: 5,      // 5 points per hour
  happiness: 3,   // 3 points per hour
  energy: 4,      // 4 points per hour
  cleanliness: 2, // 2 points per hour
};

/**
 * Base XP awarded for each care action
 */
const BASE_XP: Record<CareAction, number> = {
  feed: 10,
  play: 15,
  walk: 12,
  pet: 5,
  groom: 8,
  train: 20,
  sleep: 5,
  bath: 10,
};

/**
 * XP thresholds for each level
 */
const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 3500];

/**
 * Calculate how much a stat has decayed since last care
 * @param stat The stat type to calculate decay for
 * @param lastCareTime ISO string of last care action
 * @param currentValue Current value of the stat (0-100)
 * @returns The amount the stat has decayed
 */
export function calculateStatDecay(
  stat: StatType,
  lastCareTime: string,
  currentValue: number
): number {
  const now = Date.now();
  const lastCare = new Date(lastCareTime).getTime();
  const hoursSinceCare = (now - lastCare) / (1000 * 60 * 60);

  if (hoursSinceCare < 0) return 0;

  const decayRate = DECAY_RATES[stat];
  const decayAmount = Math.min(hoursSinceCare * decayRate, currentValue);

  return Math.max(0, Math.round(decayAmount));
}

/**
 * Get the status of a stat based on its value
 * @param value The stat value (0-100)
 * @returns The status category
 */
export function getStatStatus(value: number): StatStatus {
  if (value <= 25) return 'critical';
  if (value <= 50) return 'low';
  if (value <= 75) return 'moderate';
  return 'healthy';
}

/**
 * Calculate XP awarded for a care action
 * @param action The care action performed
 * @param currentStatValue The current value of the related stat (0-100)
 * @param combo The number of consecutive care actions
 * @returns The XP awarded
 */
export function getCareXP(
  action: CareAction,
  currentStatValue = 50,
  combo = 0
): number {
  const baseXP = BASE_XP[action] || 0;
  if (baseXP === 0) return 0;

  // Bonus XP for caring when stats are low
  let urgentCareBonus = 0;
  if (currentStatValue < 25) {
    urgentCareBonus = Math.floor(baseXP * 0.5); // 50% bonus
  } else if (currentStatValue < 50) {
    urgentCareBonus = Math.floor(baseXP * 0.25); // 25% bonus
  }

  // Combo bonus
  let comboBonus = 0;
  if (combo >= 3) {
    comboBonus = Math.min(combo * 2, 20); // Max 20 bonus from combo
  }

  return baseXP + urgentCareBonus + comboBonus;
}

/**
 * Calculate evolution progress for current level
 * @param level Current level
 * @param currentXP Total accumulated XP
 * @returns Progress from 0 to 1
 */
export function getEvolutionProgress(level: number, currentXP: number): number {
  const levelIndex = Math.min(level - 1, LEVEL_THRESHOLDS.length - 1);
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] || currentThreshold * 2;

  const progressInLevel = currentXP - currentThreshold;
  const totalNeededForLevel = nextThreshold - currentThreshold;

  if (totalNeededForLevel <= 0) return 1;

  return Math.min(1, Math.max(0, progressInLevel / totalNeededForLevel));
}

/**
 * Get the next evolution stage
 * @param currentStage Current evolution stage
 * @returns Next stage or null if maxed out
 */
export function getNextEvolutionStage(
  currentStage: EvolutionStage
): EvolutionStage | null {
  const stages: EvolutionStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentIndex = stages.indexOf(currentStage);

  if (currentIndex === -1) return 'baby';
  if (currentIndex >= stages.length - 1) return null;

  return stages[currentIndex + 1];
}

/**
 * Check if a pet can evolve to the next stage
 * @param level Current level
 * @param currentXP Total accumulated XP
 * @param currentStage Current evolution stage
 * @returns Whether evolution is possible
 */
export function canEvolve(
  level: number,
  currentXP: number,
  currentStage: EvolutionStage
): boolean {
  const progress = getEvolutionProgress(level, currentXP);
  return progress >= 1 && getNextEvolutionStage(currentStage) !== null;
}

/**
 * Get the XP threshold for a specific level
 * @param level The level to get threshold for
 * @returns XP needed to reach the level
 */
export function getLevelThreshold(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] || 0;
}

/**
 * Get the required care actions based on current pet stats
 * @param stats Current pet stats
 * @returns Array of needed care actions
 */
export function getNeededCareActions(stats: {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
}): CareAction[] {
  const needed: CareAction[] = [];

  if (stats.hunger < 50) needed.push('feed');
  if (stats.happiness < 50) needed.push('play');
  if (stats.energy < 30) needed.push('sleep');
  if (stats.cleanliness < 50) needed.push('groom');

  return needed;
}
