// Database Types for Virtual Pet Co-Parent
// Auto-generated types matching Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          partner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      couples: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          pet_id: string | null
          start_date: string
          relationship_anniversary: string | null
          milestones_unlocked: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          pet_id?: string | null
          start_date?: string
          relationship_anniversary?: string | null
          milestones_unlocked?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          pet_id?: string | null
          start_date?: string
          relationship_anniversary?: string | null
          milestones_unlocked?: Json
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          couple_id: string
          species: 'dragon' | 'cat' | 'fox' | 'puppy'
          color: string
          name: string
          current_stage: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder' | 'milestone'
          hunger: number
          happiness: number
          energy: number
          personality_type: Json
          xp: number
          streak_days: number
          last_care_timestamp: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          species: 'dragon' | 'cat' | 'fox' | 'puppy'
          color: string
          name: string
          current_stage?: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder' | 'milestone'
          hunger?: number
          happiness?: number
          energy?: number
          personality_type?: Json
          xp?: number
          streak_days?: number
          last_care_timestamp?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          species?: 'dragon' | 'cat' | 'fox' | 'puppy'
          color?: string
          name?: string
          current_stage?: 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder' | 'milestone'
          hunger?: number
          happiness?: number
          energy?: number
          personality_type?: Json
          xp?: number
          streak_days?: number
          last_care_timestamp?: string
          created_at?: string
          updated_at?: string
        }
      }
      care_actions: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          action_type: 'feed' | 'play' | 'walk' | 'pet'
          timestamp: string
          bonus_points: number
          co_op_bonus: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          pet_id: string
          user_id: string
          action_type: 'feed' | 'play' | 'walk' | 'pet'
          timestamp?: string
          bonus_points?: number
          co_op_bonus?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          pet_id?: string
          user_id?: string
          action_type?: 'feed' | 'play' | 'walk' | 'pet'
          timestamp?: string
          bonus_points?: number
          co_op_bonus?: boolean
          metadata?: Json
        }
      }
      milestones: {
        Row: {
          id: string
          couple_id: string
          milestone_type: 'first_meet' | 'three_day_streak' | 'fourteen_day_streak' | 'thirty_day_streak' | 'sixty_day_streak' | 'hundred_day_streak' | 'first_evolution' | 'personality_developed' | 'in_person_visit' | 'perfect_day'
          achieved_at: string
          evolution_unlocked: string | null
          celebrated_by: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          couple_id: string
          milestone_type: 'first_meet' | 'three_day_streak' | 'fourteen_day_streak' | 'thirty_day_streak' | 'sixty_day_streak' | 'hundred_day_streak' | 'first_evolution' | 'personality_developed' | 'in_person_visit' | 'perfect_day'
          achieved_at?: string
          evolution_unlocked?: string | null
          celebrated_by?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          couple_id?: string
          milestone_type?: 'first_meet' | 'three_day_streak' | 'fourteen_day_streak' | 'thirty_day_streak' | 'sixty_day_streak' | 'hundred_day_streak' | 'first_evolution' | 'personality_developed' | 'in_person_visit' | 'perfect_day'
          achieved_at?: string
          evolution_unlocked?: string | null
          celebrated_by?: string | null
          metadata?: Json
        }
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          item_type: 'collar' | 'hat' | 'toy' | 'background' | 'frame' | 'decoration'
          item_id: string
          name: string
          is_equipped: boolean
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          acquired_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'collar' | 'hat' | 'toy' | 'background' | 'frame' | 'decoration'
          item_id: string
          name: string
          is_equipped?: boolean
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          acquired_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'collar' | 'hat' | 'toy' | 'background' | 'frame' | 'decoration'
          item_id?: string
          name?: string
          is_equipped?: boolean
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          acquired_at?: string
          metadata?: Json
        }
      }
      pet_messages: {
        Row: {
          id: string
          pet_id: string
          message: string
          message_type: 'status' | 'miss_you' | 'celebration' | 'reminder'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          message: string
          message_type?: 'status' | 'miss_you' | 'celebration' | 'reminder'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          message?: string
          message_type?: 'status' | 'miss_you' | 'celebration' | 'reminder'
          is_read?: boolean
          created_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          care_reminders_enabled: boolean
          partner_action_notifications: boolean
          milestone_notifications: boolean
          daily_message_enabled: boolean
          quiet_hours_start: string
          quiet_hours_end: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          care_reminders_enabled?: boolean
          partner_action_notifications?: boolean
          milestone_notifications?: boolean
          daily_message_enabled?: boolean
          quiet_hours_start?: string
          quiet_hours_end?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          care_reminders_enabled?: boolean
          partner_action_notifications?: boolean
          milestone_notifications?: boolean
          daily_message_enabled?: boolean
          quiet_hours_start?: string
          quiet_hours_end?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_care_action: {
        Args: {
          p_pet_id: string
          p_user_id: string
          p_action_type: 'feed' | 'play' | 'walk' | 'pet'
        }
        Returns: Json
      }
      check_pet_evolution: {
        Args: {
          pet_id: string
        }
        Returns: string
      }
      calculate_pet_wellness: {
        Args: {
          pet_id: string
        }
        Returns: number
      }
      create_couple: {
        Args: {
          p_user1_id: string
          p_user2_id: string
        }
        Returns: Json
      }
      adopt_pet: {
        Args: {
          p_couple_id: string
          p_species: string
          p_color: string
          p_name: string
        }
        Returns: Json
      }
      generate_pet_message: {
        Args: {
          p_pet_id: string
          p_message_type?: 'status' | 'miss_you' | 'celebration' | 'reminder'
        }
        Returns: Json
      }
      add_inventory_item: {
        Args: {
          p_user_id: string
          p_item_type: string
          p_item_id: string
          p_name: string
          p_rarity?: string
        }
        Returns: Json
      }
      equip_inventory_item: {
        Args: {
          p_user_id: string
          p_item_id: string
        }
        Returns: Json
      }
      get_couple_stats: {
        Args: {
          p_couple_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Couple = Database['public']['Tables']['couples']['Row']
export type CoupleInsert = Database['public']['Tables']['couples']['Insert']
export type CoupleUpdate = Database['public']['Tables']['couples']['Update']

export type Pet = Database['public']['Tables']['pets']['Row']
export type PetInsert = Database['public']['Tables']['pets']['Insert']
export type PetUpdate = Database['public']['Tables']['pets']['Update']

export type CareAction = Database['public']['Tables']['care_actions']['Row']
export type CareActionInsert = Database['public']['Tables']['care_actions']['Insert']
export type CareActionUpdate = Database['public']['Tables']['care_actions']['Update']

export type Milestone = Database['public']['Tables']['milestones']['Row']
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update']

export type Inventory = Database['public']['Tables']['inventory']['Row']
export type InventoryInsert = Database['public']['Tables']['inventory']['Insert']
export type InventoryUpdate = Database['public']['Tables']['inventory']['Update']

export type PetMessage = Database['public']['Tables']['pet_messages']['Row']
export type PetMessageInsert = Database['public']['Tables']['pet_messages']['Insert']
export type PetMessageUpdate = Database['public']['Tables']['pet_messages']['Update']

export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row']
export type NotificationPreferencesInsert = Database['public']['Tables']['notification_preferences']['Insert']
export type NotificationPreferencesUpdate = Database['public']['Tables']['notification_preferences']['Update']

// Personality type
export interface PersonalityType {
  playful: number
  calm: number
  mischievous: number
  affectionate: number
}

// Care action types
export type ActionType = 'feed' | 'play' | 'walk' | 'pet'

// Pet species
export type PetSpecies = 'dragon' | 'cat' | 'fox' | 'puppy'

// Pet stage
export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder' | 'milestone'

// Milestone type
export type MilestoneType =
  | 'first_meet'
  | 'three_day_streak'
  | 'fourteen_day_streak'
  | 'thirty_day_streak'
  | 'sixty_day_streak'
  | 'hundred_day_streak'
  | 'first_evolution'
  | 'personality_developed'
  | 'in_person_visit'
  | 'perfect_day'

// Item type
export type ItemType = 'collar' | 'hat' | 'toy' | 'background' | 'frame' | 'decoration'

// Item rarity
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

// Message type
export type MessageType = 'status' | 'miss_you' | 'celebration' | 'reminder'
