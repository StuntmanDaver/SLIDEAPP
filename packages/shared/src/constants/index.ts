/**
 * Shared constants across all Slide apps
 */

// QR Token Configuration
export const QR_TOKEN_TTL_SECONDS = 300; // 5 minutes
export const QR_TOKEN_REFRESH_BEFORE_SECONDS = 30;

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

// Subscription Status Values
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
} as const;

// Staff Roles
export const STAFF_ROLES = {
  SCANNER: "scanner",
  ADMIN: "admin",
} as const;

// Scan Results
export const SCAN_RESULTS = {
  VALID: "VALID",
  USED: "USED",
  EXPIRED: "EXPIRED",
  INVALID: "INVALID",
  REVOKED: "REVOKED",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_PASSES_REMAINING: "No passes remaining",
  MEMBERSHIP_INACTIVE: "Membership inactive",
  NETWORK_ERROR: "Network error — try again",
  PASS_ALREADY_CLAIMED: "Pass already claimed",
  PASS_REVOKED: "Pass revoked",
  LINK_EXPIRED: "Link expired",
  INVALID_LINK: "Invalid link",
  UNAUTHORIZED: "Unauthorized",
  PASS_NOT_FOUND: "Pass not found",
} as const;

// Deep Link Base URL (to be overridden in env)
export const DEEP_LINK_SCHEME = "slide://";
export const DEEP_LINK_CLAIM_PATH = "claim";

// Token Configuration
export const CLAIM_TOKEN_LENGTH = 32; // bytes
export const CLAIM_TOKEN_TTL_HOURS = 24;

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const RATE_LIMIT_MAX_ATTEMPTS = {
  CLAIM: 10,
  REDEEM_PER_DEVICE: 30,
  REDEEM_PER_STAFF: 100,
} as const;
