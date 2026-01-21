import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  getActiveSurge,
  claimSurge,
  isSurgeExpired,
  SurgeEvent,
  UserClaim,
} from "../lib/surge-api";

interface UseSurgeResult {
  surge: SurgeEvent | null;
  userClaim: UserClaim | null;
  isLoading: boolean;
  error: string | null;
  isClaiming: boolean;
  claimSpot: () => Promise<boolean>;
  refresh: () => Promise<void>;
  dismissSurge: () => void;
}

export function useSurge(): UseSurgeResult {
  const [surge, setSurge] = useState<SurgeEvent | null>(null);
  const [userClaim, setUserClaim] = useState<UserClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const fetchActiveSurge = useCallback(async () => {
    try {
      setError(null);
      const response = await getActiveSurge();

      // Check if surge expired
      if (response.surge && isSurgeExpired(response.surge.expires_at)) {
        setSurge(null);
        setUserClaim(null);
        return;
      }

      setSurge(response.surge);
      setUserClaim(response.user_claim);

      // Reset dismissed state when a new surge comes in
      if (response.surge?.surge_id !== surge?.surge_id) {
        setIsDismissed(false);
      }
    } catch (err) {
      console.error("Error fetching active surge:", err);
      setError("Failed to fetch surge status");
    } finally {
      setIsLoading(false);
    }
  }, [surge?.surge_id]);

  const claimSpot = useCallback(async (): Promise<boolean> => {
    if (!surge) return false;

    setIsClaiming(true);
    try {
      const response = await claimSurge(surge.surge_id);

      if (response.success) {
        setUserClaim({
          position: response.position,
          claimed_at: new Date().toISOString(),
        });

        // Update surge with new claims count
        setSurge((prev) =>
          prev
            ? {
                ...prev,
                claims_count: response.claims_count,
                spots_remaining: prev.max_claims - response.claims_count,
                is_full: response.claims_count >= prev.max_claims,
              }
            : null
        );

        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error claiming surge spot:", err);
      setError(err?.message || "Failed to claim spot");
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [surge]);

  const dismissSurge = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchActiveSurge();
  }, []);

  // Subscribe to surge_events realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("surge_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "surge_events",
        },
        (payload) => {
          // Refetch to get updated data with user claim status
          fetchActiveSurge();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSurge]);

  // Periodically check for expired surges
  useEffect(() => {
    if (!surge) return;

    const checkExpiry = () => {
      if (surge && isSurgeExpired(surge.expires_at)) {
        setSurge(null);
        setUserClaim(null);
      }
    };

    const interval = setInterval(checkExpiry, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [surge]);

  return {
    surge: isDismissed ? null : surge,
    userClaim,
    isLoading,
    error,
    isClaiming,
    claimSpot,
    refresh: fetchActiveSurge,
    dismissSurge,
  };
}
