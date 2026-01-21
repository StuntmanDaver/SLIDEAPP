import { View, Text, Pressable, RefreshControl, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { usePassBalance } from "../../hooks/usePassBalance";
import { useSubscription } from "../../hooks/useSubscription";
import { useAuth } from "../../hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import type { PlanTier } from "@slide/shared";
import { GlassCard } from "../../components/glass";

const TIER_LABELS: Record<PlanTier, string> = {
  basic: "Basic",
  plus: "Plus",
  premium: "Premium",
};

function getTierLabel(subscription: any): string {
  if (subscription?.tier) {
    return TIER_LABELS[subscription.tier as PlanTier] || "Member";
  }
  return "Member";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { balance, isLoading: balanceLoading, refetch: refetchBalance } = usePassBalance();
  const { subscription, isLoading: subLoading, refetch: refetchSub } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchSub()]);
    setRefreshing(false);
  }, [refetchBalance, refetchSub]);

  const passesRemaining = balance ? balance.passes_allowed - balance.passes_used : 0;
  const isMember = subscription?.status === "active";
  const hasPasses = passesRemaining > 0;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";

  const handleJoinMembership = () => {
    router.push("/membership");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <GlassCard intensity="thin" floating>
              <View className="w-10 h-10 items-center justify-center">
                <FontAwesome name="user" size={18} color="#090908" />
              </View>
            </GlassCard>
            <View className="ml-3">
              <Text className="text-text-secondary text-sm">Hello,</Text>
              <Text className="text-text-primary text-lg font-bold">{displayName}</Text>
            </View>
          </View>
          <GlassCard intensity="thin" floating>
            <Pressable className="w-10 h-10 items-center justify-center">
              <FontAwesome name="bell" size={18} color="#090908" />
            </Pressable>
          </GlassCard>
        </View>

        {/* Hero Title */}
        <Text className="text-4xl font-bold text-text-primary mb-6 leading-tight">
          Your Night,{'\n'}Elevated
        </Text>

        {/* Membership Card */}
        <GlassCard intensity="ultraThin" floating className="mb-6">
          <View className="bg-lavender-primary p-6 rounded-2xl">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-text-primary text-2xl font-bold">
                  {isMember ? "Active Member" : "Membership Inactive"}
                </Text>
                {isMember && subscription?.plan_id && (
                  <View className="flex-row items-center mt-1">
                    <View className="bg-black/10 px-2 py-1 rounded-full mr-2">
                      <Text className="text-xs font-bold text-text-primary">
                        {getTierLabel(subscription)}
                      </Text>
                    </View>
                    {subscription?.billing_type && (
                      <Text className="text-xs text-text-primary opacity-60">
                        {subscription.billing_type === "subscription" ? "Monthly" : "One-Time"}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <View className="bg-white/30 w-8 h-8 rounded-lg items-center justify-center">
                <FontAwesome name="ellipsis-h" size={14} color="#090908" />
              </View>
            </View>

            <Text className="text-text-primary opacity-70 mb-6">
              {isMember
                ? "Your subscription is active. Enjoy your night out."
                : "Subscribe to start sending passes to friends."}
            </Text>

            <View>
              <Text className="text-xs text-text-primary opacity-60 uppercase font-bold mb-1">
                Passes Remaining
              </Text>
              <Text className="text-4xl font-bold text-text-primary">
                {passesRemaining}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Actions */}
        <View className="flex-row mb-4" style={{ gap: 16 }}>
          {/* Skip the Line */}
          <Link href="/qr" asChild>
            <Pressable style={{ flex: 1 }}>
              <GlassCard intensity="thin" floating>
                <View className="p-4 items-center justify-center" style={{ height: 140 }}>
                  <View className="w-12 h-12 bg-lavender-secondary/60 rounded-full items-center justify-center mb-3">
                    <FontAwesome name="ticket" size={24} color="#090908" />
                  </View>
                  <Text className="text-text-primary font-bold text-center">Skip the{'\n'}Line</Text>
                </View>
              </GlassCard>
            </Pressable>
          </Link>

          {/* Share with Friends */}
          <Link href="/send-pass" asChild>
            <Pressable
              disabled={!isMember || !hasPasses}
              style={{ flex: 1, opacity: (!isMember || !hasPasses) ? 0.5 : 1 }}
            >
              <GlassCard intensity="thin" floating>
                <View className="p-4 items-center justify-center" style={{ height: 140 }}>
                  <View className="w-12 h-12 bg-lavender-primary/60 rounded-full items-center justify-center mb-3">
                    <FontAwesome name="share-alt" size={24} color="#090908" />
                  </View>
                  <Text className="text-text-primary font-bold text-center">Share with{'\n'}Friends</Text>
                </View>
              </GlassCard>
            </Pressable>
          </Link>
        </View>

        {/* Secure & Simple */}
        <Link href="/account" asChild>
          <Pressable className="mb-4">
            <GlassCard intensity="thin" floating>
              <View className="p-4 flex-row items-center">
                <View className="w-12 h-12 bg-surface-alt/50 rounded-full items-center justify-center mr-4">
                  <FontAwesome name="shield" size={24} color="#090908" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-bold text-lg mb-1">Secure & Simple</Text>
                  <Text className="text-text-secondary text-sm">Your unique digital ID is safe with us</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#7D737B" />
              </View>
            </GlassCard>
          </Pressable>
        </Link>

        {!isMember && (
          <Pressable
            onPress={handleJoinMembership}
            className="bg-text-primary rounded-full p-4 flex-row items-center justify-center mb-8"
          >
            <Text className="text-white font-bold text-lg mr-2">Join Membership</Text>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Recent Activity */}
        <View>
          <Text className="text-lg font-bold text-text-primary mb-4">Recent Activity</Text>
          <GlassCard intensity="ultraThin" floating>
            <View className="p-4 flex-row items-center">
              <View className="w-10 h-10 bg-lavender-secondary/50 rounded-full items-center justify-center mr-3">
                <FontAwesome name="ticket" size={16} color="#090908" />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">Welcome to Slide</Text>
                <Text className="text-text-secondary text-xs">Just now</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
