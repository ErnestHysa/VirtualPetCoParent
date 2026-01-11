-- Virtual Pet Co-Parent - Initial Database Schema
-- Migration: 001_initial_schema
-- Created: 2025-01-10

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional user data
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COUPLES TABLE
-- Links two partners together with their shared pet
-- =====================================================
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  relationship_anniversary DATE,
  milestones_unlocked JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user1_id < user2_id to prevent duplicate couples
  CONSTRAINT couples_ordering CHECK (user1_id < user2_id)
);

-- =====================================================
-- PETS TABLE
-- Shared pet with stats and personality
-- =====================================================
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  species TEXT NOT NULL CHECK (species IN ('dragon', 'cat', 'fox', 'puppy')),
  color TEXT NOT NULL,
  name TEXT NOT NULL,
  current_stage TEXT DEFAULT 'egg' CHECK (current_stage IN ('egg', 'baby', 'child', 'teen', 'adult', 'elder', 'milestone')),
  hunger INTEGER DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  happiness INTEGER DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  energy INTEGER DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  personality_type JSONB DEFAULT '{
    "playful": 0,
    "calm": 0,
    "mischievous": 0,
    "affectionate": 0
  }'::jsonb,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_care_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CARE ACTIONS TABLE
-- Records all feed/play/walk/pet actions
-- =====================================================
CREATE TABLE IF NOT EXISTS care_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('feed', 'play', 'walk', 'pet')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  bonus_points INTEGER DEFAULT 0,
  co_op_bonus BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- MILESTONES TABLE
-- Tracks evolution and relationship milestones
-- =====================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'first_meet',
    'three_day_streak',
    'fourteen_day_streak',
    'thirty_day_streak',
    'sixty_day_streak',
    'hundred_day_streak',
    'first_evolution',
    'personality_developed',
    'in_person_visit',
    'perfect_day'
  )),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  evolution_unlocked TEXT,
  celebrated_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INVENTORY TABLE
