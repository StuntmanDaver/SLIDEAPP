import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";
import { initSubscription } from "../lib/api";
import { FontAwesome } from "@expo/vector-icons";

interface MembershipPurchaseProps {
  planId: string;
  onSuccess?: () => void;
}

export function MembershipPurchase({ planId, onSuccess }: MembershipPurchaseProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async () => {
    setLoading(true);

    try {
      const { customerId, ephemeralKey, paymentIntent } = await initSubscription(planId);

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Slide",
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Jane Doe',
        }
      });

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      await openPaymentSheet();
    } catch (error) {
      Alert.alert("Error", "Failed to initialize payment");
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Your order is confirmed!");
      onSuccess?.();
    }
  };

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
          <Text className="text-surface font-bold text-lg mr-2">Subscribe Now</Text>
          <FontAwesome name="lock" size={16} color="#FFFFFF" />
        </>
      )}
    </Pressable>
  );
}
