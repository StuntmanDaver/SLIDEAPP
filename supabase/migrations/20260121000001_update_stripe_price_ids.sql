-- Update Stripe Price IDs Migration
-- Applied: 2026-01-21
-- 
-- This migration updates the placeholder Stripe price IDs with real ones
-- created via the setup:stripe script.
--
-- Stripe Account: Cantina Añejo (LIVE mode)
-- Portal Configuration: bpc_1SrvLQC1JUIZB7aRhn6VPOKf

-- Subscription plans (monthly recurring)
UPDATE plans SET stripe_price_id = 'price_1SrvKTC1JUIZB7aRRbLYoCuR' 
WHERE name = 'Basic Monthly' AND stripe_price_id = 'price_basic_monthly';

UPDATE plans SET stripe_price_id = 'price_1SrvKTC1JUIZB7aR5lo9ZPcv' 
WHERE name = 'Plus Monthly' AND stripe_price_id = 'price_plus_monthly';

UPDATE plans SET stripe_price_id = 'price_1SrvKUC1JUIZB7aRcGJxMqyO' 
WHERE name = 'Premium Monthly' AND stripe_price_id = 'price_premium_monthly';

-- One-time purchase plans
UPDATE plans SET stripe_price_id = 'price_1SrvKTC1JUIZB7aRDuE5hmZr' 
WHERE name = 'Basic One-Time' AND stripe_price_id = 'price_basic_onetime';

UPDATE plans SET stripe_price_id = 'price_1SrvKUC1JUIZB7aR9QwDlLUe' 
WHERE name = 'Plus One-Time' AND stripe_price_id = 'price_plus_onetime';

UPDATE plans SET stripe_price_id = 'price_1SrvKUC1JUIZB7aR9BSFJXlX' 
WHERE name = 'Premium One-Time' AND stripe_price_id = 'price_premium_onetime';

-- Stripe Products Created:
-- prod_TpaVYT4gI2diaL - Slide Basic ($20, 3 passes)
-- prod_TpaVYx5XHscm3U - Slide Plus ($50, 6 passes)
-- prod_TpaVjlSrAzaQN1 - Slide Premium ($80, 9 passes)
