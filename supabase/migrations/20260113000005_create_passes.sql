-- Create passes table (individual pass records)
CREATE TABLE passes (
  pass_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'claimed', 'redeemed', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  claimed_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_device_id TEXT
);

-- Enable RLS
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;

-- Create policy: issuers and owners can read passes
CREATE POLICY "Read issued or owned passes"
  ON passes FOR SELECT
  USING (auth.uid() = issuer_user_id OR auth.uid() = owner_user_id);

-- Create policy: only service role can modify passes
CREATE POLICY "Service role manages passes"
  ON passes FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX idx_passes_issuer ON passes(issuer_user_id);
CREATE INDEX idx_passes_owner ON passes(owner_user_id);
CREATE INDEX idx_passes_status ON passes(status);
CREATE INDEX idx_passes_created_at ON passes(created_at);
