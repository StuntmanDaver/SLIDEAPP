-- Add Stripe customer id to profiles for portal-first flow
ALTER TABLE profiles
ADD COLUMN stripe_customer_id TEXT UNIQUE;
