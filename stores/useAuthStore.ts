/**
 * Authentication Store
 * Manages user authentication state and partner relationships
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, Couple, PairingCode } from '@/types';
import { authHelpers, supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage adapter for Zustand persist middleware
 */
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  // State
  user: UserProfile | null;
  couple: Couple | null;
  partner: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setCouple: (couple: Couple | null) => void;
  setPartner: (partner: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Auth actions
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;

  // Partner actions
  generatePairingCode: () => Promise<PairingCode | null>;
  pairWithPartner: (code: string) => Promise<boolean>;
  unpair: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      couple: null,
      partner: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCouple: (couple) => set({ couple }),
      setPartner: (partner) => set({ partner }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Auth actions
      signUp: async (email, password, username) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authHelpers.signUp(email, password, username);
          if (error) throw error;

          // Create profile
          if (data.user) {
            const userProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || '',
              username,
              createdAt: new Date(),
            };
            set({ user: userProfile, isAuthenticated: true });
          }
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Sign up failed' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authHelpers.signIn(email, password);
          if (error) throw error;

          if (data.user) {
            const userProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || '',
              username: data.user.user_metadata?.username || '',
              createdAt: new Date(data.user.created_at),
            };
            set({ user: userProfile, isAuthenticated: true });
          }
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Sign in failed' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await authHelpers.signOut();
          set({
            user: null,
            couple: null,
            partner: null,
            isAuthenticated: false,
          });
        } catch (error: any) {
          set({ error: error.message || 'Sign out failed' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadUser: async () => {
        set({ isLoading: true });
        try {
          const { session } = await authHelpers.getSession();
          if (session?.user) {
            const userProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata?.username || '',
              createdAt: new Date(session.user.created_at),
            };
            set({ user: userProfile, isAuthenticated: true });
          }
        } catch (error: any) {
          console.error('Failed to load user:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Partner actions
      generatePairingCode: async () => {
        const { user } = get();
        if (!user) return null;

        try {
          // Generate a random code
          const code = `${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Store pairing code in Supabase
          const { error } = await supabase
            .from('pairing_codes')
            .insert({
              code,
              user_id: user.id,
              expires_at: expiresAt.toISOString(),
            });

          if (error) throw error;

          const pairingCode: PairingCode = {
            code,
            userId: user.id,
            expiresAt,
          };
          return pairingCode;
        } catch (error: any) {
          set({ error: error.message || 'Failed to generate code' });
          return null;
        }
      },

      pairWithPartner: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = get();
          if (!user) {
            set({ error: 'You must be logged in to pair with a partner' });
            return false;
          }

          // Validate pairing code with Supabase
          const { data: codeData, error: codeError } = await supabase
            .from('pairing_codes')
            .select('*')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (codeError || !codeData) {
            set({ error: 'Invalid or expired pairing code' });
            return false;
          }

          // Check if pairing with self
          if (codeData.user_id === user.id) {
            set({ error: 'You cannot pair with yourself' });
            return false;
          }

          // Check if already paired
          if (user.partnerId) {
            set({ error: 'You are already paired with a partner' });
            return false;
          }

          // Create couple relationship
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .insert({
              user1_id: user.id,
              user2_id: codeData.user_id,
              start_date: new Date().toISOString(),
              milestones_unlocked: {},
            })
            .select()
            .single();

          if (coupleError) throw coupleError;

          // Update both users' partner_id
          await Promise.all([
            supabase.from('profiles').update({ partner_id: codeData.user_id }).eq('id', user.id),
            supabase.from('profiles').update({ partner_id: user.id }).eq('id', codeData.user_id),
          ]);

          // Delete the used pairing code
          await supabase.from('pairing_codes').delete().eq('code', code);

          // Fetch partner's profile
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', codeData.user_id)
            .single();

          const partner: UserProfile | null = partnerProfile ? {
            id: partnerProfile.id,
            email: partnerProfile.email || '',
            username: partnerProfile.username,
            createdAt: new Date(partnerProfile.created_at),
          } : null;

          const couple: Couple | null = coupleData ? {
            id: coupleData.id,
            user1Id: coupleData.user1_id,
            user2Id: coupleData.user2_id,
            petId: coupleData.pet_id,
            startDate: new Date(coupleData.start_date),
            milestonesUnlocked: coupleData.milestones_unlocked,
            daysTogether: 0,
          } : null;

          set({ couple, partner });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Pairing failed' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      unpair: async () => {
        set({ isLoading: true });
        try {
          const { user, couple } = get();
          if (!user || !couple) {
            set({ error: 'No active partnership to dissolve' });
            return;
          }

          // Remove partner references
          await Promise.all([
            supabase.from('profiles').update({ partner_id: null }).eq('id', user.id),
            supabase.from('profiles').update({ partner_id: null }).eq('id', user.partnerId || ''),
          ]);

          // Note: We keep the couple record for history but could mark as inactive

          set({ couple: null, partner: null });
        } catch (error: any) {
          set({ error: error.message || 'Unpair failed' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        user: state.user,
        couple: state.couple,
        partner: state.partner,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
