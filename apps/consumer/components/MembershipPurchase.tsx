import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useState, useEffect } from "react";
import { initSubscription } from "../lib/api";
import { getDeviceInfo } from "../lib/device";
import { FontAwesome } from "@expo/vector-icons";
import type { BillingType, DeviceInfo, Plan } from "@slide/shared";
import { setOptimisticMembership } from "../lib/optimistic-membership";

interface MembershipPurchaseProps {
  planId: string;
  plan: Plan;
  billingType?: BillingType;
  onSuccess?: () => void;
}

export function MembershipPurchase({ planId, plan, billingType = "subscription", onSuccess }: MembershipPurchaseProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  // Fetch device info on mount
  useEffect(() => {
    getDeviceInfo().then(setDeviceInfo).catch(console.error);
  }, []);

  const initializePaymentSheet = async () => {
    setLoading(true);

    try {
      const { customerId, ephemeralKey, paymentIntent } = await initSubscription(
        planId,
        deviceInfo || undefined
      );

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Slide",
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: billingType === "subscription",
        // Enable Apple Pay and Google Pay
        applePay: {
          merchantCountryCode: "US",
        },
        googlePay: {
          merchantCountryCode: "US",
          testEnv: __DEV__,
        },
        defaultBillingDetails: {
          name: "",
        },
        returnURL: "slide://payment-complete",
      });

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      await openPaymentSheet();
    } catch (error: any) {
      // Check if it's a device binding error
      if (error?.message?.includes("device") || error?.message?.includes("bound")) {
        Alert.alert("Device Binding Error", error.message);
      } else {
        Alert.alert("Error", "Failed to initialize payment");
      }
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    setLoading(false);
    if (error) {
      if (error.code !== "Canceled") {
        Alert.alert("Error", error.message);
      }
    } else {
      await setOptimisticMembership({
        plan_id: plan.plan_id,
        billing_type: billingType,
        passes_per_period: plan.passes_per_period,
        plan_name: plan.name,
        tier: plan.tier,
        created_at: new Date().toISOString(),
      });
      const successMessage = billingType === "subscription"
        ? "Your subscription is now active!"
        : "Your purchase is complete!";
      Alert.alert("Success", successMessage);
      onSuccess?.();
    }
  };

  const buttonText = billingType === "subscription" ? "Subscribe Now" : "Purchase Now";

  return (
    <Pressable
      onPress={initializePaymentSheet}
      disabled={loading}
      className="bg-text-primary rounded-full p-4 flex-row items-center justify-center w-full"
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text className="text-surface font-bold text-lg mr-2">{buttonText}</Text>
          <FontAwesome name="lock" size={16} color="#FFFFFF" />
        </>
      )}
    </Pressable>
  );
}
