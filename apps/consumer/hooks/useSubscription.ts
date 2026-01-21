import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { Subscription } from "@slide/shared";

interface UseSubscriptionResult {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setSubscription(null);
        } else {
          throw fetchError;
        }
      } else {
        setSubscription(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscription");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return { subscription, isLoading, error, refetch: fetchSubscription };
}
