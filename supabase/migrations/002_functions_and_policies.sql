-- Virtual Pet Co-Parent - Advanced Functions and Policies
-- Migration: 002_functions_and_policies
-- Created: 2025-01-10

-- =====================================================
-- EDGE FUNCTION SUPPORT
-- Additional functions for Edge Functions to call
-- =====================================================

-- Function: Record care action with validation and cooldown check
CREATE OR REPLACE FUNCTION record_care_action(
  p_pet_id UUID,
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  last_action_time TIMESTAMPTZ;
  cooldown_minutes INTEGER := 5; -- 5 minute cooldown
  can_perform_action BOOLEAN := TRUE;
  cooldown_remaining INTEGER := 0;
  pet_record pets%ROWTYPE;
  bonus_points INTEGER := 0;
  is_co_op BOOLEAN := FALSE;
  action_result JSONB;
BEGIN
  -- Check if user owns this pet (is in couple)
  SELECT * INTO pet_record FROM pets WHERE id = p_pet_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pet not found',
      'code', 'PET_NOT_FOUND'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM couples
    WHERE id = pet_record.couple_id
    AND p_user_id IN (user1_id, user2_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a pet owner',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Check cooldown
  last_action_time := get_last_action_timestamp(p_pet_id, p_user_id, p_action_type);

  IF last_action_time > NOW() - (cooldown_minutes || ' minutes')::INTERVAL THEN
    cooldown_remaining := cooldown_minutes - EXTRACT(MINUTE FROM NOW() - last_action_time);
    can_perform_action := FALSE;
  END IF;

  -- Check if partner performed same action recently (co-op bonus)
  IF EXISTS (
    SELECT 1 FROM care_actions
    WHERE pet_id = p_pet_id
      AND user_id != p_user_id
      AND action_type = p_action_type
      AND timestamp > NOW() - (10 || ' minutes')::INTERVAL
  ) THEN
    is_co_op := TRUE;
    bonus_points := 10;
  END IF;

  -- If cooldown passed, record action and update pet stats
  IF can_perform_action THEN
    -- Insert care action
    INSERT INTO care_actions (pet_id, user_id, action_type, bonus_points, co_op_bonus)
    VALUES (p_pet_id, p_user_id, p_action_type, bonus_points, is_co_op);

    -- Update pet stats based on action type
    CASE p_action_type
      WHEN 'feed' THEN
        UPDATE pets SET
          hunger = LEAST(100, hunger + 15),
          happiness = LEAST(100, happiness + 5),
          xp = xp + 10 + bonus_points,
          last_care_timestamp = NOW(),
          updated_at = NOW()
        WHERE id = p_pet_id;
      WHEN 'play' THEN
        UPDATE pets SET
          happiness = LEAST(100, happiness + 15),
          energy = GREATEST(0, energy - 10),
          xp = xp + 10 + bonus_points,
          last_care_timestamp = NOW(),
          updated_at = NOW()
        WHERE id = p_pet_id;
      WHEN 'walk' THEN
        UPDATE pets SET
          energy = GREATEST(0, energy - 15),
          happiness = LEAST(100, happiness + 10),
          xp = xp + 15 + bonus_points,
          last_care_timestamp = NOW(),
          updated_at = NOW()
        WHERE id = p_pet_id;
      WHEN 'pet' THEN
        UPDATE pets SET
          happiness = LEAST(100, happiness + 10),
          xp = xp + 5 + bonus_points,
          last_care_timestamp = NOW(),
          updated_at = NOW()
        WHERE id = p_pet_id;
    END CASE;

    -- Update personality based on action patterns
    UPDATE pets SET
      personality_type = personality_type || jsonb_build_object(
        CASE p_action_type
          WHEN 'play' THEN 'playful'
          WHEN 'pet' THEN 'affectionate'
          WHEN 'walk' THEN 'calm'
          ELSE 'playful'
        END,
        COALESCE((personality_type->>CASE p_action_type
          WHEN 'play' THEN 'playful'
          WHEN 'pet' THEN 'affectionate'
          WHEN 'walk' THEN 'calm'
          ELSE 'playful'
        END)::INTEGER, 0) + 1
      ),
      updated_at = NOW()
    WHERE id = p_pet_id;

    -- Check for evolution
    PERFORM check_pet_evolution(p_pet_id);

    -- Build success response
    SELECT * INTO pet_record FROM pets WHERE id = p_pet_id;
    action_result := jsonb_build_object(
      'success', true,
      'message', 'Action recorded successfully',
      'action_type', p_action_type,
      'bonus_points', bonus_points,
      'is_co_op', is_co_op,
      'pet', jsonb_build_object(
        'hunger', pet_record.hunger,
        'happiness', pet_record.happiness,
        'energy', pet_record.energy,
        'xp', pet_record.xp,
        'current_stage', pet_record.current_stage
      )
    );
  ELSE
    -- Build cooldown response
    action_result := jsonb_build_object(
      'success', false,
      'error', 'Action is on cooldown',
      'code', 'COOLDOWN_ACTIVE',
      'cooldown_remaining_seconds', cooldown_remaining * 60,
      'cooldown_remaining_minutes', cooldown_remaining
    );
  END IF;

  RETURN action_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PET DECAY AND STREAK FUNCTIONS
-- =====================================================

-- Function: Apply pet stat decay (called by scheduled function)
CREATE OR REPLACE FUNCTION apply_pet_decay()
RETURNS VOID AS $$
BEGIN
  -- Decay stats over time if not cared for
  UPDATE pets SET
    hunger = GREATEST(0, hunger - 5),
    happiness = GREATEST(0, happiness - 5),
    energy = LEAST(100, energy + 5), -- Energy recovers over time
    updated_at = NOW()
  WHERE last_care_timestamp < NOW() - (1 || ' hour')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update daily streaks
CREATE OR REPLACE FUNCTION update_daily_streaks()
RETURNS VOID AS $$
DECLARE
  couple_record RECORD;
  actions_today INTEGER;
BEGIN
  FOR couple_record IN
    SELECT id FROM couples
  LOOP
    -- Check if both partners performed actions today
    SELECT COUNT(DISTINCT user_id)
    INTO actions_today
    FROM care_actions
    WHERE pet_id IN (SELECT pet_id FROM couples WHERE id = couple_record.id)
      AND DATE(timestamp) = CURRENT_DATE;

    -- If both partners participated, increment streak
    IF actions_today >= 2 THEN
      UPDATE pets SET
        streak_days = streak_days + 1,
        xp = xp + 20, -- Daily streak bonus
        updated_at = NOW()
      WHERE couple_id = couple_record.id;

      -- Check for milestone streaks
      IF EXISTS (
        SELECT 1 FROM pets
        WHERE couple_id = couple_record.id
          AND streak_days = 3
      ) THEN
        INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
        VALUES (couple_record.id, 'three_day_streak', 'baby')
        ON CONFLICT DO NOTHING;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pets
        WHERE couple_id = couple_record.id
          AND streak_days = 14
      ) THEN
        INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
        VALUES (couple_record.id, 'fourteen_day_streak', 'child')
        ON CONFLICT DO NOTHING;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pets
        WHERE couple_id = couple_record.id
          AND streak_days = 30
      ) THEN
        INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
        VALUES (couple_record.id, 'thirty_day_streak', 'teen')
        ON CONFLICT DO NOTHING;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pets
        WHERE couple_id = couple_record.id
          AND streak_days = 60
      ) THEN
        INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
        VALUES (couple_record.id, 'sixty_day_streak', 'adult')
        ON CONFLICT DO NOTHING;
      END IF;

      IF EXISTS (
        SELECT 1 FROM pets
        WHERE couple_id = couple_record.id
          AND streak_days = 100
      ) THEN
        INSERT INTO milestones (couple_id, milestone_type, evolution_unlocked)
        VALUES (couple_record.id, 'hundred_day_streak', 'elder')
        ON CONFLICT DO NOTHING;
      END IF;
    ELSE
      -- Reset streak if day was missed
      UPDATE pets SET
        streak_days = 0,
        updated_at = NOW()
      WHERE couple_id = couple_record.id
        AND DATE(last_care_timestamp) < CURRENT_DATE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COUPLE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: Create couple and link partners
