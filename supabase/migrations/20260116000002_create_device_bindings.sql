-- Create device_bindings table for single-device access enforcement
CREATE TABLE device_bindings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  bound_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE device_bindings ENABLE ROW LEVEL SECURITY;

-- Create policy: users can read only their own device binding
CREATE POLICY "Users read own device binding"
  ON device_bindings FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: only service role can manage device bindings (via edge functions)
CREATE POLICY "Service role manages device bindings"
  ON device_bindings FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for device_id lookups
CREATE INDEX idx_device_bindings_device_id ON device_bindings(device_id);
