-- Create pass_balances table (per-period pass allocation)
CREATE TABLE pass_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  passes_allowed INTEGER NOT NULL,
  passes_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT passes_used_valid CHECK (passes_used >= 0 AND passes_used <= passes_allowed)
);

-- Enable RLS
ALTER TABLE pass_balances ENABLE ROW LEVEL SECURITY;

-- Create policy: users can read only their own balance
CREATE POLICY "Users read own balance"
  ON pass_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: only service role can modify balances
CREATE POLICY "Service role manages balances"
  ON pass_balances FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create indexes
CREATE INDEX idx_pass_balances_user ON pass_balances(user_id);
CREATE INDEX idx_pass_balances_period ON pass_balances(period_start, period_end);
