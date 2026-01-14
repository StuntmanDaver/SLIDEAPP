// QR Token Configuration
export const QR_TOKEN_TTL_SECONDS = 30;

// Pass Balance Defaults
export const DEFAULT_PASSES_PER_PERIOD = 3;

// Pass Status Values
export const PASS_STATUSES = {
  CREATED: "created",
  CLAIMED: "claimed",
  REDEEMED: "redeemed",
  REVOKED: "revoked",
  EXPIRED: "expired",
} as const;

// Scan Results
export const SCAN_RESULTS = {
  VALID: "VALID",
  USED: "USED",
  EXPIRED: "EXPIRED",
  INVALID: "INVALID",
  REVOKED: "REVOKED",
} as const;
