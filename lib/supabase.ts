/**
 * Supabase client configuration
 * Handles authentication, database queries, and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars are missing. Running in limited/offline mode.');
}

/**
 * Custom storage adapter for Expo SecureStore (native)
 * and localStorage (web)
 */
const customStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Supabase client instance
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: customStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Database types for TypeScript
 * Generated via Supabase CLI: supabase gen types typescript
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          partner_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          partner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          partner_id?: string | null;
          created_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          pet_id: string;
          start_date: string;
          milestones_unlocked: Record<string, boolean>;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          pet_id: string;
          start_date?: string;
          milestones_unlocked?: Record<string, boolean>;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          pet_id?: string;
          start_date?: string;
          milestones_unlocked?: Record<string, boolean>;
        };
      };
      pets: {
        Row: {
          id: string;
          couple_id: string;
          species: 'dragon' | 'cat' | 'fox' | 'puppy';
          color: string;
          name: string;
          current_stage: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';
          hunger: number;
          happiness: number;
          energy: number;
          personality_type: Record<string, number>;
          xp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          species: 'dragon' | 'cat' | 'fox' | 'puppy';
          color: string;
          name: string;
          current_stage?: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';
          hunger?: number;
          happiness?: number;
          energy?: number;
          personality_type?: Record<string, number>;
          xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          species?: 'dragon' | 'cat' | 'fox' | 'puppy';
          color?: string;
          name?: string;
          current_stage?: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';
          hunger?: number;
          happiness?: number;
          energy?: number;
          personality_type?: Record<string, number>;
          xp?: number;
          created_at?: string;
        };
      };
      care_actions: {
        Row: {
          id: string;
          pet_id: string;
          user_id: string;
          action_type: 'feed' | 'play' | 'walk' | 'pet' | 'groom';
          timestamp: string;
          bonus_points: number;
        };
        Insert: {
          id?: string;
          pet_id: string;
          user_id: string;
          action_type: 'feed' | 'play' | 'walk' | 'pet' | 'groom';
          timestamp?: string;
          bonus_points?: number;
        };
        Update: {
          id?: string;
          pet_id?: string;
          user_id?: string;
          action_type?: 'feed' | 'play' | 'walk' | 'pet' | 'groom';
          timestamp?: string;
          bonus_points?: number;
        };
      };
      milestones: {
        Row: {
          id: string;
          couple_id: string;
          milestone_type: string;
          achieved_at: string;
          evolution_unlocked: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          milestone_type: string;
          achieved_at?: string;
          evolution_unlocked?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          milestone_type?: string;
          achieved_at?: string;
          evolution_unlocked?: string | null;
        };
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          is_equipped: boolean;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: string;
          item_id: string;
          is_equipped?: boolean;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: string;
          item_id?: string;
          is_equipped?: boolean;
          unlocked_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      perform_care_action: {
        Args: {
          pet_id: string;
          action_type: 'feed' | 'play' | 'walk' | 'pet' | 'groom';
        };
        Returns: {
          success: boolean;
          pet: any;
          xp_gained: number;
        };
      };
      check_evolution: {
        Args: {
          pet_id: string;
        };
        Returns: {
          can_evolve: boolean;
          new_stage: string | null;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

/**
 * Auth helpers
 */
export const authHelpers = {
  /**
   * Sign up with email
   */
  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },
};

/**
 * Real-time subscription helpers
 */
export const realtimeHelpers = {
  /**
   * Subscribe to pet changes
   */
  subscribeToPet: (petId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`pet:${petId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `id=eq.${petId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to couple changes
   */
  subscribeToCouple: (coupleId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`couple:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to care actions
   */
  subscribeToCareActions: (petId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`care_actions:${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'care_actions',
          filter: `pet_id=eq.${petId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll: () => {
    supabase.removeAllChannels();
  },
};

// Export services
export { petService } from '../services/petService';

export default supabase;
