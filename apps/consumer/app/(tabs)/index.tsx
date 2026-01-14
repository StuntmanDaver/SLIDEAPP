import { View, Text, Pressable, RefreshControl, ScrollView } from "react-native";
import { Link } from "expo-router";
import { usePassBalance } from "../../hooks/usePassBalance";
import { useSubscription } from "../../hooks/useSubscription";
import { useAuth } from "../../hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useState, useCallback } from "react";

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

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-3">
              <FontAwesome name="user" size={18} color="#090908" />
            </View>
            <View>
              <Text className="text-text-secondary text-sm">Hello,</Text>
              <Text className="text-text-primary text-lg font-bold">{displayName}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Pressable className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-control">
              <FontAwesome name="bell" size={18} color="#090908" />
            </Pressable>
          </View>
        </View>

        {/* Hero Title */}
        <Text className="text-4xl font-bold text-text-primary mb-6 leading-tight">
          Your Night,{'\n'}Elevated
        </Text>

        {/* Membership Card */}
        <View className="bg-lavender-primary rounded-lg p-6 shadow-card mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-text-primary text-2xl font-bold">
              {isMember ? "Active Member" : "Membership Inactive"}
            </Text>
            <Pressable className="w-8 h-8 bg-surface rounded-full items-center justify-center opacity-80">
              <FontAwesome name="ellipsis-h" size={14} color="#090908" />
            </Pressable>
          </View>
          
          <Text className="text-text-primary opacity-70 mb-6">
            {isMember 
              ? "Your subscription is active. Enjoy your night out." 
              : "Subscribe to start sending passes to friends."}
          </Text>

          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-xs text-text-primary opacity-60 uppercase font-bold mb-1">
                Passes Remaining
              </Text>
              <Text className="text-4xl font-bold text-text-primary">
                {passesRemaining}
              </Text>
            </View>
            
            {/* Visual element or icon could go here */}
          </View>
        </View>

        {/* Actions */}
        <View className="mb-8">
          <Link href="/send-pass" asChild>
            <Pressable 
              disabled={!isMember || !hasPasses}
              className={`rounded-full p-4 flex-row items-center justify-center mb-4 ${
                isMember && hasPasses ? "bg-text-primary" : "bg-text-secondary opacity-50"
              }`}
            >
              <Text className="text-surface font-bold text-lg mr-2">Send a Pass</Text>
              <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
            </Pressable>
          </Link>
          
          {!isMember && (
            <Pressable className="bg-surface border border-border-hair rounded-full p-4 flex-row items-center justify-center">
              <Text className="text-text-primary font-bold text-lg">Join Membership</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Activity (Placeholder) */}
        <View>
          <Text className="text-lg font-bold text-text-primary mb-4">Recent Activity</Text>
          <View className="bg-surface rounded-md p-4 mb-3 flex-row items-center shadow-control">
            <View className="w-10 h-10 bg-lavender-secondary rounded-full items-center justify-center mr-3">
              <FontAwesome name="ticket" size={16} color="#090908" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-semibold">Welcome to Slide</Text>
              <Text className="text-text-secondary text-xs">Just now</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
