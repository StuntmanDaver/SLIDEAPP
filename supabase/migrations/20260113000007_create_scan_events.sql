-- Create scan_events table (append-only audit log)
CREATE TABLE scan_events (
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID REFERENCES passes(pass_id) ON DELETE SET NULL,
  scanner_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('VALID', 'USED', 'EXPIRED', 'INVALID', 'REVOKED')),
  ts TIMESTAMPTZ DEFAULT now() NOT NULL,
  device_id TEXT NOT NULL,
  latency_ms INTEGER
);

-- Enable RLS
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;

-- Create policy: insert via service role only (audit log)
CREATE POLICY "Service role inserts scan events"
  ON scan_events FOR INSERT
  WITH CHECK (false);

-- Create policy: read by admin only
CREATE POLICY "Admin read scan events"
  ON scan_events FOR SELECT
  USING (false);

-- Create indexes for performance and audit
CREATE INDEX idx_scan_events_ts ON scan_events(ts);
CREATE INDEX idx_scan_events_pass ON scan_events(pass_id);
CREATE INDEX idx_scan_events_scanner ON scan_events(scanner_staff_id);
CREATE INDEX idx_scan_events_device ON scan_events(device_id);
CREATE INDEX idx_scan_events_result ON scan_events(result);
