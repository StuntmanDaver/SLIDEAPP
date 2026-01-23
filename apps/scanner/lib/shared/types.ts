/**
 * Core domain types for Slide Scanner app
 * Bundled from @slide/shared for EAS build compatibility
 */

// Scan Result Enum
export type ScanResult = "VALID" | "USED" | "EXPIRED" | "INVALID" | "REVOKED";

// API Response Types
export interface RedeemPassResponse {
  result: ScanResult;
  pass_id?: string;
  redeemed_at?: string;
}
