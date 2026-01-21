import { supabase } from "./supabase";

export interface SurgeEvent {
  surge_id: string;
  title: string;
  message: string;
  max_claims: number;
  claims_count: number;
  spots_remaining: number;
  starts_at: string;
  expires_at: string;
  is_full: boolean;
}

export interface UserClaim {
  position: number;
  claimed_at: string;
}

export interface GetActiveSurgeResponse {
  surge: SurgeEvent | null;
  user_claim: UserClaim | null;
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

/**
 * Get the currently active surge event and user's claim status
 */
export async function getActiveSurge(): Promise<GetActiveSurgeResponse> {
  const { data, error } = await supabase.functions.invoke<GetActiveSurgeResponse>(
    "get-active-surge"
  );

  if (error) throw error;
  return data!;
}

/**
 * Claim a spot in the surge queue
 */
export async function claimSurge(surgeId: string): Promise<ClaimSurgeResponse> {
  const { data, error } = await supabase.functions.invoke<ClaimSurgeResponse>(
    "claim-surge",
    {
      body: { surge_id: surgeId },
    }
  );

  if (error) throw error;
  return data!;
}

/**
 * Format time remaining until surge expires
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 0) {
    return `${diffHours}h ${remainingMinutes}m`;
  }

  return `${diffMinutes}m`;
}

/**
 * Check if a surge has expired
 */
export function isSurgeExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}
