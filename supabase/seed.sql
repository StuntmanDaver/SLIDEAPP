-- Seed data for Slide
-- This file is run after migrations via `supabase db reset`

-- ====================
-- 1. Plans
-- ====================
-- Ensure we have at least one production-ready plan with 3 passes
INSERT INTO plans (plan_id, name, stripe_price_id, passes_per_period, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Slide Monthly Membership', 'price_production_monthly_placeholder', 3, true)
ON CONFLICT (stripe_price_id) DO UPDATE SET 
  name = EXCLUDED.name,
  passes_per_period = EXCLUDED.passes_per_period,
  is_active = EXCLUDED.is_active;

-- ====================
-- 2. Staff Users
-- ====================
-- Placeholder for staff users. In production, these should be created via the Admin Dashboard or scripts.
-- INSERT INTO staff_users (user_id, role, is_active)
-- VALUES 
--   ('ADMIN_USER_UUID', 'admin', true);
