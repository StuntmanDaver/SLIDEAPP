import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { usePlans } from "../hooks/usePlans";
import { MembershipPurchase } from "../components/MembershipPurchase";
import type { BillingType, PlanTier } from "@slide/shared";
import { GlassCard } from "../components/glass";

const TIER_CONFIG: Record<PlanTier, {
  label: string;
  color: string;
  bgColor: string;
  popular?: boolean;
  description: string;
}> = {
  basic: {
    label: "Basic",
    color: "#090908",
    bgColor: "rgba(245, 245, 245, 0.8)",
    description: "Perfect for occasional nights out"
  },
  plus: {
    label: "Plus",
    color: "#090908",
    bgColor: "rgba(232, 228, 240, 0.8)",
    popular: true,
    description: "Our most popular plan"
  },
  premium: {
    label: "Premium",
    color: "#FFFFFF",
    bgColor: "rgba(9, 9, 8, 0.95)",
    description: "For the ultimate nightlife experience"
  }
};

export default function MembershipScreen() {
  const [billingType, setBillingType] = useState<BillingType>("subscription");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { plans, isLoading, error } = usePlans();

  const filteredPlans = plans.filter(p => p.billing_type === billingType);
  const selectedPlan = filteredPlans.find((plan) => plan.plan_id === selectedPlanId) || null;

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const handleSuccess = () => {
    router.replace("/(tabs)");
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#090908" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-bg p-6">
        <GlassCard intensity="regular">
          <View className="p-4">
            <Text className="text-red-500 text-center">{error}</Text>
          </View>
        </GlassCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <GlassCard intensity="thick">
            <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
              <FontAwesome name="arrow-left" size={18} color="#090908" />
            </Pressable>
          </GlassCard>
          <Text className="text-3xl font-bold text-text-primary ml-4">Choose Your Plan</Text>
        </View>

        {/* Billing Type Toggle */}
        <GlassCard intensity="regular" className="mb-8">
          <View className="p-1 flex-row">
            <Pressable
              onPress={() => setBillingType("subscription")}
              className={`flex-1 py-3 rounded-full ${
                billingType === "subscription" ? "bg-text-primary" : ""
              }`}
            >
              <Text
                className={`text-center font-bold ${
                  billingType === "subscription" ? "text-white" : "text-text-secondary"
                }`}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingType("one_time")}
              className={`flex-1 py-3 rounded-full ${
                billingType === "one_time" ? "bg-text-primary" : ""
              }`}
            >
              <Text
                className={`text-center font-bold ${
                  billingType === "one_time" ? "text-white" : "text-text-secondary"
                }`}
              >
                One-Time
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Tier Cards */}
        <View className="gap-4 mb-8">
          {filteredPlans.map((plan) => {
            const config = TIER_CONFIG[plan.tier];
            const isSelected = selectedPlanId === plan.plan_id;

            return (
              <GlassCard key={plan.plan_id} intensity="regular">
                <Pressable
                  onPress={() => setSelectedPlanId(plan.plan_id)}
                  className={`p-6 relative ${isSelected ? "border-2 border-lavender-primary rounded-2xl" : ""}`}
                  style={{ backgroundColor: config.bgColor }}
                >
                  {/* Popular Badge */}
                  {config.popular && (
                    <View className="absolute -top-3 right-4 bg-lavender-primary px-3 py-1 rounded-full">
                      <Text className="text-xs font-bold text-text-primary">Most Popular</Text>
                    </View>
                  )}

                  {/* Plan Header */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text
                        className="text-2xl font-bold mb-1"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </Text>
                      <Text
                        className="text-sm opacity-70"
                        style={{ color: config.color }}
                      >
                        {config.description}
                      </Text>
                    </View>

                    {/* Selection Indicator */}
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected ? "bg-lavender-primary border-lavender-primary" : "border-gray-400"
                      }`}
                    >
                      {isSelected && <FontAwesome name="check" size={12} color="#090908" />}
                    </View>
                  </View>

                  {/* Price & Passes */}
                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text
                        className="text-4xl font-bold"
                        style={{ color: config.color }}
                      >
                        {formatPrice(plan.price_cents)}
                      </Text>
                      <Text
                        className="text-sm opacity-60"
                        style={{ color: config.color }}
                      >
                        {billingType === "subscription" ? "/month" : "one-time"}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text
                        className="text-3xl font-bold"
                        style={{ color: config.color }}
                      >
                        {plan.passes_per_period}
                      </Text>
                      <Text
                        className="text-sm opacity-60"
                        style={{ color: config.color }}
                      >
                        passes{billingType === "subscription" ? "/month" : ""}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </GlassCard>
            );
          })}
        </View>

        {/* Purchase Button */}
        {selectedPlanId && selectedPlan && (
          <MembershipPurchase
            planId={selectedPlanId}
            billingType={billingType}
            plan={selectedPlan}
            onSuccess={handleSuccess}
          />
        )}

        {/* Info Text */}
        <View className="mt-6 items-center">
          <Text className="text-text-secondary text-center text-sm">
            {billingType === "subscription"
              ? "Cancel anytime. Passes reset monthly."
              : "One-time purchase. Passes valid for 30 days."}
          </Text>
          <View className="flex-row items-center mt-4">
            <FontAwesome name="apple" size={20} color="#090908" />
            <Text className="text-text-secondary text-sm ml-2">Apple Pay supported</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
