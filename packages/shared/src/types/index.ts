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
export type PlanTier = 'basic' | 'plus' | 'premium';
export type BillingType = 'subscription' | 'one_time';

export interface Plan {
  plan_id: PlanId;
  name: string;
  stripe_price_id: string;
  passes_per_period: number;
  tier: PlanTier;
  billing_type: BillingType;
  price_cents: number;
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
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string;
  plan_id: string | null;
  billing_type: BillingType;
  purchase_date: string | null;
  expires_at: string | null;
}

// Device Binding for single-device access
export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceBinding {
  user_id: string;
  device_id: string;
  device_name: string | null;
  platform: DevicePlatform;
  bound_at: string;
  last_active_at: string;
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
  billingType: BillingType;
}

export interface StripePortalSessionResponse {
  url: string;
}

// Device Binding API Response Types
export interface CheckDeviceBindingResponse {
  is_bound: boolean;
  is_current_device: boolean;
  bound_device_name?: string;
}

export interface BindDeviceResponse {
  success: boolean;
  device_id: string;
}

// Plans API Response Types
export interface GetPlansResponse {
  plans: Plan[];
}

// Device Info for API requests
export interface DeviceInfo {
  device_id: string;
  device_name: string | null;
  platform: DevicePlatform;
}

// Surge Types
export type SurgeTriggerType = 'time' | 'membership' | 'usage' | 'manual';

export interface SurgeEvent {
  surge_id: string;
  trigger_type: SurgeTriggerType;
  title: string;
  message: string;
  max_claims: number;
  claims_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SurgeClaim {
  claim_id: string;
  surge_id: string;
  user_id: string;
  position: number;
  claimed_at: string;
  redeemed_at: string | null;
}

export interface SurgeConfig {
  config_id: string;
  time_triggers: string[];
  membership_threshold: number;
  membership_window_minutes: number;
  usage_threshold: number;
  surge_duration_minutes: number;
  max_claims_per_surge: number;
  updated_at: string;
}

export interface PushToken {
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android' | null;
  created_at: string;
  updated_at: string;
}

// Surge API Response Types
export interface GetActiveSurgeResponse {
  surge: {
    surge_id: string;
    title: string;
    message: string;
    max_claims: number;
    claims_count: number;
    spots_remaining: number;
    starts_at: string;
    expires_at: string;
    is_full: boolean;
  } | null;
  user_claim: {
    position: number;
    claimed_at: string;
  } | null;
}

export interface ClaimSurgeResponse {
  success: boolean;
  position: number;
  surge_id: string;
  title: string;
  max_claims: number;
  claims_count: number;
  expires_at: string;
}

export interface TriggerSurgeResponse {
  surge_id: string;
  title: string;
  message: string;
  max_claims: number;
  expires_at: string;
  notifications_sent: number;
}

export interface RegisterPushTokenResponse {
  success: boolean;
}

// Admin Surge List Response
export interface AdminListSurgesResponse {
  surges: SurgeEvent[];
  total: number;
}

export interface AdminSurgeStatsResponse {
  active_surges: number;
  total_claims_today: number;
  total_surges_today: number;
  registered_push_tokens: number;
}
