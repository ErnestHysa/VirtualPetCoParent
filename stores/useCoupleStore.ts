/**
 * Couple Store
 * Manages couple state, partner information, and milestones
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type {
  Couple,
  PartnerInfo,
  Profile,
  Milestone,
  Notification,
  CreateCoupleRequest,
  CoupleResponse,
} from '@/types';

interface CoupleState {
  couple: Couple | null;
  partnerInfo: PartnerInfo | null;
  notifications: Notification[];
  unreadCount: number;
  milestones: Milestone[];
  isLoading: boolean;
  error: string | null;
}

interface CoupleStore extends CoupleState {
  // Actions
  loadCouple: () => Promise<void>;
  loadPartnerInfo: () => Promise<void>;
  loadMilestones: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  pairWithPartner: (request: CreateCoupleRequest) => Promise<CoupleResponse>;
  syncCoupleData: () => Promise<void>;
  updateDaysTogether: () => void;
  addMilestone: (milestone: Omit<Milestone, 'id' | 'created_at'>) => Promise<Milestone>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCoupleStore = create<CoupleStore>()(
  persist(
    (set, get) => ({
      // Initial state
      couple: null,
      partnerInfo: null,
      notifications: [],
      unreadCount: 0,
      milestones: [],
      isLoading: false,
      error: null,

      /**
       * Load couple information for current user
       */
      loadCouple: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('No authenticated user');
          }

          // Get user's profile with couple_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('user_id', user.id)
            .single();

          if (!profile?.couple_id) {
            set({ couple: null, isLoading: false });
            return;
          }

          // Load couple
          const { data: couple, error } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profile.couple_id)
            .single();

          if (error) throw error;

          // Update days together
          const anniversary = new Date(couple.anniversary_date);
          const today = new Date();
          const daysTogether = Math.floor(
            (today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24)
          );

          set({
            couple: {
              ...couple,
              days_together: daysTogether,
            } as Couple,
            isLoading: false,
          });

          // Load partner info and milestones
          get().loadPartnerInfo();
          get().loadMilestones();
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to load couple';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Load partner information
       */
      loadPartnerInfo: async () => {
        const { couple } = get();
        if (!couple) {
          return;
        }

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            return;
          }

          // Get partner's profile
          const { data: partnerProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('couple_id', couple.id)
            .neq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (!partnerProfile) {
            set({ partnerInfo: null });
            return;
          }

          // Get partner's last seen from user_status table
          const { data: userStatus } = await supabase
            .from('user_status')
            .select('*')
            .eq('user_id', partnerProfile.user_id)
            .single();

          const partnerInfo: PartnerInfo = {
            profile: partnerProfile as Profile,
            isOnline: userStatus?.is_online || false,
            lastSeen: userStatus?.last_seen || null,
          };

          set({ partnerInfo });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to load partner info';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Load milestones for the couple
       */
      loadMilestones: async () => {
        const { couple } = get();
        if (!couple) {
          return;
        }

        try {
          const { data, error } = await supabase
            .from('milestones')
            .select('*')
            .eq('couple_id', couple.id)
            .order('achieved_at', { ascending: false });

          if (error) throw error;

          set({ milestones: data as Milestone[] });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to load milestones';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Load notifications for current user
       */
      loadNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('No authenticated user');
          }

          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          const notifications = data as Notification[];
          const unreadCount = notifications.filter((n) => !n.read).length;

          set({ notifications, unreadCount, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to load notifications';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Pair with a partner (create couple)
       */
      pairWithPartner: async (request) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('No authenticated user');
          }

          // Call database function to create couple
          const { data, error } = await supabase
            .rpc('create_couple', {
              p_partner_email: request.partner_email,
            });

          if (error) throw error;

          const response = data as CoupleResponse;

          set({
            couple: response.couple,
            partnerInfo: {
              profile: response.partner,
              isOnline: false,
              lastSeen: null,
            },
            isLoading: false,
          });

          return response;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to pair with partner';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Sync couple data with server
       */
      syncCoupleData: async () => {
        const { couple } = get();
        if (!couple) {
          return;
        }

        try {
          const { data, error } = await supabase
            .from('couples')
            .select('*')
            .eq('id', couple.id)
            .single();

          if (error) throw error;

          // Update days together
          const anniversary = new Date(data.anniversary_date);
          const today = new Date();
          const daysTogether = Math.floor(
            (today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24)
          );

          set({
            couple: {
              ...data,
              days_together: daysTogether,
            } as Couple,
          });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to sync couple data';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Update days together
       */
      updateDaysTogether: () => {
        set((state) => {
          if (!state.couple) return state;

          const anniversary = new Date(state.couple.anniversary_date || new Date().toISOString());
          const today = new Date();
          const daysTogether = Math.floor(
            (today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            couple: state.couple ? {
              ...state.couple,
              days_together: daysTogether,
            } : null,
          };
        });
      },

      /**
       * Add a milestone
       */
      addMilestone: async (milestone) => {
        const { couple } = get();
        if (!couple) {
          throw new Error('No couple found');
        }

        try {
          const { data, error } = await supabase
            .from('milestones')
            .insert({
              ...milestone,
              couple_id: couple.id,
            })
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            milestones: [data as Milestone, ...state.milestones],
          }));

          return data as Milestone;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to add milestone';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Add notification
       */
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      /**
       * Mark notification as read
       */
      markAsRead: async (notificationId) => {
        try {
          // Update in database
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

          // Update local state
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to mark notification as read';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Mark all notifications as read
       */
      markAllAsRead: async () => {
        const { notifications } = get();
        const unreadIds = notifications
          .filter((n) => !n.read)
          .map((n) => n.id);

        if (unreadIds.length === 0) {
          return;
        }

        try {
          // Update in database
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds);

          // Update local state
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to mark all as read';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Clear all notifications
       */
      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Set error
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Reset store
       */
      reset: () => set({
        couple: null,
        partnerInfo: null,
        notifications: [],
        unreadCount: 0,
        milestones: [],
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'couple-storage',
      partialize: (state) => ({
        couple: state.couple,
        partnerInfo: state.partnerInfo,
        milestones: state.milestones,
      }),
    }
  )
);
