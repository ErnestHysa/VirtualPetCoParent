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

  // Compatibility fields for DB-shaped couple objects used in some stores
  anniversary_date?: string;
  days_together?: number;
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

/**
 * Extended social types used by the couple store
 */
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  couple_id?: string | null;
  partner_id?: string | null;
  created_at?: string;
}

export interface PartnerInfo {
  profile: Profile;
  isOnline: boolean;
  lastSeen: string | null;
}

export interface Milestone {
  id: string;
  couple_id: string;
  milestone_type: string;
  achieved_at: string;
  evolution_unlocked?: string | null;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title?: string;
  body?: string;
  type?: string;
  read: boolean;
  created_at: string;
}

export interface CreateCoupleRequest {
  partner_email: string;
}

export interface CoupleResponse {
  couple: Couple;
  partner: Profile;
}
