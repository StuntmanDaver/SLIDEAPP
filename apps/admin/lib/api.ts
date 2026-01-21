import { supabase } from "./supabase";

export async function adminListUsers(page: number, limit: number, search?: string) {
  const { data, error } = await supabase.functions.invoke("admin-list-users", {
    body: { page, limit, search }
  });
  if (error) throw error;
  return data.users;
}

export async function adminListStaff() {
  const { data, error } = await supabase.functions.invoke("admin-list-staff", {
    body: {}
  });
  if (error) throw error;
  return data.staff;
}

export async function adminGetUser(userId: string) {
  const { data, error } = await supabase.functions.invoke("admin-get-user", {
    body: { user_id: userId }
  });
  if (error) throw error;
  return data.user;
}

export async function adminUpdateUser(userId: string, action: 'ban' | 'unban') {
  const { data, error } = await supabase.functions.invoke("admin-update-user", {
    body: { user_id: userId, action }
  });
  if (error) throw error;
  return data;
}

export async function adminRevokePass(passId: string) {
  const { data, error } = await supabase.functions.invoke("admin-revoke-pass", {
    body: { pass_id: passId }
  });
  if (error) throw error;
  return data;
}

export async function adminCreateStaff(email: string, password: string, role: string) {
  const { data, error } = await supabase.functions.invoke("admin-create-staff", {
    body: { email, password, role }
  });
  if (error) throw error;
  return data;
}

export async function adminGetDashboardStats() {
  const { data, error } = await supabase.functions.invoke("admin-dashboard-stats", {
    body: {}
  });
  if (error) throw error;
  return data.scans;
}

export async function adminListScanEvents(limit: number, filterResult?: string, dateFrom?: string, dateTo?: string) {
  const { data, error } = await supabase.functions.invoke("admin-list-scan-events", {
    body: { limit, filterResult, dateFrom, dateTo }
  });
  if (error) throw error;
  return data.events;
}

export async function adminListPlans() {
  const { data, error } = await supabase.functions.invoke("admin-list-plans", {
    body: {}
  });
  if (error) throw error;
  return data.plans;
}

export async function adminUpdatePlan(planId: string, isActive?: boolean, passesPerPeriod?: number) {
  const { data, error } = await supabase.functions.invoke("admin-update-plan", {
    body: { plan_id: planId, is_active: isActive, passes_per_period: passesPerPeriod }
  });
  if (error) throw error;
  return data.plan;
}

export async function adminUpdateStaff(userId: string, isActive: boolean) {
  const { data, error } = await supabase.functions.invoke("admin-update-staff", {
    body: { user_id: userId, is_active: isActive }
  });
  if (error) throw error;
  return data.staff;
}

// Surge Management
export async function adminListSurges(limit = 50, offset = 0, activeOnly = false) {
  const { data, error } = await supabase.functions.invoke("admin-list-surges", {
    body: { limit, offset, active_only: activeOnly }
  });
  if (error) throw error;
  return data;
}

export async function adminTriggerSurge(options?: {
  title?: string;
  message?: string;
  max_claims?: number;
}) {
  const { data, error } = await supabase.functions.invoke("trigger-surge", {
    body: { trigger_type: "manual", ...options }
  });
  if (error) throw error;
  return data;
}

export async function adminUpdateSurgeConfig(config: {
  time_triggers?: string[];
  membership_threshold?: number;
  membership_window_minutes?: number;
  usage_threshold?: number;
  surge_duration_minutes?: number;
  max_claims_per_surge?: number;
}) {
  const { data, error } = await supabase.functions.invoke("admin-update-surge-config", {
    body: config
  });
  if (error) throw error;
  return data.config;
}

// Pass Activity Log
export interface PassActivity {
  pass_id: string;
  status: 'created' | 'claimed' | 'redeemed' | 'expired' | 'revoked';
  created_at: string;
  claimed_at: string | null;
  redeemed_at: string | null;
  redeemed_device_id: string | null;
  issuer_user_id: string | null;
  owner_user_id: string | null;
  issuer_email: string | null;
  owner_email: string | null;
}

export interface PassActivityStats {
  total: number;
  created: number;
  claimed: number;
  redeemed: number;
  expired: number;
  revoked: number;
  issued_today: number;
  redeemed_today: number;
  expired_today: number;
}

export interface FraudIndicators {
  multi_device_passes: Array<{ pass_id: string; device_count: number }>;
  reuse_attempts_count: number;
}

export interface PassActivityResponse {
  passes: PassActivity[];
  stats: PassActivityStats;
  fraud_indicators: FraudIndicators;
}

export async function adminListPassActivity(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchUserId?: string;
  searchPassId?: string;
}): Promise<PassActivityResponse> {
  const { data, error } = await supabase.functions.invoke("admin-list-pass-activity", {
    body: options || {}
  });
  if (error) throw error;
  return data;
}
