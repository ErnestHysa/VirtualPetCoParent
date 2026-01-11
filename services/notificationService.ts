/**
 * Notification Service
 * Handles push notifications and scheduling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type NotificationType =
  | 'care_reminder'
  | 'partner_action'
  | 'mood_change'
  | 'milestone'
  | 'daily_message';

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize notifications
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (!Device.isDevice) {
      console.log('Notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Get push token for device
    const token = await this.getPushToken();
    if (token) {
      await this.savePushToken(token);
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Get push token for device
   */
  async getPushToken(): Promise<string | null> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E8B4B8',
      });
    }

    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
    });

    return tokenData?.data || null;
  }

  /**
   * Save push token to Supabase
   */
  async savePushToken(token: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    // Store token in user's profile or separate tokens table
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token });

    if (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(
    type: NotificationType,
    title: string,
    body: string,
    delaySeconds = 0,
    data?: Record<string, any>
  ) {
    const trigger = delaySeconds > 0
      ? { seconds: delaySeconds }
      : null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || { type },
        sound: true,
      },
      trigger,
    });
  }

  /**
   * Send care reminder notification
   */
  async sendCareReminder(petName: string, statType: 'hunger' | 'happiness' | 'energy') {
    const messages = {
      hunger: `Our little ${petName} is getting hungry! 🍖`,
      happiness: `${petName} is feeling lonely—time for a play session? 🎮`,
      energy: `${petName} is tired. Maybe a gentle rest? 💤`,
    };

    await this.scheduleNotification(
      'care_reminder',
      'Time to check in!',
      messages[statType],
      0
    );
  }

  /**
   * Send partner action notification
   */
  async sendPartnerActionNotification(
    partnerName: string,
    action: string,
    petName: string
  ) {
    const actionMessages: Record<string, string> = {
      feed: `${partnerName} just fed ${petName}! Want to play too?`,
      play: `${partnerName} is playing with ${petName}! Join the fun!`,
      walk: `${partnerName} took ${petName} for a walk!`,
      pet: `${partnerName} gave ${petName} some love! 💕`,
    };

    await this.scheduleNotification(
      'partner_action',
      `${partnerName} cares!`,
      actionMessages[action] || `${partnerName} is taking care of ${petName}`,
      0
    );
  }

  /**
   * Send milestone notification
   */
  async sendMilestoneNotification(milestone: string, petName: string) {
    await this.scheduleNotification(
      'milestone',
      'Milestone reached! 🎉',
      `${petName} has reached a new milestone: ${milestone}!`,
      0
    );
  }

  /**
   * Send daily sweet message
   */
  async sendDailyMessage(message: string) {
    await this.scheduleNotification(
      'daily_message',
      'A message for you 💕',
      message,
      0
    );
  }

  /**
   * Schedule recurring care reminders
   */
  async scheduleCareReminders(petId: string) {
    // Cancel existing schedules for this pet
    await this.cancelPetNotifications(petId);

    // Schedule reminder every 4 hours if no care action
    // This is a simplified version - real implementation would check last care time
    const identifiers = await Notifications.scheduleNotificationAsync([
      {
        content: {
          title: 'Check on your pet!',
          body: 'Your little friend might be missing you...',
          data: { type: 'care_reminder', petId },
        },
        trigger: {
          seconds: 4 * 60 * 60, // 4 hours
          repeats: true,
        },
      },
    ]);

    return identifiers;
  }

  /**
   * Cancel all notifications for a pet
   */
  async cancelPetNotifications(petId: string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      (n) => n.content.data?.petId === petId
    );

    for (const notification of toCancel) {
      if (notification.identifier) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification channels (Android)
   */
  async getNotificationChannels() {
    if (Platform.OS !== 'android') return [];

    return await Notifications.getNotificationChannelsAsync();
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Add notification received listener (foreground)
   */
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler);
  }
}

export const notificationService = new NotificationService();
