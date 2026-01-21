import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { PassBalance } from "@slide/shared";
import { clearOptimisticMembership, getOptimisticMembership } from "../lib/optimistic-membership";

interface UsePassBalanceResult {
  balance: PassBalance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePassBalance(): UsePassBalanceResult {
  const { user } = useAuth();
  const [balance, setBalance] = useState<PassBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("pass_balances")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          const optimistic = await getOptimisticMembership();
          if (optimistic && Date.now() - Date.parse(optimistic.created_at) < 10 * 60 * 1000) {
            const now = new Date();
            setBalance({
              user_id: user.id,
              period_start: now.toISOString(),
              period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              passes_allowed: optimistic.passes_per_period,
              passes_used: 0,
            });
          } else {
            // No row found, might be a new user without a subscription yet
            setBalance(null);
          }
        } else {
          throw fetchError;
        }
      } else {
        setBalance(data);
        await clearOptimisticMembership();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return { balance, isLoading, error, refetch: fetchBalance };
}
