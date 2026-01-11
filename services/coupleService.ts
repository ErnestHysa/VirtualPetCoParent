/**
 * Couple Service for Virtual Pet Co-Parent
 * Handles couple pairing, partner matching, and milestone tracking
 */

import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import {
  Couple,
  Milestone,
  Profile,
  AppError,
  ErrorCode,
} from '../types';

// ==================== TYPES ====================

export interface CreateCoupleResponse {
  couple?: Couple;
  error?: AppError;
}

export interface GetCoupleResponse {
  couple?: Couple;
  partners?: { user1?: Profile; user2?: Profile };
  error?: AppError;
}

export interface PairingCodeResponse {
  code?: string;
  error?: AppError;
}

export interface PairWithPartnerResponse {
  success: boolean;
  couple?: Couple;
  error?: AppError;
}

export interface MilestoneUpdate {
  milestoneType: string;
  data?: Record<string, any>;
}

// ==================== CONSTANTS ====================

const PAIRING_CODE_LENGTH = 6;
const PAIRING_CODE_EXPIRY_MINUTES = 15;
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing characters

// ==================== COUPLE SERVICE ====================

export const coupleService = {
  /**
   * Create a new couple relationship between two users
   */
  async createCouple(user1Id: string, user2Id: string): Promise<CreateCoupleResponse> {
    try {
      // Validate users are different
      if (user1Id === user2Id) {
        return {
          error: {
            code: ErrorCode.COUPLE_ALREADY_PAIRED,
            message: 'Cannot pair with yourself',
          },
        };
      }

      // Check if either user is already in a couple
      const { data: existingCouple } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${user1Id},user2_id.eq.${user1Id}`)
        .single();

      if (existingCouple) {
        return {
          error: {
            code: ErrorCode.COUPLE_ALREADY_PAIRED,
            message: 'User is already in a couple',
          },
        };
      }

      // Check if second user is already paired
      const { data: existingCouple2 } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${user2Id},user2_id.eq.${user2Id}`)
        .single();

      if (existingCouple2) {
        return {
          error: {
            code: ErrorCode.COUPLE_ALREADY_PAIRED,
            message: 'Partner is already in a couple',
          },
        };
      }

      // Create the couple
      const { data: newCouple, error } = await supabase
        .from('couples')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          start_date: new Date().toISOString(),
          milestones_unlocked: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Update profiles to reference each other
      await supabase
        .from('profiles')
        .update({ partner_id: user2Id })
        .eq('id', user1Id);

      await supabase
        .from('profiles')
        .update({ partner_id: user1Id })
        .eq('id', user2Id);

      return { couple: newCouple as Couple };
    } catch (error: any) {
      console.error('Error creating couple:', error);
      return {
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to create couple',
          details: error,
        },
      };
    }
  },

  /**
   * Get couple by ID
   */
  async getCouple(coupleId: string): Promise<GetCoupleResponse> {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            error: {
              code: ErrorCode.COUPLE_NOT_FOUND,
              message: 'Couple not found',
            },
          };
        }
        throw error;
      }

      return { couple: data as Couple };
    } catch (error: any) {
      console.error('Error fetching couple:', error);
      return {
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to fetch couple',
          details: error,
        },
      };
    }
  },

  /**
   * Get couple by user ID
   */
  async getCoupleByUserId(userId: string): Promise<GetCoupleResponse> {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select(`
          *,
          user1:profiles!couples_user1_id_fkey(*),
          user2:profiles!couples_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            error: {
              code: ErrorCode.COUPLE_NOT_FOUND,
              message: 'Couple not found',
            },
          };
        }
        throw error;
      }

      const couple = data as any;
      return {
        couple: couple as Couple,
        partners: {
          user1: couple.user1 as Profile,
          user2: couple.user2 as Profile,
        },
      };
    } catch (error: any) {
      console.error('Error fetching couple by user:', error);
      return {
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to fetch couple',
          details: error,
        },
      };
    }
  },

  /**
   * Generate a unique pairing code for partner matching
   */
  async generatePairingCode(): Promise<PairingCodeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          error: {
            code: ErrorCode.AUTH_INVALID_CREDENTIALS,
            message: 'User not authenticated',
          },
        };
      }

      // Check if user is already in a couple
      const { data: existingCouple } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();

      if (existingCouple) {
        return {
          error: {
            code: ErrorCode.COUPLE_ALREADY_PAIRED,
            message: 'You are already in a couple',
          },
        };
      }

      // Generate unique code
      let code: string;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = this.generateRandomCode();

        // Check if code already exists
        const { data: existingCode } = await supabase
          .from('pairing_codes')
          .select('code')
          .eq('code', code)
          .single();

        if (!existingCode) {
          isUnique = true;
        }

        attempts++;
      }

      if (!isUnique) {
        return {
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to generate unique code',
          },
        };
      }

      // Store the code
      const expiresAt = new Date(Date.now() + PAIRING_CODE_EXPIRY_MINUTES * 60 * 1000);

      const { error } = await supabase
        .from('pairing_codes')
        .insert({
          user_id: user.id,
          code: code!,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      return { code: code! };
    } catch (error: any) {
      console.error('Error generating pairing code:', error);
      return {
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to generate pairing code',
          details: error,
        },
      };
    }
  },

  /**
   * Pair with partner using their code
   */
  async pairWithPartner(code: string): Promise<PairWithPartnerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: {
            code: ErrorCode.AUTH_INVALID_CREDENTIALS,
            message: 'User not authenticated',
          },
        };
      }

      // Find the pairing code
      const { data: codeData, error: codeError } = await supabase
        .from('pairing_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (codeError || !codeData) {
        return {
          success: false,
          error: {
            code: ErrorCode.COUPLE_NOT_FOUND,
            message: 'Invalid pairing code',
          },
        };
      }

      // Check if expired
      if (new Date(codeData.expires_at) < new Date()) {
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Pairing code has expired',
          },
        };
      }

      // Cannot pair with yourself
      if (codeData.user_id === user.id) {
        return {
          success: false,
          error: {
            code: ErrorCode.COUPLE_ALREADY_PAIRED,
            message: 'Cannot pair with yourself',
          },
        };
      }

      // Create couple
      const { couple, error: createError } = await this.createCouple(user.id, codeData.user_id);

      if (createError || !couple) {
        return {
          success: false,
          error: createError || {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to create couple',
          },
        };
      }

      // Update pairing code status
      await supabase
        .from('pairing_codes')
        .update({ status: 'completed' })
        .eq('code', code);

      return { success: true, couple };
    } catch (error: any) {
      console.error('Error pairing with partner:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to pair with partner',
          details: error,
        },
      };
    }
  },

  /**
   * Update milestone for a couple
   */
  async updateMilestone(coupleId: string, milestoneType: string, data?: Record<string, any>): Promise<{ success: boolean; error?: AppError }> {
    try {
      // Get current couple data
      const { couple } = await this.getCouple(coupleId);

      if (!couple) {
        return {
          success: false,
          error: {
            code: ErrorCode.COUPLE_NOT_FOUND,
            message: 'Couple not found',
          },
        };
      }

      // Update milestones
      const updatedMilestones = {
        ...(couple.milestones_unlocked || {}),
        [milestoneType]: {
          achieved_at: new Date().toISOString(),
          ...data,
        },
      };

      const { error } = await supabase
        .from('couples')
        .update({ milestones_unlocked: updatedMilestones })
        .eq('id', coupleId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to update milestone',
          details: error,
        },
      };
    }
  },

  /**
   * Get days together for a couple
   */
  getDaysTogether(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Get partner info for a user
   */
  async getPartnerInfo(userId: string): Promise<{ partner?: Profile; error?: AppError }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', userId)
        .single();

      if (!profile?.partner_id) {
        return {
          error: {
            code: ErrorCode.COUPLE_NOT_FOUND,
            message: 'No partner found',
          },
        };
      }

      const { data: partner, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single();

      if (error) throw error;

      return { partner: partner as Profile };
    } catch (error: any) {
      console.error('Error fetching partner info:', error);
      return {
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to fetch partner info',
          details: error,
        },
      };
    }
  },

  // ==================== HELPER METHODS ====================

  /**
   * Generate a random pairing code
   */
  generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
      code += CODE_CHARSET.charAt(Math.floor(Math.random() * CODE_CHARSET.length));
    }
    return code;
  },
};

export default coupleService;
