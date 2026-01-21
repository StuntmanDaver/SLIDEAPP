import { useEffect, useState, useRef, useCallback } from "react";
import { usePasses } from "./usePasses";
import { issueQRToken } from "../lib/api";
import { QR_TOKEN_TTL_SECONDS } from "@slide/shared";
import * as Haptics from "expo-haptics";

interface UseQRTokenResult {
  qrToken: string | null;
  passId: string | null;
  timeLeft: number;
  isLoading: boolean;
  error: string | null;
  hasValidPass: boolean;
  refresh: () => Promise<void>;
}

export function useQRToken(selectedPassId?: string): UseQRTokenResult {
  const { passes, isLoading: passesLoading } = usePasses();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [passId, setPassId] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPassIdRef = useRef<string | null>(null);

  // Find a valid pass - use selected pass if provided, otherwise first claimed pass
  const validPass = selectedPassId
    ? passes.find((p) => p.pass_id === selectedPassId && p.status === "claimed")
    : passes.find((p) => p.status === "claimed");

  const fetchToken = useCallback(async () => {
    if (!validPass) return;

    try {
      setIsLoading(true);
      setError(null);
      setPassId(validPass.pass_id);

      const response = await issueQRToken(validPass.pass_id);

      setQrToken(response.qr_token);
      setExpiry(response.exp);

      // Calculate time left immediately
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, response.exp - now));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR token");
    } finally {
      setIsLoading(false);
    }
  }, [validPass]);

  // Initial fetch when valid pass is found, or when pass changes
  useEffect(() => {
    if (!validPass) return;

    // If the pass changed, clear old token and fetch new one
    if (validPass.pass_id !== lastPassIdRef.current) {
      lastPassIdRef.current = validPass.pass_id;
      setQrToken(null);
      setExpiry(null);
      setTimeLeft(0);
      fetchToken();
    } else if (!qrToken && !isLoading) {
      fetchToken();
    }
  }, [validPass, qrToken, isLoading, fetchToken]);

  // Countdown timer
  useEffect(() => {
    if (!expiry) return;

    countdownTimerRef.current = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, expiry - now);
      setTimeLeft(remaining);

      // Auto-refresh if less than 30 seconds remaining
      if (remaining <= 30 && !isLoading) {
        fetchToken();
      }
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [expiry, fetchToken, isLoading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  return {
    qrToken,
    passId,
    timeLeft,
    isLoading: isLoading || passesLoading,
    error,
    hasValidPass: !!validPass,
    refresh: fetchToken
  };
}
