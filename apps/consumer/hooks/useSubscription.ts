import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { Subscription, PlanTier, BillingType } from "@slide/shared";
import { clearOptimisticMembership, getOptimisticMembership } from "../lib/optimistic-membership";

// Extended subscription type that includes plan tier
export interface SubscriptionWithPlan extends Subscription {
  tier?: PlanTier;
  plan_name?: string;
}

interface UseSubscriptionResult {
  subscription: SubscriptionWithPlan | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setError(null);
      // Fetch subscription with plan info using a join
      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plans:plan_id (
            name,
            tier
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          const optimistic = await getOptimisticMembership();
          if (optimistic && Date.now() - Date.parse(optimistic.created_at) < 10 * 60 * 1000) {
            const optimisticSubscription: SubscriptionWithPlan = {
              user_id: user.id,
              stripe_customer_id: "optimistic",
              stripe_subscription_id: null,
              status: "active",
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              plan_id: optimistic.plan_id,
              billing_type: optimistic.billing_type,
              purchase_date: optimistic.created_at,
              expires_at:
                optimistic.billing_type === "one_time"
                  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  : null,
              tier: optimistic.tier,
              plan_name: optimistic.plan_name,
            };
            setSubscription(optimisticSubscription);
          } else {
            setSubscription(null);
          }
        } else {
          throw fetchError;
        }
      } else if (data) {
        // Flatten the plan info into the subscription object
        const planData = data.plans as { name: string; tier: PlanTier } | null;
        let subscriptionWithPlan: SubscriptionWithPlan = {
          ...data,
          tier: planData?.tier,
          plan_name: planData?.name,
        };
        // Remove the nested plans object
        delete (subscriptionWithPlan as any).plans;

        // Check if one-time purchase has expired
        if (
          subscriptionWithPlan.billing_type === "one_time" &&
          subscriptionWithPlan.expires_at
        ) {
          const expiresAt = new Date(subscriptionWithPlan.expires_at);
          if (expiresAt < new Date()) {
            // One-time purchase has expired - mark as expired
            subscriptionWithPlan = {
              ...subscriptionWithPlan,
              status: "canceled", // Treat expired as canceled for UI purposes
            };
          }
        }

        setSubscription(subscriptionWithPlan);
        await clearOptimisticMembership();
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
