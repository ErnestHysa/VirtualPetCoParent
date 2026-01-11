/**
 * authService Tests
 *
 * Testing the AuthService class which handles authentication and partner pairing
 */

import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { UserProfile, Couple } from '@/types';

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
  authHelpers: {},
}));

// Mock generatePairingCode utility
jest.mock('@/lib/utils', () => ({
  generatePairingCode: jest.fn(() => 'ABCD1234'),
}));

describe('authService', () => {
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockUsername = 'testuser';
  const mockUserId = 'user-1';
  const mockPartnerId = 'user-2';
  const mockCoupleId = 'couple-1';
  const mockPetId = 'pet-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user and create profile', async () => {
      const mockUserData = {
        user: { id: mockUserId, email: mockEmail },
        session: { access_token: 'token' },
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await authService.signUp(mockEmail, mockPassword, mockUsername);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
        options: { data: { username: mockUsername } },
      });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUserId,
        username: mockUsername,
      });
      expect(result).toEqual(mockUserData);
    });

    it('should throw error when sign up fails', async () => {
      const mockError = new Error('Invalid email');

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authService.signUp(mockEmail, mockPassword, mockUsername)
      ).rejects.toThrow(mockError);
    });

    it('should throw error when profile creation fails', async () => {
      const mockError = new Error('Profile creation failed');

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId }, session: null },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: mockError });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await expect(
        authService.signUp(mockEmail, mockPassword, mockUsername)
      ).rejects.toThrow(mockError);
    });

    it('should not create profile when user is null', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await authService.signUp(mockEmail, mockPassword, mockUsername);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.user).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const mockSessionData = {
        user: { id: mockUserId, email: mockEmail },
        session: { access_token: 'token' },
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      const result = await authService.signIn(mockEmail, mockPassword);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
      });
      expect(result).toEqual(mockSessionData);
    });

    it('should throw error when sign in fails', async () => {
      const mockError = new Error('Invalid credentials');

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(authService.signIn(mockEmail, mockPassword)).rejects.toThrow(
        mockError
      );
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: mockError });

      await expect(authService.signOut()).rejects.toThrow(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: mockUserId, email: mockEmail };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should throw error when getting user fails', async () => {
      const mockError = new Error('Not authenticated');
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(authService.getCurrentUser()).rejects.toThrow(mockError);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfileData = {
        id: mockUserId,
        username: mockUsername,
        partner_id: mockPartnerId,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfileData,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.getProfile(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('id', mockUserId);
      expect(result).toEqual({
        id: mockUserId,
        email: '',
        username: mockUsername,
        partnerId: mockPartnerId,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should return null when profile not found', async () => {
      const mockError = { code: 'PGRST116' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.getProfile(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = { username: 'newusername' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: mockUserId, ...updates },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: mockEq, select: jest.fn().mockReturnValue({ single: mockSingle }) }),
      });

      const result = await authService.updateProfile(mockUserId, updates);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual({ id: mockUserId, ...updates });
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: mockEq, select: jest.fn().mockReturnValue({ single: mockSingle }) }),
      });

      await expect(
        authService.updateProfile(mockUserId, { username: 'newname' })
      ).rejects.toThrow(mockError);
    });
  });

  describe('generatePairingCode', () => {
    it('should generate and store pairing code', async () => {
      const mockCodeData = {
        user_id: mockUserId,
        code: 'ABCD1234',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCodeData,
        error: null,
      });
      const mockInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await authService.generatePairingCode(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('pairing_codes');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        code: 'ABCD1234',
        expires_at: expect.any(String),
      });
      expect(result).toEqual({
        code: 'ABCD1234',
        userId: mockUserId,
        expiresAt: expect.any(Date),
      });
    });

    it('should throw error when code generation fails', async () => {
      const mockError = new Error('Database error');
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await expect(
        authService.generatePairingCode(mockUserId)
      ).rejects.toThrow(mockError);
    });
  });

  describe('validatePairingCode', () => {
    it('should validate correct pairing code', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockCodeData = {
        user_id: mockPartnerId,
        code: 'ABCD1234',
        expires_at: futureDate.toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCodeData,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.validatePairingCode('ABCD1234', mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when code not found', async () => {
      const mockError = { code: 'PGRST116' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.validatePairingCode('INVALID', mockUserId);

      expect(result).toBe(false);
    });

    it('should return false for expired code', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockCodeData = {
        user_id: mockPartnerId,
        code: 'ABCD1234',
        expires_at: pastDate.toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCodeData,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.validatePairingCode('ABCD1234', mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when trying to pair with yourself', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockCodeData = {
        user_id: mockUserId,
        code: 'ABCD1234',
        expires_at: futureDate.toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCodeData,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.validatePairingCode('ABCD1234', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('createCouple', () => {
    it('should create couple with pet', async () => {
      const mockPetData = { name: 'Fluffy', species: 'dragon' };
      const mockCreatedPet = { id: mockPetId, ...mockPetData };
      const mockCoupleData = {
        id: mockCoupleId,
        user1_id: mockUserId,
        user2_id: mockPartnerId,
        pet_id: mockPetId,
        start_date: new Date().toISOString(),
        milestones_unlocked: {},
      };

      // Pet creation mock
      const petMockSingle = jest.fn().mockResolvedValue({
        data: mockCreatedPet,
        error: null,
      });
      const petMockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: petMockSingle }),
      });

      // Couple creation mock
      const coupleMockSingle = jest.fn().mockResolvedValue({
        data: mockCoupleData,
        error: null,
      });
      const coupleMockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: coupleMockSingle }),
      });

      // Profile update mock
      const profileMockEq = jest.fn().mockResolvedValue({ error: null });
      const profileMockUpdate = jest.fn().mockReturnValue({ eq: profileMockEq });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ insert: petMockInsert }) // pets
        .mockReturnValueOnce({ insert: coupleMockInsert }) // couples
        .mockReturnValueOnce({ update: profileMockUpdate }) // profiles user1
        .mockReturnValueOnce({ update: profileMockUpdate }); // profiles user2

      const result = await authService.createCouple(mockUserId, mockPartnerId, mockPetData);

      expect(result).toEqual({
        couple: mockCoupleData,
        pet: mockCreatedPet,
      });
      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(supabase.from).toHaveBeenCalledWith('couples');
    });

    it('should throw error when pet creation fails', async () => {
      const mockError = new Error('Pet creation failed');
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: mockSingle }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await expect(
        authService.createCouple(mockUserId, mockPartnerId, {})
      ).rejects.toThrow(mockError);
    });
  });

  describe('getCouple', () => {
    it('should return couple with calculated days together', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockCoupleData = {
        id: mockCoupleId,
        user1_id: mockUserId,
        user2_id: mockPartnerId,
        pet_id: mockPetId,
        start_date: yesterday.toISOString(),
        milestones_unlocked: { first_care: true },
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCoupleData,
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({ single: mockSingle }),
        }),
      });

      const result = await authService.getCouple(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('couples');
      expect(result).toEqual({
        id: mockCoupleId,
        user1Id: mockUserId,
        user2Id: mockPartnerId,
        petId: mockPetId,
        startDate: yesterday,
        milestonesUnlocked: { first_care: true },
        daysTogether: expect.any(Number),
      });
      expect(result?.daysTogether).toBeGreaterThanOrEqual(0);
    });

    it('should return null when couple not found', async () => {
      const mockError = { code: 'PGRST116' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({ single: mockSingle }),
        }),
      });

      const result = await authService.getCouple(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getPartnerProfile', () => {
    it('should return partner profile', async () => {
      const partnerProfileData = {
        id: mockPartnerId,
        username: 'partner',
        partner_id: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
      };

      // First call to get partner_id
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { partner_id: mockPartnerId },
        error: null,
      });
      const mockEq1 = jest.fn().mockReturnValue({ single: mockSingle1 });

      // Second call to get profile
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: partnerProfileData,
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle2 });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({ eq: mockEq1 }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({ eq: mockEq2 }),
        });

      const result = await authService.getPartnerProfile(mockUserId);

      expect(result).toEqual({
        id: mockPartnerId,
        email: '',
        username: 'partner',
        partnerId: mockUserId,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should return null when user has no partner', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { partner_id: null },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.getPartnerProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when profile not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await authService.getPartnerProfile(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = jest.fn();
      const mockSubscription = { data: { subscription: 'mock' } };

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const result = authService.onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(result).toEqual(mockSubscription);
    });
  });
});
