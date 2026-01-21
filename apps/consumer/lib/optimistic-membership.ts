import * as SecureStore from "expo-secure-store";
import type { BillingType, PlanTier } from "@slide/shared";

const OPTIMISTIC_KEY = "optimistic_membership";

export interface OptimisticMembership {
  plan_id: string;
  billing_type: BillingType;
  passes_per_period: number;
  plan_name?: string;
  tier?: PlanTier;
  created_at: string;
}

export async function setOptimisticMembership(data: OptimisticMembership) {
  await SecureStore.setItemAsync(OPTIMISTIC_KEY, JSON.stringify(data));
}

export async function getOptimisticMembership(): Promise<OptimisticMembership | null> {
  const raw = await SecureStore.getItemAsync(OPTIMISTIC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OptimisticMembership;
  } catch {
    return null;
  }
}

export async function clearOptimisticMembership() {
  await SecureStore.deleteItemAsync(OPTIMISTIC_KEY);
}
