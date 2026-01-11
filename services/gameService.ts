/**
 * Game Service
 * Handles mini-game logic, scoring, and co-op sessions
 */

import { supabase } from '@/lib/supabase';
import { GameType, GameResult } from '@/types';
import { MINI_GAMES, COOP_CONFIG, SCORE_THRESHOLDS } from '@/constants/games';

class GameService {
  /**
   * Start a new game session
   */
  async startGameSession(
    gameType: GameType,
    userId: string,
    petId: string,
    isCoop: boolean
  ) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        game_type: gameType,
        user_id: userId,
        pet_id: petId,
        is_coop: isCoop,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * End game session and record result
   */
  async endGameSession(
    sessionId: string,
    result: Omit<GameResult, 'timestamp'>
  ) {
    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        score: result.score,
        accuracy: result.accuracy,
        is_coop: result.isCoop,
        coop_bonus: result.coopBonus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    // Award XP to pet
    const baseXP = 50;
    const bonusXP = result.score > 100 ? 25 : 0;
    const coopXP = result.isCoop ? 20 : 0;

    // This would be handled by a database function in production
    return { ...result, totalXP: baseXP + bonusXP + coopXP };
  }

  /**
   * Calculate final score with co-op bonuses
   */
  calculateScore(
    baseScore: number,
    accuracy: number,
    isCoop: boolean,
    partnerJoinedWithin: number | null
  ): number {
    let finalScore = baseScore;

    // Co-op bonus if both partners played
    if (isCoop && partnerJoinedWithin !== null) {
      // Check if joined within sync window
      if (partnerJoinedWithin <= COOP_CONFIG.syncWindow) {
        finalScore *= COOP_CONFIG.bothPlayingMultiplier;
      }
    }

    // Accuracy bonus
    if (accuracy >= 90) {
      finalScore *= 1.2;
    } else if (accuracy >= 75) {
      finalScore *= 1.1;
    }

    return Math.round(finalScore);
  }

  /**
   * Get rank based on score
   */
  getRank(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' | null {
    if (score >= SCORE_THRESHOLDS.platinum) return 'platinum';
    if (score >= SCORE_THRESHOLDS.gold) return 'gold';
    if (score >= SCORE_THRESHOLDS.silver) return 'silver';
    if (score >= SCORE_THRESHOLDS.bronze) return 'bronze';
    return null;
  }

  /**
   * Get high scores for a user
   */
  async getHighScores(userId: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('game_type, score')
      .eq('user_id', userId)
      .not('score', 'is', null)
      .order('score', { ascending: false });

    if (error) throw error;

    // Group by game type and get highest score
    const highScores: Record<GameType, number> = {
      'tap-pet': 0,
      'swipe-groom': 0,
      'rhythm-feed': 0,
      'fetch-together': 0,
    };

    data?.forEach((session) => {
      const gameType = session.game_type as GameType;
      if (session.score > highScores[gameType]) {
        highScores[gameType] = session.score;
      }
    });

    return highScores;
  }

  /**
   * Get total games played
   */
  async getTotalGamesPlayed(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error) return 0;
    return count || 0;
  }

  /**
   * Get recent game results
   */
  async getRecentResults(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Create co-op session
   */
  async createCoopSession(gameType: GameType, coupleId: string) {
    const { data, error } = await supabase
      .from('coop_sessions')
      .insert({
        game_type: gameType,
        couple_id: coupleId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Join existing co-op session
   */
  async joinCoopSession(sessionId: string, userId: string) {
    const { data, error } = await supabase
      .from('coop_sessions')
      .update({
        player2_id: userId,
        player2_joined_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to co-op session updates
   */
  subscribeToCoopSession(
    sessionId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`coop_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coop_sessions',
          filter: `id=eq.${sessionId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Get game config
   */
  getGameConfig(gameType: GameType) {
    return MINI_GAMES[gameType];
  }

  /**
   * Validate game result (prevent cheating)
   */
  validateResult(
    gameType: GameType,
    duration: number,
    actions: number
  ): boolean {
    const config = MINI_GAMES[gameType];

    // Duration should be reasonable (within 120% of expected)
    if (duration > config.duration * 1.2) return false;

    // Actions shouldn't exceed human limits
    const maxActionsPerSecond = 10;
    if (actions > duration * maxActionsPerSecond) return false;

    return true;
  }
}

export const gameService = new GameService();
