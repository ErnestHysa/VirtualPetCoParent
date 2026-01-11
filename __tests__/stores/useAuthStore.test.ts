/**
 * useAuthStore Tests
 *
 * Testing the Zustand store for authentication state management
 */

import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserProfile, Couple } from '@/types';

// Mock supabase client and authHelpers
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  authHelpers: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}));

const { authHelpers, supabase } = require('@/lib/supabase');

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('useAuthStore', () => {
  const mockUser: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date('2024-01-01'),
  };

  const mockCouple: Couple = {
    id: 'couple-1',
    user1Id: 'user-123',
    user2Id: 'user-456',
    petId: 'pet-1',
    startDate: new Date('2024-01-01'),
    milestonesUnlocked: {},
  };

  const mockPartner: UserProfile = {
    id: 'user-456',
    email: 'partner@example.com',
    username: 'partneruser',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state before each test
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setCouple(null);
    useAuthStore.getState().setPartner(null);
    useAuthStore.getState().clearError();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.couple).toBeNull();
      expect(result.current.partner).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setters', () => {
    it('should set user and update isAuthenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user and set isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set couple', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCouple(mockCouple);
      });

      expect(result.current.couple).toEqual(mockCouple);
    });

    it('should set partner', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setPartner(mockPartner);
      });

      expect(result.current.partner).toEqual(mockPartner);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set and clear error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockSessionUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
        created_at: '2024-01-01T00:00:00Z',
      };

      authHelpers.signIn.mockResolvedValueOnce({
        data: { user: mockSessionUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(authHelpers.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should handle sign in failure with invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };

      authHelpers.signIn.mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuthStore());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(signInResult).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid login credentials');
    });

    it('should set isLoading during sign in', async () => {
      authHelpers.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 10))
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.signIn('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      const mockNewUser = {
        id: 'user-123',
        email: 'new@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      authHelpers.signUp.mockResolvedValueOnce({
        data: { user: mockNewUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123', 'newuser');
      });

      expect(signUpResult).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'new@example.com',
        username: 'newuser',
        createdAt: expect.any(Date),
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(authHelpers.signUp).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        'newuser'
      );
    });

    it('should handle sign up failure with existing email', async () => {
      const mockError = { message: 'User already registered' };

      authHelpers.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuthStore());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123', 'existinguser');
      });

      expect(signUpResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('User already registered');
    });
  });

  describe('signOut', () => {
    it('should sign out and clear all state', async () => {
      // First set up state
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
        result.current.setCouple(mockCouple);
        result.current.setPartner(mockPartner);
      });

      expect(result.current.isAuthenticated).toBe(true);

      authHelpers.signOut.mockResolvedValueOnce({ error: null });

      // Now sign out
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.couple).toBeNull();
      expect(result.current.partner).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authHelpers.signOut).toHaveBeenCalled();
    });

    it('should handle sign out error', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      const mockError = { message: 'Sign out failed' };
      authHelpers.signOut.mockResolvedValueOnce({
        error: mockError,
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toBe('Sign out failed');
    });
  });

  describe('loadUser', () => {
    it('should load user from session', async () => {
      const mockSessionUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
        created_at: '2024-01-01T00:00:00Z',
      };

      authHelpers.getSession.mockResolvedValueOnce({
        session: { user: mockSessionUser },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUser();
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: expect.any(Date),
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle no session', async () => {
      authHelpers.getSession.mockResolvedValueOnce({
        session: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUser();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('generatePairingCode', () => {
    it('should generate pairing code when user is logged in', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      let pairingCode;
      await act(async () => {
        pairingCode = await result.current.generatePairingCode();
      });

      expect(pairingCode).not.toBeNull();
      expect(pairingCode?.code).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
      expect(pairingCode?.userId).toBe('user-123');
      expect(pairingCode?.expiresAt).toBeInstanceOf(Date);
      expect(supabase.from).toHaveBeenCalledWith('pairing_codes');
      expect(mockInsert).toHaveBeenCalledWith({
        code: expect.any(String),
        user_id: 'user-123',
        expires_at: expect.any(String),
      });
    });

    it('should return null when user is not logged in', async () => {
      const { result } = renderHook(() => useAuthStore());

      let pairingCode;
      await act(async () => {
        pairingCode = await result.current.generatePairingCode();
      });

      expect(pairingCode).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle database error when generating code', async () => {
      const mockError = { message: 'Database error' };
      const mockInsert = jest.fn().mockResolvedValue({ error: mockError });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      let pairingCode;
      await act(async () => {
        pairingCode = await result.current.generatePairingCode();
      });

      expect(pairingCode).toBeNull();
      expect(result.current.error).toBe('Database error');
    });
  });

  describe('pairWithPartner', () => {
    it('should pair with partner using valid code', async () => {
      const codeData = {
        user_id: 'user-456',
        code: 'ABC-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const coupleData = {
        id: 'couple-1',
        user1_id: 'user-123',
        user2_id: 'user-456',
        pet_id: 'pet-1',
        start_date: new Date().toISOString(),
        milestones_unlocked: {},
      };

      const partnerProfile = {
        id: 'user-456',
        username: 'partneruser',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock pairing code lookup
      const mockCodeSingle = jest.fn().mockResolvedValue({ data: codeData, error: null });
      const mockCodeEq = jest.fn().mockReturnValue({ single: mockCodeSingle });
      const mockCodeSelect = jest.fn().mockReturnValue({ eq: mockCodeEq });

      // Mock couple insert
      const mockCoupleSingle = jest.fn().mockResolvedValue({ data: coupleData, error: null });
      const mockCoupleEq = jest.fn();
      const mockCoupleSelect = jest.fn().mockReturnValue({ single: mockCoupleSingle });
      const mockCoupleInsert = jest.fn().mockReturnValue({ select: mockCoupleSelect });

      // Mock profile update
      const mockProfileEq = jest.fn().mockResolvedValue({ error: null });
      const mockProfileUpdate = jest.fn().mockReturnValue({ eq: mockProfileEq });

      // Mock partner profile fetch
      const mockPartnerSingle = jest.fn().mockResolvedValue({ data: partnerProfile, error: null });
      const mockPartnerEq = jest.fn().mockReturnValue({ single: mockPartnerSingle });
      const mockPartnerSelect = jest.fn().mockReturnValue({ eq: mockPartnerEq });

      // Mock delete pairing code
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockCodeSelect }) // pairing_codes lookup
        .mockReturnValueOnce({ insert: mockCoupleInsert }) // couples insert
        .mockReturnValueOnce({ update: mockProfileUpdate }) // profiles update user1
        .mockReturnValueOnce({ update: mockProfileUpdate }) // profiles update user2
        .mockReturnValueOnce({ select: mockPartnerSelect }) // partner profile fetch
        .mockReturnValueOnce({ delete: jest.fn().mockReturnValue({ eq: mockDeleteEq }) }); // delete pairing code

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      let pairResult;
      await act(async () => {
        pairResult = await result.current.pairWithPartner('ABC-123');
      });

      expect(pairResult).toBe(true);
      expect(result.current.couple).toEqual({
        id: 'couple-1',
        user1Id: 'user-123',
        user2Id: 'user-456',
        petId: 'pet-1',
        startDate: expect.any(Date),
        milestonesUnlocked: {},
      });
      expect(result.current.partner).toEqual({
        id: 'user-456',
        email: 'test@example.com',
        username: 'partneruser',
        createdAt: expect.any(Date),
      });
    });

    it('should return false when not logged in', async () => {
      const { result } = renderHook(() => useAuthStore());

      let pairResult;
      await act(async () => {
        pairResult = await result.current.pairWithPartner('ABC-123');
      });

      expect(pairResult).toBe(false);
      expect(result.current.error).toBe('You must be logged in to pair with a partner');
    });

    it('should return false for invalid pairing code', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      let pairResult;
      await act(async () => {
        pairResult = await result.current.pairWithPartner('INVALID');
      });

      expect(pairResult).toBe(false);
      expect(result.current.error).toBe('Invalid or expired pairing code');
    });

    it('should return false when trying to pair with self', async () => {
      const codeData = {
        user_id: 'user-123', // Same as current user
        code: 'ABC-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: codeData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      let pairResult;
      await act(async () => {
        pairResult = await result.current.pairWithPartner('ABC-123');
      });

      expect(pairResult).toBe(false);
      expect(result.current.error).toBe('You cannot pair with yourself');
    });

    it('should return false when already paired', async () => {
      const codeData = {
        user_id: 'user-456',
        code: 'ABC-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: codeData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ ...mockUser, partnerId: 'user-789' });
      });

      let pairResult;
      await act(async () => {
        pairResult = await result.current.pairWithPartner('ABC-123');
      });

      expect(pairResult).toBe(false);
      expect(result.current.error).toBe('You are already paired with a partner');
    });
  });

  describe('unpair', () => {
    it('should unpair from partner', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ ...mockUser, partnerId: 'user-456' });
        result.current.setCouple(mockCouple);
        result.current.setPartner(mockPartner);
      });

      expect(result.current.couple).not.toBeNull();
      expect(result.current.partner).not.toBeNull();

      await act(async () => {
        await result.current.unpair();
      });

      expect(result.current.couple).toBeNull();
      expect(result.current.partner).toBeNull();
    });

    it('should handle unpair when no partnership exists', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      await act(async () => {
        await result.current.unpair();
      });

      expect(result.current.error).toBe('No active partnership to dissolve');
    });

    it('should handle unpair error', async () => {
      const mockError = { message: 'Unpair failed' };
      const mockEq = jest.fn().mockResolvedValue({ error: mockError });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ ...mockUser, partnerId: 'user-456' });
        result.current.setCouple(mockCouple);
      });

      await act(async () => {
        await result.current.unpair();
      });

      expect(result.current.error).toBe('Unpair failed');
    });
  });
});