CREATE OR REPLACE FUNCTION create_couple(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS JSONB AS $$
DECLARE
  new_couple_id UUID;
  existing_couple_id UUID;
BEGIN
  -- Check if couple already exists
  SELECT id INTO existing_couple_id
  FROM couples
  WHERE user1_id IN (p_user1_id, p_user2_id)
    AND user2_id IN (p_user1_id, p_user2_id);

  IF existing_couple_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Couple already exists',
      'code', 'COUPLE_EXISTS',
      'couple_id', existing_couple_id
    );
  END IF;

  -- Check if either user is already in a couple
  IF EXISTS (
    SELECT 1 FROM couples
    WHERE p_user1_id IN (user1_id, user2_id)
       OR p_user2_id IN (user1_id, user2_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'One or both users already in a couple',
      'code', 'USER_ALREADY_PAIRED'
    );
  END IF;

  -- Ensure user1_id < user2_id for consistency
  IF p_user1_id > p_user2_id THEN
    new_couple_id := p_user2_id;
    p_user2_id := p_user1_id;
    p_user1_id := new_couple_id;
  END IF;

  -- Create couple
  INSERT INTO couples (user1_id, user2_id)
  VALUES (p_user1_id, p_user2_id)
  RETURNING id INTO new_couple_id;

  -- Update profiles with partner links
  UPDATE profiles
  SET partner_id = p_user2_id
  WHERE id = p_user1_id;

  UPDATE profiles
  SET partner_id = p_user1_id
  WHERE id = p_user2_id;

  -- Record milestone
  INSERT INTO milestones (couple_id, milestone_type)
  VALUES (new_couple_id, 'first_meet');

  RETURN jsonb_build_object(
    'success', true,
    'couple_id', new_couple_id,
    'message', 'Couple created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Adopt pet for couple
CREATE OR REPLACE FUNCTION adopt_pet(
  p_couple_id UUID,
  p_species TEXT,
  p_color TEXT,
  p_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_pet_id UUID;
  existing_pet_id UUID;
BEGIN
  -- Check if couple already has a pet
  SELECT pet_id INTO existing_pet_id
  FROM couples
  WHERE id = p_couple_id;

  IF existing_pet_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Couple already has a pet',
      'code', 'PET_EXISTS',
      'pet_id', existing_pet_id
    );
  END IF;

  -- Create pet
  INSERT INTO pets (couple_id, species, color, name, current_stage)
  VALUES (p_couple_id, p_species, p_color, p_name, 'egg')
  RETURNING id INTO new_pet_id;

  -- Link pet to couple
  UPDATE couples
  SET pet_id = new_pet_id
  WHERE id = p_couple_id;

  RETURN jsonb_build_object(
    'success', true,
    'pet_id', new_pet_id,
    'message', 'Pet adopted successfully',
    'pet', jsonb_build_object(
      'id', new_pet_id,
      'name', p_name,
      'species', p_species,
      'color', p_color,
      'current_stage', 'egg'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PET MESSAGE GENERATION
-- =====================================================

-- Function: Generate pet message based on state
CREATE OR REPLACE FUNCTION generate_pet_message(p_pet_id UUID, p_message_type TEXT DEFAULT 'status')
RETURNS JSONB AS $$
DECLARE
  pet_record pets%ROWTYPE;
  message_text TEXT;
  new_message_id UUID;
BEGIN
  -- Get pet data
  SELECT * INTO pet_record FROM pets WHERE id = p_pet_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pet not found'
    );
  END IF;

  -- Generate message based on type
  CASE p_message_type
    WHEN 'status' THEN
      IF pet_record.hunger < 30 THEN
        message_text := 'I''m getting hungry... could use a snack!';
      ELSIF pet_record.happiness < 30 THEN
        message_text := 'Feeling a bit lonely... play with me?';
      ELSIF pet_record.energy < 30 THEN
        message_text := 'So sleepy... maybe a nap would help?';
      ELSE
        message_text := 'I''m feeling great! Thanks for taking such good care of me!';
      END IF;

    WHEN 'miss_you' THEN
      message_text := 'I miss both of you together! When will we all play again?';

    WHEN 'celebration' THEN
      message_text := 'Yay! We did something amazing together!';

    WHEN 'reminder' THEN
      IF pet_record.hunger < 40 THEN
        message_text := 'My tummy is rumbling... feed me please!';
      ELSIF pet_record.happiness < 40 THEN
        message_text := 'I need some attention and love!';
      ELSE
        message_text := 'Come play with me!';
      END IF;

    ELSE
      message_text := 'I love my co-parents!';
  END CASE;

  -- Insert message
  INSERT INTO pet_messages (pet_id, message, message_type)
  VALUES (p_pet_id, message_text, p_message_type)
  RETURNING id INTO new_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', new_message_id,
    'message_text', message_text,
    'message_type', p_message_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INVENTORY FUNCTIONS
-- =====================================================

-- Function: Add inventory item to user
CREATE OR REPLACE FUNCTION add_inventory_item(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id TEXT,
  p_name TEXT,
  p_rarity TEXT DEFAULT 'common'
)
RETURNS JSONB AS $$
DECLARE
  new_item_id UUID;
BEGIN
  INSERT INTO inventory (user_id, item_type, item_id, name, rarity)
  VALUES (p_user_id, p_item_type, p_item_id, p_name, p_rarity)
  RETURNING id INTO new_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', new_item_id,
    'message', 'Item added to inventory'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Equip inventory item
CREATE OR REPLACE FUNCTION equip_inventory_item(
  p_user_id UUID,
  p_item_id UUID
)
RETURNS JSONB AS $$
DECLARE
  item_record inventory%ROWTYPE;
BEGIN
  -- Get item
  SELECT * INTO item_record FROM inventory WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found',
      'code', 'ITEM_NOT_FOUND'
    );
  END IF;

  IF item_record.user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item does not belong to user',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Unequip other items of same type
  UPDATE inventory
  SET is_equipped = FALSE
  WHERE user_id = p_user_id
    AND item_type = item_record.item_type
    AND is_equipped = TRUE;

  -- Equip selected item
  UPDATE inventory
  SET is_equipped = TRUE
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item equipped successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function: Get couple statistics
CREATE OR REPLACE FUNCTION get_couple_stats(p_couple_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', (SELECT COUNT(*) FROM care_actions WHERE pet_id IN (SELECT pet_id FROM couples WHERE id = p_couple_id)),
    'total_xp', (SELECT COALESCE(xp, 0) FROM pets WHERE couple_id = p_couple_id),
    'current_streak', (SELECT COALESCE(streak_days, 0) FROM pets WHERE couple_id = p_couple_id),
    'milestones_unlocked', (SELECT COUNT(*) FROM milestones WHERE couple_id = p_couple_id),
    'days_together', (SELECT EXTRACT(DAY FROM CURRENT_DATE - start_date)::INTEGER FROM couples WHERE id = p_couple_id),
    'pet_wellness', (SELECT calculate_pet_wellness(id) FROM pets WHERE couple_id = p_couple_id)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS FOR FUNCTIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION record_care_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_action_timestamp TO authenticated;
GRANT EXECUTE ON FUNCTION check_pet_evolution TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_pet_wellness TO authenticated;
GRANT EXECUTE ON FUNCTION create_couple TO authenticated;
GRANT EXECUTE ON FUNCTION adopt_pet TO authenticated;
GRANT EXECUTE ON FUNCTION generate_pet_message TO authenticated;
GRANT EXECUTE ON FUNCTION add_inventory_item TO authenticated;
GRANT EXECUTE ON FUNCTION equip_inventory_item TO authenticated;
GRANT EXECUTE ON FUNCTION get_couple_stats TO authenticated;

-- Service role grants for scheduled functions
GRANT EXECUTE ON FUNCTION apply_pet_decay TO service_role;
GRANT EXECUTE ON FUNCTION update_daily_streaks TO service_role;
