/**
 * usePetStore Tests
 *
 * Testing the Zustand store for pet state management
 */

import { act, renderHook } from '@testing-library/react-native';
import { usePetStore } from '@/stores/usePetStore';
import { Pet, PetSpecies, PetStage } from '@/types';

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })),
    })),
    removeChannel: jest.fn(),
    removeAllChannels: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue({}),
    })),
  },
  petService: {
    createPet: jest.fn(),
    getPet: jest.fn(),
    getPetByCouple: jest.fn(),
    updatePetStats: jest.fn(),
    performCareAction: jest.fn(),
    checkEvolution: jest.fn(),
    evolvePet: jest.fn(),
    subscribeToPetUpdates: jest.fn(),
    getCareHistory: jest.fn(),
    getTodayCareActions: jest.fn(),
    calculateCareStreak: jest.fn(),
  },
}));

const createMockPet = (overrides?: Partial<Pet>): Pet => ({
  id: 'pet-1',
  coupleId: 'couple-1',
  species: 'dragon' as PetSpecies,
  color: '#E8B4B8',
  name: 'Fluffy',
  currentStage: 'baby' as PetStage,
  stats: {
    hunger: 75,
    happiness: 60,
    energy: 80,
  },
  personality: {
    playful: 25,
    calm: 25,
    mischievous: 25,
    affectionate: 25,
  },
  dominantPersonality: 'playful',
  xp: 100,
  createdAt: new Date('2024-01-01'),
  lastCareAt: new Date(),
  ...overrides,
});

describe('usePetStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    usePetStore.getState().setPet(null);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePetStore());

      expect(result.current.pet).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.careHistory).toEqual([]);
      expect(result.current.dailyCareCount).toBe(0);
    });
  });

  describe('setPet', () => {
    it('should set pet correctly', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.pet).toEqual(mockPet);
      expect(result.current.pet?.name).toBe('Fluffy');
      expect(result.current.pet?.species).toBe('dragon');
    });
  });

  describe('performCare', () => {
    it('should perform care action and update stats', async () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      const initialHunger = result.current.pet!.stats.hunger;

      const success = await act(async () => {
        return await result.current.performCare('feed');
      });

      expect(success).toBe(true);
      expect(result.current.pet?.stats.hunger).toBe(Math.min(100, initialHunger + 20));
      expect(result.current.careHistory).toContain('feed');
      expect(result.current.dailyCareCount).toBe(1);
    });

    it('should not perform care if pet is in egg stage', async () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({ currentStage: 'egg' as PetStage });

      act(() => {
        result.current.setPet(mockPet);
      });

      const canPerform = result.current.canPerformCare('feed');
      expect(canPerform).toBe(false);
    });

    it('should respect care cooldown', async () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      // First care action
      await act(async () => {
        await result.current.performCare('feed');
      });

      // Immediate second care action with same type should be blocked
      const canPerform = result.current.canPerformCare('feed');
      expect(canPerform).toBe(false);
    });
  });

  describe('updateStats', () => {
    it('should update individual stats', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      act(() => {
        result.current.updateStats({ hunger: 90 });
      });

      expect(result.current.pet?.stats.hunger).toBe(90);
      // Other stats should remain unchanged
      expect(result.current.pet?.stats.happiness).toBe(60);
      expect(result.current.pet?.stats.energy).toBe(80);
    });

    it('should clamp stats between 0 and 100', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      act(() => {
        result.current.updateStats({ hunger: 150 }); // Over 100
      });

      expect(result.current.pet?.stats.hunger).toBe(100);

      act(() => {
        result.current.updateStats({ hunger: -20 }); // Under 0
      });

      expect(result.current.pet?.stats.hunger).toBe(0);
    });
  });

  describe('decayStats', () => {
    it('should decay stats over time', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      act(() => {
        result.current.decayStats();
      });

      // Hunger should decay by 2 per hour * 2 hours = 4
      expect(result.current.pet?.stats.hunger).toBeLessThan(75);
      // But not below 0
      expect(result.current.pet?.stats.hunger).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updatePersonality', () => {
    it('should update personality based on care actions', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet();

      act(() => {
        result.current.setPet(mockPet);
      });

      act(() => {
        result.current.updatePersonality('play');
      });

      expect(result.current.pet?.personality.playful).toBe(27);
      expect(result.current.pet?.dominantPersonality).toBe('playful');
    });

    it('should correctly identify dominant personality', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        personality: {
          playful: 10,
          calm: 15,
          mischievous: 50, // Dominant
          affectionate: 25,
        },
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.pet?.dominantPersonality).toBe('mischievous');
    });
  });

  describe('getNeedsAttention', () => {
    it('should return true when stats are low', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        stats: {
          hunger: 20,
          happiness: 25,
          energy: 30,
        },
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.getNeedsAttention()).toBe(true);
    });

    it('should return false when pet is in egg stage', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        currentStage: 'egg' as PetStage,
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.getNeedsAttention()).toBe(false);
    });

    it('should return false when stats are healthy', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        stats: {
          hunger: 80,
          happiness: 85,
          energy: 90,
        },
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.getNeedsAttention()).toBe(false);
    });
  });

  describe('getMoodMessage', () => {
    it('should return correct mood messages', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        stats: {
          hunger: 90,
          happiness: 90,
          energy: 90,
        },
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.getMoodMessage()).toBe("I'm so happy! 🌟");
    });

    it('should return sad message when stats are very low', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        stats: {
          hunger: 10,
          happiness: 10,
          energy: 10,
        },
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.getMoodMessage()).toBe("I'm not feeling well at all...");
    });
  });

  describe('checkEvolution', () => {
    it('should return next stage when requirements met', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        currentStage: 'baby' as PetStage,
      });

      act(() => {
        result.current.setPet(mockPet);
        // Simulate high streak days
        usePetStore.setState({ streakDays: 14 });
      });

      const nextStage = result.current.checkEvolution();
      expect(nextStage).toBe('child');
    });

    it('should return null when already at max stage', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = createMockPet({
        currentStage: 'elder' as PetStage,
      });

      act(() => {
        result.current.setPet(mockPet);
      });

      const nextStage = result.current.checkEvolution();
      expect(nextStage).toBeNull();
    });
  });
});
