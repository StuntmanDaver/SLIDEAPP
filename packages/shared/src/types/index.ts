/**
 * Core domain types for Slide application
 */

// User Profile
export interface Profile {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

// Subscription Plan
export type PlanId = string;
export interface Plan {
  plan_id: PlanId;
  name: string;
  stripe_price_id: string;
  passes_per_period: number;
  is_active: boolean;
}

// Subscription Status
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface Subscription {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  current_period_end: string;
}

// Pass Balance (per billing period)
export interface PassBalance {
  user_id: string;
  period_start: string;
  period_end: string;
  passes_allowed: number;
  passes_used: number;
}

// Pass Status Enum
export type PassStatus = "created" | "claimed" | "redeemed" | "revoked" | "expired";

export interface Pass {
  pass_id: string;
  issuer_user_id: string;
  owner_user_id: string | null;
  claim_token_hash: string | null;
  status: PassStatus;
  created_at: string;
  claimed_at: string | null;
  redeemed_at: string | null;
  redeemed_by_staff_id: string | null;
  redeemed_device_id: string | null;
}

// Staff User Roles
export type StaffRole = "scanner" | "admin";

export interface StaffUser {
  user_id: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}

// Scan Result Enum
export type ScanResult = "VALID" | "USED" | "EXPIRED" | "INVALID" | "REVOKED";

export interface ScanEvent {
  scan_id: string;
  pass_id: string | null;
  scanner_staff_id: string | null;
  result: ScanResult;
  ts: string;
  device_id: string;
  latency_ms: number | null;
}

// QR Token
export interface QRTokenPayload {
  pass_id: string;
  exp: number;
  jti: string;
  aud: "scanner";
}

export interface QRTokenResponse {
  qr_token: string;
  exp: number;
}

// API Response Types
export interface CreatePassResponse {
  pass_id: string;
  claim_link: string;
}

export interface ClaimPassResponse {
  pass_id: string;
  status: PassStatus;
}

export interface RedeemPassResponse {
  result: ScanResult;
  pass_id?: string;
  redeemed_at?: string;
}

export interface StripeInitSubscriptionResponse {
  customerId: string;
  ephemeralKey: string;
  paymentIntent: string;
}
