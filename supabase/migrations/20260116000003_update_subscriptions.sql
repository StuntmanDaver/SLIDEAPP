-- Update subscriptions table to support one-time purchases

-- Add plan_id reference column
ALTER TABLE subscriptions
ADD COLUMN plan_id UUID REFERENCES plans(plan_id);

-- Add billing_type column to track subscription vs one-time
ALTER TABLE subscriptions
ADD COLUMN billing_type TEXT DEFAULT 'subscription' CHECK (billing_type IN ('subscription', 'one_time'));

-- Add purchase_date for one-time purchases
ALTER TABLE subscriptions
ADD COLUMN purchase_date TIMESTAMPTZ;

-- Add expires_at for one-time purchases (30-day window)
ALTER TABLE subscriptions
ADD COLUMN expires_at TIMESTAMPTZ;

-- Allow null stripe_subscription_id for one-time purchases
ALTER TABLE subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;

-- Create index for plan_id lookups
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Create index for billing_type lookups
CREATE INDEX idx_subscriptions_billing_type ON subscriptions(billing_type);

-- Create index for expires_at lookups (for cleanup jobs)
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
