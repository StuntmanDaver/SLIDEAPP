import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";
import type { DeviceInfo, DevicePlatform } from "@slide/shared";

/**
 * Get unique device information for device binding
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  let deviceId: string | null = null;

  if (Platform.OS === "ios") {
    deviceId = await Application.getIosIdForVendorAsync();
  } else if (Platform.OS === "android") {
    deviceId = Application.getAndroidId();
  } else {
    // Web fallback - use a stored ID or generate one
    deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Fallback if device ID couldn't be retrieved
  if (!deviceId) {
    deviceId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  const platform: DevicePlatform = Platform.OS === "ios"
    ? "ios"
    : Platform.OS === "android"
    ? "android"
    : "web";

  return {
    device_id: deviceId,
    device_name: Device.deviceName || null,
    platform,
  };
}

/**
 * Get a friendly display name for the current device
 */
export function getDeviceDisplayName(): string {
  const deviceName = Device.deviceName;
  const modelName = Device.modelName;

  if (deviceName) {
    return deviceName;
  }

  if (modelName) {
    return modelName;
  }

  if (Platform.OS === "ios") {
    return "iPhone";
  } else if (Platform.OS === "android") {
    return "Android Device";
  }

  return "Unknown Device";
}
