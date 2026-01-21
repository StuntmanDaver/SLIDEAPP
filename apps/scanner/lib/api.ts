import { supabase } from "./supabase";
import type { RedeemPassResponse } from "@slide/shared";
import { SCAN_RESULTS } from "@slide/shared";

export async function getScannerPublicKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-scanner-public-key", {
    method: "GET",
  });
  if (error) throw error;
  if (!data?.public_key) throw new Error("No public key returned");
  return data.public_key;
}

export async function getRevocationList(since?: string): Promise<{ revoked: { pass_id: string; revoked_at: string }[]; synced_at: string }> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const { data, error } = await supabase.functions.invoke("get-revocation-list" + query, {
    method: "GET",
  });
  if (error) throw error;
  if (!data?.revoked) throw new Error("No revocation data returned");
  return data;
}

export async function redeemPass(qrToken: string, deviceId: string): Promise<RedeemPassResponse> {
  const { data, error } = await supabase.functions.invoke<RedeemPassResponse>("redeem-pass", {
    body: { qr_token: qrToken, device_id: deviceId }
  });
  if (error) throw error;
  if (!data) throw new Error("No data returned from redeem-pass");
  return data;
}
