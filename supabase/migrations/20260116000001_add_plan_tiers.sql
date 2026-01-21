-- Add tier, billing_type, and price_cents columns to plans table
ALTER TABLE plans
ADD COLUMN tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'plus', 'premium')),
ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'subscription' CHECK (billing_type IN ('subscription', 'one_time')),
ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 2000;

-- Mark existing plan as inactive (legacy)
UPDATE plans SET is_active = false WHERE name = 'Slide Premium Monthly';

-- Insert 6 new plans (3 tiers x 2 billing types)
INSERT INTO plans (name, stripe_price_id, passes_per_period, tier, billing_type, price_cents, is_active) VALUES
  ('Basic Monthly', 'price_basic_monthly', 3, 'basic', 'subscription', 2000, true),
  ('Basic One-Time', 'price_basic_onetime', 3, 'basic', 'one_time', 2000, true),
  ('Plus Monthly', 'price_plus_monthly', 6, 'plus', 'subscription', 5000, true),
  ('Plus One-Time', 'price_plus_onetime', 6, 'plus', 'one_time', 5000, true),
  ('Premium Monthly', 'price_premium_monthly', 9, 'premium', 'subscription', 8000, true),
  ('Premium One-Time', 'price_premium_onetime', 9, 'premium', 'one_time', 8000, true);

-- Create index for tier and billing_type lookups
CREATE INDEX idx_plans_tier ON plans(tier);
CREATE INDEX idx_plans_billing_type ON plans(billing_type);
