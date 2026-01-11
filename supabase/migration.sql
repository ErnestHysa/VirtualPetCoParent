-- Virtual Pet Co-Parent: Supabase Migration
-- Run this in Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couples table
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE NOT NULL,
  milestones_unlocked JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dragon', 'cat', 'fox', 'puppy')),
  color TEXT NOT NULL DEFAULT '#FFFFFF',
  name TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'egg' CHECK (current_stage IN ('egg', 'baby', 'child', 'teen', 'adult', 'elder')),
  hunger INTEGER NOT NULL DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  happiness INTEGER NOT NULL DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  energy INTEGER NOT NULL DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  personality_type JSONB DEFAULT '{"playful": 25, "calm": 25, "mischievous": 25, "affectionate": 25}'::jsonb,
  xp INTEGER NOT NULL DEFAULT 0,
  last_care_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care actions table
CREATE TABLE IF NOT EXISTS care_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('feed', 'play', 'walk', 'pet', 'groom')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  bonus_points INTEGER DEFAULT 0
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  evolution_unlocked TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('collar', 'hat', 'accessory', 'background', 'toy')),
  item_id TEXT NOT NULL,
  is_equipped BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pairing codes table (temporary)
CREATE TABLE IF NOT EXISTS pairing_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL CHECK (game_type IN ('tap-pet', 'swipe-groom', 'rhythm-feed', 'fetch-together')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  is_coop BOOLEAN DEFAULT FALSE,
  score INTEGER,
  accuracy INTEGER,
  coop_bonus INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Co-op sessions table
CREATE TABLE IF NOT EXISTS coop_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  player1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player1_joined_at TIMESTAMPTZ DEFAULT NOW(),
  player2_joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_couples_users ON couples(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_pets_couple ON pets(couple_id);
CREATE INDEX IF NOT EXISTS idx_care_actions_pet ON care_actions(pet_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_care_actions_user ON care_actions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_couple ON milestones(couple_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_code ON pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_expires ON pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id, completed_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their partner's profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );

-- RLS Policies for couples
CREATE POLICY "Users can view their couple"
  ON couples FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

-- RLS Policies for pets
CREATE POLICY "Users can view their pet"
  ON pets FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "Users can update their pet"
  ON pets FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- RLS Policies for care_actions
CREATE POLICY "Users can view their pet's care actions"
  ON care_actions FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM pets WHERE
        couple_id IN (SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id))
    )
  );

CREATE POLICY "Users can insert care actions for their pet"
  ON care_actions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    pet_id IN (
      SELECT id FROM pets WHERE
        couple_id IN (SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id))
    )
  );

-- RLS Policies for milestones
CREATE POLICY "Users can view their milestones"
  ON milestones FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

-- RLS Policies for inventory
CREATE POLICY "Users can view their inventory"
  ON inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their inventory"
  ON inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for pairing_codes
CREATE POLICY "Users can view their own pairing codes"
  ON pairing_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pairing codes"
  ON pairing_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for push_tokens
CREATE POLICY "Users can manage their push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to perform care action
CREATE OR REPLACE FUNCTION perform_care_action(
  p_pet_id UUID,
  p_action_type TEXT
)
RETURNS JSON AS $$
DECLARE
  v_pet RECORD;
  v_xp_gained INTEGER := 10;
BEGIN
  -- Lock and fetch pet
  SELECT * INTO v_pet FROM pets WHERE id = p_pet_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pet not found');
  END IF;

  -- Apply care effects
  CASE p_action_type
    WHEN 'feed' THEN
      UPDATE pets SET
        hunger = LEAST(100, hunger + 20),
        energy = LEAST(100, energy + 5),
        happiness = LEAST(100, happiness + 5),
        xp = xp + v_xp_gained,
        last_care_at = NOW()
      WHERE id = p_pet_id;
    WHEN 'play' THEN
      UPDATE pets SET
        hunger = GREATEST(0, hunger - 5),
        energy = GREATEST(0, energy - 10),
        happiness = LEAST(100, happiness + 25),
        xp = xp + v_xp_gained * 2,
        last_care_at = NOW()
      WHERE id = p_pet_id;
    WHEN 'walk' THEN
      UPDATE pets SET
        hunger = GREATEST(0, hunger - 10),
        energy = GREATEST(0, energy - 15),
        happiness = LEAST(100, happiness + 15),
        xp = xp + v_xp_gained * 1.5,
        last_care_at = NOW()
      WHERE id = p_pet_id;
    WHEN 'pet' THEN
      UPDATE pets SET
        happiness = LEAST(100, happiness + 10),
        xp = xp + v_xp_gained * 0.5,
        last_care_at = NOW()
      WHERE id = p_pet_id;
    WHEN 'groom' THEN
      UPDATE pets SET
        energy = GREATEST(0, energy - 5),
        happiness = LEAST(100, happiness + 15),
        xp = xp + v_xp_gained,
        last_care_at = NOW()
      WHERE id = p_pet_id;
  END CASE;

  -- Fetch updated pet
  SELECT * INTO v_pet FROM pets WHERE id = p_pet_id;

  RETURN json_build_object(
    'success', true,
    'pet', row_to_json(v_pet),
    'xp_gained', v_xp_gained
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check evolution eligibility
CREATE OR REPLACE FUNCTION check_evolution(
  p_pet_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_pet RECORD;
  v_can_evolve BOOLEAN := false;
  v_new_stage TEXT := NULL;
  v_streak_days INTEGER := 0;
BEGIN
  SELECT * INTO v_pet FROM pets WHERE id = p_pet_id;

  IF NOT FOUND THEN
    RETURN json_build_object('can_evolve', false, 'new_stage', NULL);
  END IF;

  -- Calculate care streak (simplified - count days with care actions in last 100 days)
  SELECT COUNT(DISTINCT DATE(timestamp)) INTO v_streak_days
  FROM care_actions
  WHERE pet_id = p_pet_id
    AND timestamp > NOW() - INTERVAL '100 days';

  -- Check evolution requirements
  IF v_pet.current_stage = 'egg' AND v_streak_days >= 3 THEN
    v_can_evolve := true;
    v_new_stage := 'baby';
  ELSIF v_pet.current_stage = 'baby' AND v_streak_days >= 14 THEN
    v_can_evolve := true;
    v_new_stage := 'child';
  ELSIF v_pet.current_stage = 'child' AND v_streak_days >= 30 THEN
    v_can_evolve := true;
    v_new_stage := 'teen';
  ELSIF v_pet.current_stage = 'teen' AND v_streak_days >= 60 THEN
    v_can_evolve := true;
    v_new_stage := 'adult';
  ELSIF v_pet.current_stage = 'adult' AND v_streak_days >= 100 THEN
    v_can_evolve := true;
    v_new_stage := 'elder';
  END IF;

  RETURN json_build_object(
    'can_evolve', v_can_evolve,
    'new_stage', v_new_stage,
    'streak_days', v_streak_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create trigger for pet updates
CREATE OR REPLACE FUNCTION notify_pet_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('pet_update', json_build_object(
    'id', NEW.id,
    'hunger', NEW.hunger,
    'happiness', NEW.happiness,
    'energy', NEW.energy,
    'current_stage', NEW.current_stage
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