-- User accessories and customization items
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'collar',
    'hat',
    'toy',
    'background',
    'frame',
    'decoration'
  )),
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_equipped BOOLEAN DEFAULT FALSE,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- PET_MESSAGES TABLE
-- Stores cute messages sent by the pet
-- =====================================================
CREATE TABLE IF NOT EXISTS pet_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'status' CHECK (message_type IN ('status', 'miss_you', 'celebration', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION_PREFERENCES TABLE
-- User notification settings
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  care_reminders_enabled BOOLEAN DEFAULT TRUE,
  partner_action_notifications BOOLEAN DEFAULT TRUE,
  milestone_notifications BOOLEAN DEFAULT TRUE,
  daily_message_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- Improve query performance
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Couples indexes
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_pet_id ON couples(pet_id);

-- Pets indexes
CREATE INDEX IF NOT EXISTS idx_pets_couple_id ON pets(couple_id);
CREATE INDEX IF NOT EXISTS idx_pets_current_stage ON pets(current_stage);

-- Care actions indexes
CREATE INDEX IF NOT EXISTS idx_care_actions_pet_id ON care_actions(pet_id);
CREATE INDEX IF NOT EXISTS idx_care_actions_user_id ON care_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_care_actions_timestamp ON care_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_care_actions_pet_timestamp ON care_actions(pet_id, timestamp);

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_milestones_couple_id ON milestones(couple_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(user_id, is_equipped);

-- Pet messages indexes
CREATE INDEX IF NOT EXISTS idx_pet_messages_pet_id ON pet_messages(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_messages_is_read ON pet_messages(is_read);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at
  BEFORE UPDATE ON couples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function: Calculate pet overall wellness
CREATE OR REPLACE FUNCTION calculate_pet_wellness(pet_id UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_stats NUMERIC;
BEGIN
  SELECT (hunger + happiness + energy) / 3.0
  INTO avg_stats
  FROM pets
  WHERE id = pet_id;

  RETURN ROUND(avg_stats)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if pet should evolve
CREATE OR REPLACE FUNCTION check_pet_evolution(pet_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_pet pets%ROWTYPE;
  new_stage TEXT;
BEGIN
  SELECT * INTO current_pet FROM pets WHERE id = pet_id;

  new_stage := current_pet.current_stage;

  -- Evolution logic based on streak days and xp
  CASE current_pet.current_stage
    WHEN 'egg' THEN
      IF current_pet.streak_days >= 3 AND current_pet.xp >= 50 THEN
        new_stage := 'baby';
      END IF;
    WHEN 'baby' THEN
      IF current_pet.streak_days >= 14 AND current_pet.xp >= 200 THEN
        new_stage := 'child';
      END IF;
    WHEN 'child' THEN
      IF current_pet.streak_days >= 30 AND current_pet.xp >= 500 THEN
        new_stage := 'teen';
      END IF;
    WHEN 'teen' THEN
      IF current_pet.streak_days >= 60 AND current_pet.xp >= 1000 THEN
        new_stage := 'adult';
      END IF;
    WHEN 'adult' THEN
      IF current_pet.streak_days >= 100 AND current_pet.xp >= 2000 THEN
        new_stage := 'elder';
      END IF;
  END CASE;

  -- Update pet stage if evolved
  IF new_stage != current_pet.current_stage THEN
    UPDATE pets
    SET current_stage = new_stage,
        updated_at = NOW()
    WHERE id = pet_id;

    -- Record milestone
    INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
    VALUES (current_pet.couple_id, 'first_evolution', new_stage);
  END IF;

  RETURN new_stage;
END;
$$ LANGUAGE plpgsql;

-- Function: Get recent care actions for cooldown check
CREATE OR REPLACE FUNCTION get_last_action_timestamp(pet_id UUID, user_id UUID, action_type TEXT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  last_timestamp TIMESTAMPTZ;
BEGIN
  SELECT timestamp
  INTO last_timestamp
  FROM care_actions
  WHERE pet_id = pet_id
    AND user_id = user_id
    AND action_type = action_type
  ORDER BY timestamp DESC
  LIMIT 1;

  RETURN COALESCE(last_timestamp, '-infinity'::TIMESTAMPTZ);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can read their partner's profile if linked
CREATE POLICY "Users can view partner profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid(),
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );

-- =====================================================
-- COUPLES RLS POLICIES
-- =====================================================

-- Users can read their couple data
CREATE POLICY "Users can view own couple"
  ON couples FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

-- Users can update their couple data
CREATE POLICY "Users can update own couple"
  ON couples FOR UPDATE
  USING (auth.uid() IN (user1_id, user2_id));

-- Users can insert couple data if they're one of the partners
CREATE POLICY "Users can insert own couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- =====================================================
-- PETS RLS POLICIES
-- =====================================================

-- Partners can read their shared pet
CREATE POLICY "Partners can view shared pet"
  ON pets FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- Partners can update their shared pet
CREATE POLICY "Partners can update shared pet"
  ON pets FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- Users can insert pet for their couple
CREATE POLICY "Users can insert pet for couple"
  ON pets FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- =====================================================
-- CARE ACTIONS RLS POLICIES
-- =====================================================

-- Partners can read care actions for their pet
CREATE POLICY "Partners can view care actions"
  ON care_actions FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM pets WHERE couple_id IN (
        SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
      )
    )
  );

-- Partners can insert care actions for their pet
CREATE POLICY "Partners can insert care actions"
  ON care_actions FOR INSERT
  WITH CHECK (
    pet_id IN (
      SELECT id FROM pets WHERE couple_id IN (
        SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
      )
    )
    AND auth.uid() = user_id
  );

-- =====================================================
-- MILESTONES RLS POLICIES
-- =====================================================

-- Partners can read their milestones
CREATE POLICY "Partners can view milestones"
  ON milestones FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- System can insert milestones (via functions)
CREATE POLICY "System can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- INVENTORY RLS POLICIES
-- =====================================================

-- Users can read their own inventory
CREATE POLICY "Users can view own inventory"
  ON inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own inventory
CREATE POLICY "Users can update own inventory"
  ON inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert to their own inventory
CREATE POLICY "Users can insert to own inventory"
  ON inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own inventory
CREATE POLICY "Users can delete from own inventory"
  ON inventory FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PET MESSAGES RLS POLICIES
-- =====================================================

-- Partners can read pet messages
CREATE POLICY "Partners can view pet messages"
  ON pet_messages FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM pets WHERE couple_id IN (
        SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
      )
    )
  );

-- Partners can update pet messages (mark as read)
CREATE POLICY "Partners can update pet messages"
  ON pet_messages FOR UPDATE
  USING (
    pet_id IN (
      SELECT id FROM pets WHERE couple_id IN (
        SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
      )
    )
  );

-- =====================================================
-- NOTIFICATION PREFERENCES RLS POLICIES
-- =====================================================

-- Users can read their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA / SEEDS
-- =====================================================

-- Note: No seed data inserted here to allow users to create their own pets
-- Additional migration files can add seed data if needed

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant select on existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
