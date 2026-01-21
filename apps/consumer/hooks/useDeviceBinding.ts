import { useEffect, useState, useCallback } from "react";
import { checkDeviceBinding, transferDevice } from "../lib/api";
import { getDeviceInfo } from "../lib/device";
import { useAuth } from "./useAuth";
import type { CheckDeviceBindingResponse, DeviceInfo } from "@slide/shared";

interface UseDeviceBindingResult {
  deviceInfo: DeviceInfo | null;
  bindingStatus: CheckDeviceBindingResponse | null;
  isLoading: boolean;
  error: string | null;
  checkBinding: () => Promise<void>;
  transferToCurrentDevice: () => Promise<{ success: boolean; message: string }>;
}

export function useDeviceBinding(): UseDeviceBindingResult {
  const { user } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [bindingStatus, setBindingStatus] = useState<CheckDeviceBindingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkBinding = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Get device info
      const info = await getDeviceInfo();
      setDeviceInfo(info);

      // Check binding status
      const status = await checkDeviceBinding(info.device_id);
      setBindingStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check device binding");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const transferToCurrentDevice = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!deviceInfo) {
      return { success: false, message: "Device info not available" };
    }

    try {
      const result = await transferDevice(
        deviceInfo.device_id,
        deviceInfo.device_name || undefined,
        deviceInfo.platform
      );

      // Refresh binding status after transfer
      await checkBinding();

      return { success: true, message: result.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to transfer device";
      return { success: false, message };
    }
  }, [deviceInfo, checkBinding]);

  useEffect(() => {
    checkBinding();
  }, [checkBinding]);

  return {
    deviceInfo,
    bindingStatus,
    isLoading,
    error,
    checkBinding,
    transferToCurrentDevice,
  };
}
