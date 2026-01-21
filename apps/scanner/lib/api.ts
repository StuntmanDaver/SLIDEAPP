import { supabase } from "./supabase";
import type { RedeemPassResponse } from "@slide/shared";

export async function redeemPass(qrToken: string, deviceId: string): Promise<RedeemPassResponse> {
  const { data, error } = await supabase.functions.invoke<RedeemPassResponse>("redeem-pass", {
    body: { qr_token: qrToken, device_id: deviceId }
  });
  if (error) throw error;
  if (!data) throw new Error("No data returned from redeem-pass");
  return data;
}
