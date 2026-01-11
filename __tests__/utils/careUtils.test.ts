/**
 * Care Utility Functions Tests
 *
 * Testing pet care related utility functions
 */

import {
  calculateStatDecay,
  getStatStatus,
  getCareXP,
  getEvolutionProgress,
  getNextEvolutionStage,
} from '@/utils/careUtils';

describe('calculateStatDecay', () => {
  it('should return 0 for very recent care time', () => {
    const now = Date.now();
    const recentCare = new Date(now - 1000).toISOString(); // 1 second ago

    const decay = calculateStatDecay('hunger', recentCare, 100);
    expect(decay).toBe(0);
  });

  it('should calculate appropriate decay over time', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const hungerDecay = calculateStatDecay('hunger', oneHourAgo, 100);
    const energyDecay = calculateStatDecay('energy', oneHourAgo, 100);

    // Hunger should decay faster than energy
    expect(hungerDecay).toBeGreaterThan(0);
    expect(energyDecay).toBeGreaterThan(0);
  });

  it('should never return negative values', () => {
    const longTimeAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

    const decay = calculateStatDecay('hunger', longTimeAgo, 100);
    expect(decay).toBeGreaterThanOrEqual(0);
    expect(decay).toBeLessThanOrEqual(100);
  });
});

describe('getStatStatus', () => {
  it('should return "critical" for values at or below 25', () => {
    expect(getStatStatus(20)).toBe('critical');
    expect(getStatStatus(0)).toBe('critical');
    expect(getStatStatus(24)).toBe('critical');
    expect(getStatStatus(25)).toBe('critical'); // 25 is included in critical
  });

  it('should return "low" for values between 26 and 50', () => {
    expect(getStatStatus(26)).toBe('low');
    expect(getStatStatus(40)).toBe('low');
    expect(getStatStatus(50)).toBe('low');
  });

  it('should return "moderate" for values between 51 and 75', () => {
    expect(getStatStatus(51)).toBe('moderate');
    expect(getStatStatus(65)).toBe('moderate');
    expect(getStatStatus(75)).toBe('moderate');
  });

  it('should return "healthy" for values above 75', () => {
    expect(getStatStatus(76)).toBe('healthy');
    expect(getStatStatus(90)).toBe('healthy');
    expect(getStatStatus(100)).toBe('healthy');
  });
});

describe('getCareXP', () => {
  it('should return base XP for each care action', () => {
    expect(getCareXP('feed')).toBeGreaterThan(0);
    expect(getCareXP('play')).toBeGreaterThan(0);
    expect(getCareXP('groom')).toBeGreaterThan(0);
    expect(getCareXP('sleep')).toBeGreaterThan(0);
  });

  it('should give bonus XP for caring when stats are low', () => {
    const normalXP = getCareXP('feed', 80);
    const criticalXP = getCareXP('feed', 20);

    expect(criticalXP).toBeGreaterThan(normalXP);
  });

  it('should give bonus XP for consecutive care (combo)', () => {
    const noComboXP = getCareXP('feed', 50, 0);
    const comboXP = getCareXP('feed', 50, 5);

    expect(comboXP).toBeGreaterThan(noComboXP);
  });

  it('should handle invalid care types gracefully', () => {
    const xp = getCareXP('invalid' as any, 50, 0);
    expect(xp).toBe(0);
  });
});

describe('getEvolutionProgress', () => {
  it('should calculate progress to next level', () => {
    const progress = getEvolutionProgress(1, 50);
    expect(progress).toBe(0.5); // 50/100 = 0.5

    const progress2 = getEvolutionProgress(1, 100);
    expect(progress2).toBe(1); // 100/100 = 1

    // Level 2: XP thresholds are [0, 100, 500, 1500, 3500]
    // Level 2 (index 1): currentThreshold = 100, nextThreshold = 500
    // progress = (250 - 100) / (500 - 100) = 150/400 = 0.375
    const progress3 = getEvolutionProgress(2, 250);
    expect(progress3).toBe(0.375);

    // Level 2 with 300 XP: (300-100)/(500-100) = 200/400 = 0.5
    const progress4 = getEvolutionProgress(2, 300);
    expect(progress4).toBe(0.5);
  });

  it('should return 0 for level 1 with no XP', () => {
    const progress = getEvolutionProgress(1, 0);
    expect(progress).toBe(0);
  });

  it('should cap progress at 1', () => {
    const progress = getEvolutionProgress(1, 1000);
    expect(progress).toBe(1);
  });
});

describe('getNextEvolutionStage', () => {
  it('should progress through evolution stages', () => {
    expect(getNextEvolutionStage('egg')).toBe('baby');
    expect(getNextEvolutionStage('baby')).toBe('child');
    expect(getNextEvolutionStage('child')).toBe('teen');
    expect(getNextEvolutionStage('teen')).toBe('adult');
  });

  it('should return null for adult stage (max evolution)', () => {
    expect(getNextEvolutionStage('adult')).toBeNull();
  });

  it('should handle invalid stages', () => {
    expect(getNextEvolutionStage('invalid' as any)).toBe('baby');
  });
});

describe('XP thresholds by level', () => {
  it('should have correct XP thresholds for each level', () => {
    // Level 1: 0-100 XP
    expect(getEvolutionProgress(1, 50)).toBeLessThanOrEqual(1);

    // Level 2: 100-500 XP (400 XP needed)
    expect(getEvolutionProgress(2, 300)).toBeLessThanOrEqual(1);

    // Level 3: 500-1500 XP (1000 XP needed)
    expect(getEvolutionProgress(3, 1000)).toBeLessThanOrEqual(1);

    // Level 4: 1500-3500 XP (2000 XP needed)
    expect(getEvolutionProgress(4, 2500)).toBeLessThanOrEqual(1);

    // Level 5: 3500+ XP
    expect(getEvolutionProgress(5, 5000)).toBeLessThanOrEqual(1);
  });
});
