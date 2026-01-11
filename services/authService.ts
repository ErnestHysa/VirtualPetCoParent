/**
 * Auth Service
 * Handles authentication and partner pairing
 */

import { supabase, authHelpers } from '@/lib/supabase';
import { UserProfile, Couple, PairingCode } from '@/types';
import { generatePairingCode } from '@/lib/utils';

class AuthService {
  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
      });

      if (profileError) throw profileError;
    }

    return data;
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      email: '', // Not stored in profiles
      username: data.username,
      partnerId: data.partner_id,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generate pairing code
   */
  async generatePairingCode(userId: string): Promise<PairingCode> {
    const code = generatePairingCode();

    // Store code in database or use a temporary table
    const { data, error } = await supabase
      .from('pairing_codes')
      .insert({
        user_id: userId,
        code,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      code,
      userId: data.user_id,
      expiresAt: new Date(data.expires_at),
    };
  }

  /**
   * Validate and use pairing code
   */
  async validatePairingCode(code: string, userId: string): Promise<boolean> {
    // Look up the code
    const { data, error } = await supabase
      .from('pairing_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) return false;

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      return false;
    }

    // Can't pair with yourself
    if (data.user_id === userId) return false;

    return true;
  }

  /**
   * Create couple relationship
   */
  async createCouple(user1Id: string, user2Id: string, petData: any) {
    // First create the pet
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .insert(petData)
      .select()
      .single();

    if (petError) throw petError;

    // Then create the couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        pet_id: pet.id,
        start_date: new Date().toISOString(),
        milestones_unlocked: {},
      })
      .select()
      .single();

    if (coupleError) throw coupleError;

    // Update both profiles with partner_id
    await supabase
      .from('profiles')
      .update({ partner_id: user2Id })
      .eq('id', user1Id);

    await supabase
      .from('profiles')
      .update({ partner_id: user1Id })
      .eq('id', user2Id);

    return { couple, pet };
  }

  /**
   * Get couple by user ID
   */
  async getCouple(userId: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (error) return null;

    // Calculate days together
    const startDate = new Date(data.start_date);
    const daysTogether = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: data.id,
      user1Id: data.user1_id,
      user2Id: data.user2_id,
      petId: data.pet_id,
      startDate,
      milestonesUnlocked: data.milestones_unlocked,
      daysTogether,
    };
  }

  /**
   * Get partner profile
   */
  async getPartnerProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', userId)
      .single();

    if (!profile?.partner_id) return null;

    return this.getProfile(profile.partner_id);
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
