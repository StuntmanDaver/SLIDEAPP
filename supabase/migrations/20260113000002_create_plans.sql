-- Create plans table (admin-only)
CREATE TABLE plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  passes_per_period INTEGER DEFAULT 3 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy: authenticated users can read active plans
CREATE POLICY "Read active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- Create policy: only service role can manage plans
CREATE POLICY "Admin manage plans"
  ON plans FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX idx_plans_is_active ON plans(is_active);

-- Seed default plan (MVP: one plan to start)
INSERT INTO plans (name, stripe_price_id, passes_per_period, is_active)
VALUES ('Slide Premium Monthly', 'price_example_monthly', 3, true);
