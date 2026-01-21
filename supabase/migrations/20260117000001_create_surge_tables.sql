-- Create push_tokens table for storing user Expo push tokens
CREATE TABLE push_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: users can read/write only their own push token
CREATE POLICY "Users own their push token"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create surge_events table for promotional surge windows
CREATE TABLE surge_events (
  surge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'membership', 'usage', 'manual')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  max_claims INTEGER NOT NULL DEFAULT 50,
  claims_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on surge_events
ALTER TABLE surge_events ENABLE ROW LEVEL SECURITY;

-- Policy: all authenticated users can read active surge events
CREATE POLICY "Authenticated users can read surge events"
  ON surge_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create surge_claims table for user claims on surge events
CREATE TABLE surge_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surge_id UUID NOT NULL REFERENCES surge_events(surge_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  UNIQUE(surge_id, user_id)
);

-- Enable RLS on surge_claims
ALTER TABLE surge_claims ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own claims
CREATE POLICY "Users can read their own surge claims"
  ON surge_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Create surge_config table for admin-managed thresholds
CREATE TABLE surge_config (
  config_id TEXT PRIMARY KEY DEFAULT 'default',
  time_triggers JSONB DEFAULT '["00:00", "22:00"]',
  membership_threshold INTEGER DEFAULT 10,
  membership_window_minutes INTEGER DEFAULT 60,
  usage_threshold INTEGER DEFAULT 20,
  surge_duration_minutes INTEGER DEFAULT 30,
  max_claims_per_surge INTEGER DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on surge_config
ALTER TABLE surge_config ENABLE ROW LEVEL SECURITY;

-- Policy: all authenticated users can read surge config
CREATE POLICY "Authenticated users can read surge config"
  ON surge_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert default config
INSERT INTO surge_config (config_id) VALUES ('default');

-- Index for faster surge queries
CREATE INDEX idx_surge_events_active ON surge_events(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_surge_claims_user ON surge_claims(user_id);
CREATE INDEX idx_surge_claims_surge ON surge_claims(surge_id);

-- Enable realtime for surge_events so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE surge_events;

-- Function to atomically claim a surge spot
CREATE OR REPLACE FUNCTION claim_surge_spot(p_surge_id UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, queue_position INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_claims INTEGER;
  v_current_count INTEGER;
  v_new_position INTEGER;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_existing_claim UUID;
BEGIN
  -- Lock the surge event row for update
  SELECT max_claims, claims_count, is_active, expires_at
  INTO v_max_claims, v_current_count, v_is_active, v_expires_at
  FROM surge_events
  WHERE surge_id = p_surge_id
  FOR UPDATE;

  -- Check if surge exists
  IF v_max_claims IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Surge event not found'::TEXT;
    RETURN;
  END IF;

  -- Check if surge is still active
  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, 0, 'Surge is no longer active'::TEXT;
    RETURN;
  END IF;

  -- Check if surge has expired
  IF v_expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 'Surge has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if user already claimed
  SELECT claim_id INTO v_existing_claim
  FROM surge_claims
  WHERE surge_id = p_surge_id AND user_id = p_user_id;

  IF v_existing_claim IS NOT NULL THEN
    RETURN QUERY SELECT false, 0, 'You have already claimed a spot'::TEXT;
    RETURN;
  END IF;

  -- Check if surge is full
  IF v_current_count >= v_max_claims THEN
    RETURN QUERY SELECT false, 0, 'Surge is full'::TEXT;
    RETURN;
  END IF;

  -- Calculate new position (1-indexed)
  v_new_position := v_current_count + 1;

  -- Insert the claim
  INSERT INTO surge_claims (surge_id, user_id, position)
  VALUES (p_surge_id, p_user_id, v_new_position);

  -- Update the claims count
  UPDATE surge_events
  SET claims_count = v_new_position
  WHERE surge_id = p_surge_id;

  RETURN QUERY SELECT true, v_new_position, NULL::TEXT;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION claim_surge_spot(UUID, UUID) TO authenticated;
