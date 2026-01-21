-- Create table to track processed Stripe webhook events (deduplication)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries (events older than 30 days can be deleted)
CREATE INDEX idx_processed_webhook_events_processed_at
  ON processed_webhook_events(processed_at);

-- Add comment for documentation
COMMENT ON TABLE processed_webhook_events IS 'Tracks processed Stripe webhook events to prevent duplicate processing';
