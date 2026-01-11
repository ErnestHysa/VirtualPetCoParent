/**
 * petService Tests
 *
 * Testing the PetService class which handles all pet-related operations with Supabase
 */

import { petService } from '@/services/petService';
import { supabase } from '@/lib/supabase';
import { Pet, PetSpecies, PetStage } from '@/types';

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn(),
  },
}));

describe('petService', () => {
  const mockCoupleId = 'couple-1';
  const mockPetId = 'pet-1';
  const mockUserId = 'user-1';

  const mockPetData = {
    id: mockPetId,
    couple_id: mockCoupleId,
    species: 'dragon' as PetSpecies,
    color: '#E8B4B8',
    name: 'Fluffy',
    current_stage: 'baby' as PetStage,
    hunger: 75,
    happiness: 60,
    energy: 80,
    personality_type: { playful: 25, calm: 25, mischievous: 25, affectionate: 25 },
    xp: 100,
    created_at: '2024-01-01T00:00:00Z',
    last_care_at: '2024-01-02T00:00:00Z',
  };

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  describe('createPet', () => {
    it('should create a new pet with initial stats', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPetData,
            error: null,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await petService.createPet(
        mockCoupleId,
        'dragon',
        '#E8B4B8',
        'Fluffy'
      );

      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(mockInsert).toHaveBeenCalledWith({
        couple_id: mockCoupleId,
        species: 'dragon',
        color: '#E8B4B8',
        name: 'Fluffy',
        current_stage: 'egg',
        hunger: 80,
        happiness: 80,
        energy: 80,
        personality_type: { playful: 25, calm: 25, mischievous: 25, affectionate: 25 },
        xp: 0,
      });
      expect(result).toEqual(mockPetData);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Database error');
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await expect(
        petService.createPet(mockCoupleId, 'dragon', '#E8B4B8', 'Fluffy')
      ).rejects.toThrow(mockError);
    });
  });

  describe('getPet', () => {
    it('should return pet data when found', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockPetData,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(mockEq).toHaveBeenCalledWith('id', mockPetId);
      expect(result).toEqual({
        id: mockPetId,
        coupleId: mockCoupleId,
        species: 'dragon',
        color: '#E8B4B8',
        name: 'Fluffy',
        currentStage: 'baby',
        stats: {
          hunger: 75,
          happiness: 60,
          energy: 80,
        },
        personality: { playful: 25, calm: 25, mischievous: 25, affectionate: 25 },
        dominantPersonality: expect.any(String),
        xp: 100,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        lastCareAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should return null when pet not found', async () => {
      const mockError = { code: 'PGRST116', message: 'No rows returned' };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result).toBeNull();
    });
  });

  describe('getPetByCouple', () => {
    it('should return pet by couple ID', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockPetData,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPetByCouple(mockCoupleId);

      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(mockEq).toHaveBeenCalledWith('couple_id', mockCoupleId);
      expect(result).toMatchObject({
        coupleId: mockCoupleId,
        name: 'Fluffy',
      });
    });

    it('should return null when no pet found for couple', async () => {
      const mockError = { code: 'PGRST116' };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPetByCouple(mockCoupleId);

      expect(result).toBeNull();
    });
  });

  describe('updatePetStats', () => {
    it('should update pet stats', async () => {
      const updatedStats = { hunger: 90, happiness: 85, energy: 95 };
      const mockEq = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPetData, ...updatedStats },
            error: null,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.updatePetStats(mockPetId, {
        hunger: 90,
        happiness: 85,
      });

      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(result?.stats.hunger).toBe(90);
      expect(result?.stats.happiness).toBe(85);
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      const mockEq = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      await expect(
        petService.updatePetStats(mockPetId, { hunger: 90 })
      ).rejects.toThrow(mockError);
    });
  });

  describe('performCareAction', () => {
    it('should call perform_care_action RPC function', async () => {
      const mockData = { success: true, new_stats: { hunger: 90 } };
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await petService.performCareAction(
        mockPetId,
        mockUserId,
        'feed'
      );

      expect(supabase.rpc).toHaveBeenCalledWith('perform_care_action', {
        pet_id: mockPetId,
        action_type: 'feed',
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC call fails', async () => {
      const mockError = new Error('RPC failed');
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        petService.performCareAction(mockPetId, mockUserId, 'feed')
      ).rejects.toThrow(mockError);
    });
  });

  describe('checkEvolution', () => {
    it('should call check_evolution RPC function', async () => {
      const mockData = { can_evolve: true, next_stage: 'child' };
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await petService.checkEvolution(mockPetId);

      expect(supabase.rpc).toHaveBeenCalledWith('check_evolution', {
        pet_id: mockPetId,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('evolvePet', () => {
    it('should update pet to new stage', async () => {
      const mockEq = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPetData, current_stage: 'child' },
            error: null,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.evolvePet(mockPetId, 'child');

      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(result?.currentStage).toBe('child');
    });
  });

  describe('subscribeToPetUpdates', () => {
    it('should subscribe to pet real-time updates', () => {
      const callback = jest.fn();
      const result = petService.subscribeToPetUpdates(mockPetId, callback);

      expect(supabase.channel).toHaveBeenCalledWith(`pet:${mockPetId}`);
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `id=eq.${mockPetId}`,
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should invoke callback with mapped pet data on update', () => {
      const callback = jest.fn();
      petService.subscribeToPetUpdates(mockPetId, callback);

      const onCallback = (mockChannel.on as jest.Mock).mock.calls[0][2];
      onCallback({ new: mockPetData });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockPetId,
          coupleId: mockCoupleId,
          name: 'Fluffy',
          stats: expect.any(Object),
        })
      );
    });
  });

  describe('getCareHistory', () => {
    it('should return care history with default limit', async () => {
      const mockHistory = [
        { id: '1', action_type: 'feed', timestamp: '2024-01-01T12:00:00Z' },
        { id: '2', action_type: 'play', timestamp: '2024-01-01T10:00:00Z' },
      ];
      const mockOrder = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: mockHistory,
          error: null,
        }),
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getCareHistory(mockPetId);

      expect(supabase.from).toHaveBeenCalledWith('care_actions');
      expect(mockEq).toHaveBeenCalledWith('pet_id', mockPetId);
      expect(mockOrder).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(result).toEqual(mockHistory);
    });

    it('should respect custom limit', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      await petService.getCareHistory(mockPetId, 100);

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed');
      const mockOrder = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      await expect(petService.getCareHistory(mockPetId)).rejects.toThrow(
        mockError
      );
    });
  });

  describe('getTodayCareActions', () => {
    it('should return care actions from today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockActions = [
        { id: '1', action_type: 'feed', timestamp: new Date().toISOString() },
      ];
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockActions,
        error: null,
      });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getTodayCareActions(mockPetId);

      expect(supabase.from).toHaveBeenCalledWith('care_actions');
      expect(mockEq).toHaveBeenCalledWith('pet_id', mockPetId);
      expect(mockGte).toHaveBeenCalledWith(
        'timestamp',
        today.toISOString()
      );
      expect(result).toEqual(mockActions);
    });
  });

  describe('calculateCareStreak', () => {
    it('should return 0 when no history', async () => {
      const mockOrder = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.calculateCareStreak(mockPetId);

      expect(result).toBe(0);
    });

    it('should calculate consecutive day streak', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockHistory = [
        { id: '1', timestamp: today.toISOString() },
        { id: '2', timestamp: yesterday.toISOString() },
        { id: '3', timestamp: twoDaysAgo.toISOString() },
      ];
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.calculateCareStreak(mockPetId);

      expect(result).toBeGreaterThanOrEqual(2);
    });

    it('should handle streak starting from yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      const twoDaysAgo = new Date(yesterday);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

      const mockHistory = [
        { id: '1', timestamp: yesterday.toISOString() },
        { id: '2', timestamp: twoDaysAgo.toISOString() },
      ];
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.calculateCareStreak(mockPetId);

      expect(result).toBeGreaterThanOrEqual(1);
    });
  });

  describe('mapToPet (private method)', () => {
    it('should map database row to Pet type correctly', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockPetData,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result).toMatchObject({
        id: mockPetId,
        coupleId: mockCoupleId,
        species: 'dragon',
        color: '#E8B4B8',
        name: 'Fluffy',
        currentStage: 'baby',
        stats: {
          hunger: 75,
          happiness: 60,
          energy: 80,
        },
        xp: 100,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.lastCareAt).toBeInstanceOf(Date);
    });

    it('should use default personality when null', async () => {
      const petWithoutPersonality = {
        ...mockPetData,
        personality_type: null,
      };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: petWithoutPersonality,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result?.personality).toEqual({
        playful: 25,
        calm: 25,
        mischievous: 25,
        affectionate: 25,
      });
      expect(result?.dominantPersonality).toBe('playful');
    });

    it('should handle missing last_care_at', async () => {
      const petWithoutLastCare = {
        ...mockPetData,
        last_care_at: null,
      };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: petWithoutLastCare,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result?.lastCareAt).toBeUndefined();
    });
  });

  describe('getDominantPersonality (private method)', () => {
    it('should identify playful as dominant', async () => {
      const petWithPlayfulDominant = {
        ...mockPetData,
        personality_type: {
          playful: 50,
          calm: 20,
          mischievous: 15,
          affectionate: 15,
        },
      };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: petWithPlayfulDominant,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result?.dominantPersonality).toBe('playful');
    });

    it('should identify mischievous as dominant', async () => {
      const petWithMischievousDominant = {
        ...mockPetData,
        personality_type: {
          playful: 10,
          calm: 20,
          mischievous: 60,
          affectionate: 10,
        },
      };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: petWithMischievousDominant,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result?.dominantPersonality).toBe('mischievous');
    });

    it('should default to playful when personality is null', async () => {
      const petWithNullPersonality = {
        ...mockPetData,
        personality_type: null,
      };
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: petWithNullPersonality,
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await petService.getPet(mockPetId);

      expect(result?.dominantPersonality).toBe('playful');
    });
  });
});
