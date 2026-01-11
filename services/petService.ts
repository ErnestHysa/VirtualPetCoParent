/**
 * Pet Service
 * Handles all pet-related operations with Supabase
 */

import { supabase } from '@/lib/supabase';
import { Pet, PetSpecies, CareActionType } from '@/types';
import { PET_SPECIES, PET_COLORS } from '@/constants/pet';

class PetService {
  /**
   * Create a new pet for a couple
   */
  async createPet(coupleId: string, species: PetSpecies, color: string, name: string) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        couple_id: coupleId,
        species,
        color,
        name,
        current_stage: 'egg',
        hunger: 80,
        happiness: 80,
        energy: 80,
        personality_type: { playful: 25, calm: 25, mischievous: 25, affectionate: 25 },
        xp: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get pet by ID
   */
  async getPet(petId: string): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (error) return null;
    return this.mapToPet(data);
  }

  /**
   * Get pet by couple ID
   */
  async getPetByCouple(coupleId: string): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('couple_id', coupleId)
      .single();

    if (error) return null;
    return this.mapToPet(data);
  }

  /**
   * Update pet stats
   */
  async updatePetStats(
    petId: string,
    stats: { hunger?: number; happiness?: number; energy?: number }
  ) {
    const { data, error } = await supabase
      .from('pets')
      .update({
        hunger: stats.hunger,
        happiness: stats.happiness,
        energy: stats.energy,
      })
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPet(data);
  }

  /**
   * Perform a care action via Supabase function
   */
  async performCareAction(petId: string, userId: string, actionType: CareActionType) {
    const { data, error } = await supabase.rpc('perform_care_action', {
      pet_id: petId,
      action_type: actionType,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Check and trigger evolution
   */
  async checkEvolution(petId: string) {
    const { data, error } = await supabase.rpc('check_evolution', {
      pet_id: petId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Evolve pet to new stage
   */
  async evolvePet(petId: string, newStage: string) {
    const { data, error } = await supabase
      .from('pets')
      .update({ current_stage: newStage })
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPet(data);
  }

  /**
   * Subscribe to real-time pet updates
   */
  subscribeToPetUpdates(petId: string, callback: (pet: Pet) => void) {
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
        (payload) => {
          if (payload.new) {
            callback(this.mapToPet(payload.new));
          }
        }
      )
      .subscribe();
  }

  /**
   * Get care history
   */
  async getCareHistory(petId: string, limit = 50) {
    const { data, error } = await supabase
      .from('care_actions')
      .select('*')
      .eq('pet_id', petId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get today's care actions
   */
  async getTodayCareActions(petId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('care_actions')
      .select('*')
      .eq('pet_id', petId)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Calculate care streak
   */
  async calculateCareStreak(petId: string): Promise<number> {
    const history = await this.getCareHistory(petId, 365);
    if (!history.length) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Group actions by date
    const actionsByDate = new Map<string, boolean>();
    history.forEach((action) => {
      const date = new Date(action.timestamp);
      date.setHours(0, 0, 0, 0);
      actionsByDate.set(date.toISOString(), true);
    });

    // Count consecutive days
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString();
      if (actionsByDate.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0) {
        // Today might not have actions yet, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
        if (!actionsByDate.has(currentDate.toISOString())) {
          break;
        }
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Map database row to Pet type
   */
  private mapToPet(data: any): Pet {
    return {
      id: data.id,
      coupleId: data.couple_id,
      species: data.species,
      color: data.color,
      name: data.name,
      currentStage: data.current_stage,
      stats: {
        hunger: data.hunger,
        happiness: data.happiness,
        energy: data.energy,
      },
      personality: data.personality_type || {
        playful: 25,
        calm: 25,
        mischievous: 25,
        affectionate: 25,
      },
      dominantPersonality: this.getDominantPersonality(data.personality_type),
      xp: data.xp,
      createdAt: new Date(data.created_at),
      lastCareAt: data.last_care_at ? new Date(data.last_care_at) : undefined,
    };
  }

  /**
   * Get dominant personality type
   */
  private getDominantPersonality(personality: Record<string, number>): any {
    if (!personality) return 'playful';

    const entries = Object.entries(personality);
    const dominant = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    return dominant[0];
  }
}

export const petService = new PetService();
