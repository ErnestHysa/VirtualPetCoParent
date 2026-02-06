/**
 * Pet Store
 * Manages pet state, care actions, and evolution
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Pet, PetStats, CareActionType, PetStage } from '@/types';
import { CARE_EFFECTS, CARE_COOLDOWN, STAGE_DAY_REQUIREMENTS } from '@/constants/pet';
import { clamp } from '@/lib/utils';
import { petService, supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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

interface PetState {
  // State
  pet: Pet | null;
  isLoading: boolean;
  lastCareAction: { type: CareActionType; timestamp: Date } | null;
  careHistory: CareActionType[];
  dailyCareCount: number;
  lastCareDate: Date | null;
  streakDays: number;

  // Actions
  setPet: (pet: Pet | null) => void;
  setLoading: (loading: boolean) => void;

  // Care actions
  performCare: (action: CareActionType) => Promise<boolean>;
  canPerformCare: (action: CareActionType) => boolean;
  getCareCooldown: (action: CareActionType) => number;

  // Evolution
  checkEvolution: () => PetStage | null;
  evolve: (newStage: PetStage) => Promise<void>;

  // Stats management
  updateStats: (changes: Partial<PetStats>) => void;
  decayStats: () => void;

  // Personality
  updatePersonality: (action: CareActionType) => void;

  // Utility
  getNeedsAttention: () => boolean;
  getMoodMessage: () => string;
  syncPet: () => Promise<void>;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      // Initial state
      pet: null,
      isLoading: false,
      lastCareAction: null,
      careHistory: [],
      dailyCareCount: 0,
      lastCareDate: null,
      streakDays: 0,

      setPet: (pet) => set({ pet }),
      setLoading: (isLoading) => set({ isLoading }),

      // Perform a care action
      performCare: async (action: CareActionType) => {
        const { pet, lastCareAction } = get();
        if (!pet) return false;

        // Check cooldown
        if (lastCareAction && lastCareAction.type === action) {
          const cooldown = get().getCareCooldown(action);
          const elapsed = Date.now() - lastCareAction.timestamp.getTime();
          if (elapsed < cooldown) {
            return false;
          }
        }

        // Apply care effects
        const effects = CARE_EFFECTS[action];
        let updatedPet: Pet | undefined;

        set((state) => {
          if (!state.pet) return state;

          const newStats: PetStats = {
            hunger: clamp(state.pet.stats.hunger + effects.hunger, 0, 100),
            happiness: clamp(state.pet.stats.happiness + effects.happiness, 0, 100),
            energy: clamp(state.pet.stats.energy + effects.energy, 0, 100),
          };

          const newCareHistory = [...state.careHistory, action];
          const isToday = state.lastCareDate
            ? new Date().toDateString() === state.lastCareDate.toDateString()
            : false;

          updatedPet = {
            ...state.pet,
            stats: newStats,
            xp: state.pet.xp + 10,
            lastCareAt: new Date(),
          };

          return {
            pet: updatedPet,
            lastCareAction: { type: action, timestamp: new Date() },
            careHistory: newCareHistory.slice(-20), // Keep last 20
            dailyCareCount: isToday ? state.dailyCareCount + 1 : 1,
            lastCareDate: new Date(),
          };
        });

        // Update personality based on action
        get().updatePersonality(action);

        // Sync with Supabase
        try {
          // Get current user for the care action
          const { data: { user } } = await supabase.auth.getUser();
          if (user && updatedPet) {
            // Record care action and update pet stats
            await Promise.all([
              // Insert care action record
              supabase.from('care_actions').insert({
                pet_id: updatedPet.id,
                user_id: user.id,
                action_type: action,
                timestamp: new Date().toISOString(),
                bonus_points: 10,
              }),
              // Update pet stats in database
              supabase.from('pets').update({
                hunger: updatedPet.stats.hunger,
                happiness: updatedPet.stats.happiness,
                energy: updatedPet.stats.energy,
                xp: updatedPet.xp,
                last_care_at: new Date().toISOString(),
                personality_type: updatedPet.personality,
              }).eq('id', updatedPet.id),
            ]);
          }
        } catch (error) {
          console.error('Failed to sync care action with Supabase:', error);
          // Continue anyway - local state is updated
        }

        return true;
      },

      syncPet: async () => {
        const currentPetId = get().pet?.id;
        if (!currentPetId) return;

        try {
          const latestPet = await petService.getPet(currentPetId);
          if (!latestPet) return;

          set({ pet: latestPet });
        } catch (error) {
          console.error('Failed to sync pet:', error);
        }
      },

      // Check if care action can be performed
      canPerformCare: (action: CareActionType) => {
        const { lastCareAction, pet } = get();
        if (!pet) return false;

        // Check if pet is in egg stage
        if (pet.currentStage === 'egg') return false;

        // Check cooldown
        if (lastCareAction && lastCareAction.type === action) {
          const cooldown = get().getCareCooldown(action);
          const elapsed = Date.now() - lastCareAction.timestamp.getTime();
          return elapsed >= cooldown;
        }

        return true;
      },

      // Get remaining cooldown time in milliseconds
      getCareCooldown: (action: CareActionType) => {
        const { lastCareAction } = get();
        if (!lastCareAction || lastCareAction.type !== action) {
          return 0;
        }
        const elapsed = Date.now() - lastCareAction.timestamp.getTime();
        return Math.max(0, CARE_COOLDOWN - elapsed);
      },

      // Check if pet can evolve
      checkEvolution: () => {
        const { pet, streakDays } = get();
        if (!pet) return null;

        const stages: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult', 'elder'];
        const currentIndex = stages.indexOf(pet.currentStage);
        if (currentIndex >= stages.length - 1) return null;

        const nextStage = stages[currentIndex + 1];
        const daysRequired = STAGE_DAY_REQUIREMENTS[nextStage];

        if (streakDays >= daysRequired) {
          return nextStage;
        }

        return null;
      },

      // Evolve pet to new stage
      evolve: async (newStage: PetStage) => {
        const petId = get().pet?.id;
        if (!petId) return;

        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              currentStage: newStage,
            },
          };
        });

        // Sync with Supabase
        try {
          await supabase
            .from('pets')
            .update({ current_stage: newStage })
            .eq('id', petId);

          // Record milestone
          await supabase.from('milestones').insert({
            couple_id: get().pet?.coupleId,
            milestone_type: 'evolution',
            achieved_at: new Date().toISOString(),
            evolution_unlocked: newStage,
          });
        } catch (error) {
          console.error('Failed to sync evolution with Supabase:', error);
          // Revert local state on failure
          set((state) => {
            if (!state.pet) return state;
            return {
              pet: {
                ...state.pet,
                currentStage: state.pet.currentStage === newStage
                  ? (['egg', 'baby', 'child', 'teen', 'adult', 'elder'] as PetStage[])[
                      Math.max(0, (['egg', 'baby', 'child', 'teen', 'adult', 'elder'] as PetStage[]).indexOf(newStage) - 1)
                    ]
                  : state.pet.currentStage,
              },
            };
          });
        }
      },

      // Update pet stats
      updateStats: (changes: Partial<PetStats>) => {
        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              stats: {
                hunger: clamp(changes.hunger ?? state.pet.stats.hunger, 0, 100),
                happiness: clamp(changes.happiness ?? state.pet.stats.happiness, 0, 100),
                energy: clamp(changes.energy ?? state.pet.stats.energy, 0, 100),
              },
            },
          };
        });
      },

      // Decay stats over time (call periodically)
      decayStats: () => {
        set((state) => {
          if (!state.pet) return state;

          // Apply stat decay based on elapsed time
          const now = new Date();
          const lastUpdate = state.lastCareDate || state.pet.createdAt;
          const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

          return {
            pet: {
              ...state.pet,
              stats: {
                hunger: clamp(state.pet.stats.hunger - hoursPassed * 2, 0, 100),
                happiness: clamp(state.pet.stats.happiness - hoursPassed * 1.5, 0, 100),
                energy: clamp(state.pet.stats.energy - hoursPassed * 1, 0, 100),
              },
            },
          };
        });
      },

      // Update personality based on actions
      updatePersonality: (action: CareActionType) => {
        set((state) => {
          if (!state.pet) return state;

          const personality = { ...state.pet.personality };

          // Update personality traits based on action
          switch (action) {
            case 'play':
              personality.playful = Math.min(100, personality.playful + 2);
              break;
            case 'pet':
              personality.affectionate = Math.min(100, personality.affectionate + 2);
              break;
            case 'groom':
              personality.calm = Math.min(100, personality.calm + 1);
              personality.affectionate = Math.min(100, personality.affectionate + 1);
              break;
            case 'feed':
              personality.affectionate = Math.min(100, personality.affectionate + 1);
              break;
            case 'walk':
              personality.playful = Math.min(100, personality.playful + 1);
              personality.mischievous = Math.min(100, personality.mischievous + 0.5);
              break;
          }

          // Determine dominant personality
          const entries = Object.entries(personality) as [keyof typeof personality, number][];
          const dominant = entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

          return {
            pet: {
              ...state.pet,
              personality,
              dominantPersonality: dominant,
            },
          };
        });
      },

      // Check if pet needs attention
      getNeedsAttention: () => {
        const { pet } = get();
        if (!pet || pet.currentStage === 'egg') return false;

        return (
          pet.stats.hunger < 30 ||
          pet.stats.happiness < 30 ||
          pet.stats.energy < 30
        );
      },

      // Get mood message based on stats
      getMoodMessage: () => {
        const { pet } = get();
        if (!pet) return '';

        const avgStats = (pet.stats.hunger + pet.stats.happiness + pet.stats.energy) / 3;

        if (avgStats >= 80) return "I'm so happy! 🌟";
        if (avgStats >= 60) return 'Feeling pretty good!';
        if (avgStats >= 40) return 'Could use some attention...';
        if (avgStats >= 20) return 'I really need care... 😢';
        return "I'm not feeling well at all...";
      },
    }),
    {
      name: 'pet-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        pet: state.pet,
        careHistory: state.careHistory,
        dailyCareCount: state.dailyCareCount,
        lastCareDate: state.lastCareDate,
        streakDays: state.streakDays,
      }),
    }
  )
);
