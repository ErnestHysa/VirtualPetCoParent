/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  partnerId?: string;
  createdAt: Date;
}

/**
 * Couple relationship data
 */
export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  petId: string;
  startDate: Date;
  milestonesUnlocked: Record<string, boolean>;
  daysTogether: number;
  nextMilestone?: string;
}

/**
 * User inventory items
 */
export type InventoryItemType =
  | 'collar'
  | 'hat'
  | 'accessory'
  | 'background'
  | 'toy';

export interface InventoryItem {
  id: string;
  userId: string;
  itemType: InventoryItemType;
  itemId: string;
  isEquipped: boolean;
  unlockedAt: Date;
}

/**
 * Partner pairing code
 */
export interface PairingCode {
  code: string;
  userId: string;
  expiresAt: Date;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  careReminders: boolean;
  partnerActions: boolean;
  moodChanges: boolean;
  milestones: boolean;
  dailyMessages: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
}
