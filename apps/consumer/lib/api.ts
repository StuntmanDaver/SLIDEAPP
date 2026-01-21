import { supabase } from "./supabase";
import type {
  CreatePassResponse,
  ClaimPassResponse,
  QRTokenResponse,
  RedeemPassResponse,
  StripeInitSubscriptionResponse,
  StripePortalSessionResponse,
  CheckDeviceBindingResponse,
  GetPlansResponse,
  DeviceInfo,
  BillingType
} from "@slide/shared";

export async function createPass(): Promise<CreatePassResponse> {
  const { data, error } = await supabase.functions.invoke<CreatePassResponse>("create-pass");
  if (error) throw error;
  return data!;
}

export async function claimPass(token: string): Promise<ClaimPassResponse> {
  const { data, error } = await supabase.functions.invoke<ClaimPassResponse>("claim-pass", {
    body: { token }
  });
  if (error) throw error;
  return data!;
}

export async function issueQRToken(passId: string): Promise<QRTokenResponse> {
  const { data, error } = await supabase.functions.invoke<QRTokenResponse>("issue-qr-token", {
    body: { pass_id: passId }
  });
  if (error) throw error;
  return data!;
}

export async function redeemPass(qrToken: string, deviceId: string): Promise<RedeemPassResponse> {
  const { data, error } = await supabase.functions.invoke<RedeemPassResponse>("redeem-pass", {
    body: { qr_token: qrToken, device_id: deviceId }
  });
  if (error) throw error;
  return data!;
}

export async function initSubscription(
  planId: string,
  deviceInfo?: DeviceInfo
): Promise<StripeInitSubscriptionResponse> {
  const { data, error } = await supabase.functions.invoke<StripeInitSubscriptionResponse>("stripe-init-subscription", {
    body: {
      plan_id: planId,
      device_id: deviceInfo?.device_id,
      device_name: deviceInfo?.device_name,
      platform: deviceInfo?.platform
    }
  });
  if (error) throw error;
  return data!;
}

export async function createPortalSession(): Promise<StripePortalSessionResponse> {
  const { data, error } = await supabase.functions.invoke<StripePortalSessionResponse>("stripe-create-portal-session");
  if (error) throw error;
  return data!;
}

export async function getPlans(): Promise<GetPlansResponse> {
  const { data, error } = await supabase.functions.invoke<GetPlansResponse>("get-plans");
  if (error) throw error;
  return data!;
}

export async function checkDeviceBinding(deviceId: string): Promise<CheckDeviceBindingResponse> {
  const { data, error } = await supabase.functions.invoke<CheckDeviceBindingResponse>("check-device-binding", {
    body: { device_id: deviceId }
  });
  if (error) throw error;
  return data!;
}

export async function transferDevice(
  newDeviceId: string,
  newDeviceName?: string,
  platform?: string
): Promise<{ success: boolean; device_id: string; message: string }> {
  const { data, error } = await supabase.functions.invoke<{ success: boolean; device_id: string; message: string }>(
    "transfer-device",
    {
      body: {
        new_device_id: newDeviceId,
        new_device_name: newDeviceName,
        platform
      }
    }
  );
  if (error) throw error;
  return data!;
}
