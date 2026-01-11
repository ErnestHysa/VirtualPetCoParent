/**
 * useRealtimeSync Hook
 * Manages real-time synchronization with Supabase
 */

import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, realtimeHelpers } from '@/lib/supabase';
import { Pet, Couple } from '@/types';

interface UseRealtimeSyncOptions {
  enabled?: boolean;
  onPetUpdate?: (pet: Pet) => void;
  onPartnerAction?: (action: any) => void;
  onCoupleUpdate?: (couple: Couple) => void;
}

export function useRealtimeSync(
  petId: string | null,
  coupleId: string | null,
  options: UseRealtimeSyncOptions = {}
) {
  const {
    enabled = true,
    onPetUpdate,
    onPartnerAction,
    onCoupleUpdate,
  } = options;

  // Use refs to store callbacks to avoid stale closure issues
  const onPetUpdateRef = useRef(onPetUpdate);
  const onPartnerActionRef = useRef(onPartnerAction);
  const onCoupleUpdateRef = useRef(onCoupleUpdate);

  // Update refs when callbacks change
  useLayoutEffect(() => {
    onPetUpdateRef.current = onPetUpdate;
    onPartnerActionRef.current = onPartnerAction;
    onCoupleUpdateRef.current = onCoupleUpdate;
  });

  // Track active channel names to prevent duplicates
  const activeChannelsRef = useRef<Set<string>>(new Set());
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  // Subscribe to pet updates
  useEffect(() => {
    if (!enabled || !petId) return;

    const channelName = `pet:${petId}`;

    // Prevent duplicate subscriptions
    if (activeChannelsRef.current.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `id=eq.${petId}`,
        },
        (payload) => {
          if (payload.new && onPetUpdateRef.current) {
            onPetUpdateRef.current(payload.new as Pet);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pet updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to pet updates');
          activeChannelsRef.current.delete(channelName);
          channelsRef.current.delete(channelName);
        }
      });

    activeChannelsRef.current.add(channelName);
    channelsRef.current.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      activeChannelsRef.current.delete(channelName);
      channelsRef.current.delete(channelName);
    };
  }, [petId, enabled]);

  // Subscribe to care actions (partner's actions)
  useEffect(() => {
    if (!enabled || !petId) return;

    const channelName = `care_actions:${petId}`;

    // Prevent duplicate subscriptions
    if (activeChannelsRef.current.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'care_actions',
          filter: `pet_id=eq.${petId}`,
        },
        (payload) => {
          if (onPartnerActionRef.current) {
            onPartnerActionRef.current(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          activeChannelsRef.current.delete(channelName);
          channelsRef.current.delete(channelName);
        }
      });

    activeChannelsRef.current.add(channelName);
    channelsRef.current.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      activeChannelsRef.current.delete(channelName);
      channelsRef.current.delete(channelName);
    };
  }, [petId, enabled]);

  // Subscribe to couple updates
  useEffect(() => {
    if (!enabled || !coupleId) return;

    const channelName = `couple:${coupleId}`;

    // Prevent duplicate subscriptions
    if (activeChannelsRef.current.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.new && onCoupleUpdateRef.current) {
            onCoupleUpdateRef.current(payload.new as Couple);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          activeChannelsRef.current.delete(channelName);
          channelsRef.current.delete(channelName);
        }
      });

    activeChannelsRef.current.add(channelName);
    channelsRef.current.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      activeChannelsRef.current.delete(channelName);
      channelsRef.current.delete(channelName);
    };
  }, [coupleId, enabled]);

  // Cleanup all subscriptions
  const cleanup = useCallback(() => {
    channelsRef.current.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    activeChannelsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: channelsRef.current.size > 0,
    cleanup,
  };
}
