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
