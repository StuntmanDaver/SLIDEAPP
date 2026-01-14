import { supabase } from "./supabase";
import type { 
  CreatePassResponse, 
  ClaimPassResponse, 
  QRTokenResponse, 
  RedeemPassResponse,
  StripeInitSubscriptionResponse 
} from "@slide/shared";

export async function createPass(): Promise<CreatePassResponse> {
  const { data, error } = await supabase.functions.invoke<CreatePassResponse>("create-pass");
  if (error) throw error;
  return data;
}

export async function claimPass(token: string): Promise<ClaimPassResponse> {
  const { data, error } = await supabase.functions.invoke<ClaimPassResponse>("claim-pass", {
    body: { token }
  });
  if (error) throw error;
  return data;
}

export async function issueQRToken(passId: string): Promise<QRTokenResponse> {
  const { data, error } = await supabase.functions.invoke<QRTokenResponse>("issue-qr-token", {
    body: { pass_id: passId }
  });
  if (error) throw error;
  return data;
}

export async function redeemPass(qrToken: string, deviceId: string): Promise<RedeemPassResponse> {
  const { data, error } = await supabase.functions.invoke<RedeemPassResponse>("redeem-pass", {
    body: { qr_token: qrToken, device_id: deviceId }
  });
  if (error) throw error;
  return data;
}

export async function initSubscription(planId: string): Promise<StripeInitSubscriptionResponse> {
  const { data, error } = await supabase.functions.invoke<StripeInitSubscriptionResponse>("stripe-init-subscription", {
    body: { plan_id: planId }
  });
  if (error) throw error;
  return data;
}
