-- Add revoked_at timestamp for revocation sync
ALTER TABLE passes
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Index for revocation list queries
CREATE INDEX IF NOT EXISTS idx_passes_revoked_at ON passes(revoked_at);
