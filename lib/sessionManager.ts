/**
 * Session Manager
 * Handles session timeout detection and refresh logic
 */

import { AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export class SessionManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private appState: AppStateStatus = 'active';
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_WARNING_MS = 60 * 1000; // 1 minute before expiry

  constructor() {
    this.setupAppStateListener();
  }

  /**
   * Set up app state listener to detect when app comes to foreground
   */
  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground - check and refresh session
        this.checkAndRefreshSession();
      }
      this.appState = nextAppState;
    });
  }

  /**
   * Start automatic session refresh interval
   */
  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear any existing interval

    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshSession();
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop automatic session refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  async checkAndRefreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return false;
      }

      // Check if session is expiring soon (within 10 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const refreshThreshold = 10 * 60 * 1000; // 10 minutes

      if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
        // Refresh the session
        const { data: { session: newSession }, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }

        // Update the auth store with new session
        if (newSession) {
          useAuthStore.getState().setSession(newSession as any);
          return true;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  /**
   * Get session expiry timestamp in milliseconds
   */
  getSessionExpiry(): number | null {
    const session = useAuthStore.getState().session;
    return session?.expires_at ? session.expires_at * 1000 : null;
  }

  /**
   * Get time remaining until session expires (in seconds)
   */
  getTimeRemaining(): number {
    const expiry = this.getSessionExpiry();
    if (!expiry) return 0;

    const now = Date.now();
    const remaining = Math.max(0, expiry - now);
    return Math.floor(remaining / 1000);
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    return this.getTimeRemaining() <= 0;
  }

  /**
   * Check if session should show warning (within warning threshold)
   */
  shouldShowWarning(): boolean {
    const remaining = this.getTimeRemaining();
    return remaining > 0 && remaining <= (this.SESSION_WARNING_MS / 1000);
  }

  /**
   * Force session refresh
   */
  async forceRefresh(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (session) {
        useAuthStore.getState().setSession(session as any);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to force refresh session:', error);
      return false;
    }
  }

  /**
   * Sign out and cleanup
   */
  async signOut() {
    this.stopAutoRefresh();
    await useAuthStore.getState().signOut();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Hook to use session manager in components
 */
export function useSessionManager() {
  const startAutoRefresh = () => sessionManager.startAutoRefresh();
  const stopAutoRefresh = () => sessionManager.stopAutoRefresh();
  const checkAndRefresh = () => sessionManager.checkAndRefreshSession();
  const getSessionExpiry = () => sessionManager.getSessionExpiry();
  const getTimeRemaining = () => sessionManager.getTimeRemaining();
  const isSessionExpired = () => sessionManager.isSessionExpired();
  const shouldShowWarning = () => sessionManager.shouldShowWarning();
  const forceRefresh = () => sessionManager.forceRefresh();
  const signOut = () => sessionManager.signOut();

  return {
    startAutoRefresh,
    stopAutoRefresh,
    checkAndRefresh,
    getSessionExpiry,
    getTimeRemaining,
    isSessionExpired,
    shouldShowWarning,
    forceRefresh,
    signOut,
  };
}
