import { View, Text, FlatList, RefreshControl, Pressable, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { usePasses } from "../../hooks/usePasses";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesome } from "@expo/vector-icons";
import { GlassCard } from "../../components/glass";

function PassCardSkeleton() {
  const shimmer = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.5,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  return (
    <GlassCard intensity="ultraThin" floating className="mb-4">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <Animated.View
              style={{ opacity: shimmer }}
              className="w-8 h-8 rounded-full bg-gray-200/70 mr-3"
            />
            <Animated.View
              style={{ opacity: shimmer }}
              className="h-4 w-32 rounded bg-gray-200/70"
            />
          </View>
          <Animated.View
            style={{ opacity: shimmer }}
            className="h-5 w-20 rounded-full bg-gray-200/70"
          />
        </View>
        <View className="ml-11">
          <Animated.View
            style={{ opacity: shimmer }}
            className="h-3 w-24 rounded bg-gray-200/70 mb-2"
          />
          <Animated.View
            style={{ opacity: shimmer }}
            className="h-3 w-28 rounded bg-gray-200/70"
          />
        </View>
      </View>
    </GlassCard>
  );
}

function PassCard({ pass, currentUserId, onUsePass }: { pass: any; currentUserId: string; onUsePass?: (passId: string) => void }) {
  const isReceived = pass.owner_user_id === currentUserId;
  const isSent = pass.issuer_user_id === currentUserId && !isReceived;

  let statusColor = "bg-gray-200/80";
  let statusText = pass.status;
  let statusTextColor = "text-gray-700";

  if (pass.status === "created") {
    statusColor = "bg-blue-100/80";
    statusTextColor = "text-blue-800";
    statusText = "Awaiting Claim";
  } else if (pass.status === "claimed") {
    statusColor = "bg-green-100/80";
    statusTextColor = "text-green-800";
    statusText = "Ready to Use";
  } else if (pass.status === "redeemed") {
    statusColor = "bg-gray-100/80";
    statusTextColor = "text-gray-500";
    statusText = "Used";
  } else if (pass.status === "revoked" || pass.status === "expired") {
    statusColor = "bg-red-100/80";
    statusTextColor = "text-red-800";
    statusText = pass.status.charAt(0).toUpperCase() + pass.status.slice(1);
  }

  const date = new Date(pass.created_at).toLocaleDateString();

  const canUse = pass.status === "claimed" && isReceived;

  return (
    <Pressable onPress={canUse ? () => onUsePass?.(pass.pass_id) : undefined} disabled={!canUse}>
      <GlassCard intensity="ultraThin" floating className="mb-4">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isReceived ? 'bg-lavender-secondary/40' : 'bg-gray-100/40'}`}>
                <FontAwesome name={isReceived ? "arrow-down" : "arrow-up"} size={14} color="#090908" />
              </View>
              <Text className="font-bold text-text-primary text-base">
                {isReceived ? "Received Pass" : "Sent Pass"}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${statusColor}`}>
              <Text className={`text-xs font-bold ${statusTextColor}`}>{statusText}</Text>
            </View>
          </View>

          <View className="ml-11">
            <Text className="text-text-secondary text-sm mb-1">
              {date}
            </Text>
            <Text className="text-text-secondary text-xs">
              ID: ...{pass.pass_id.slice(-8)}
            </Text>
          </View>

          {canUse && (
            <View className="mt-3 ml-11">
              <View className="bg-text-primary rounded-full py-2 px-4 self-start flex-row items-center">
                <FontAwesome name="qrcode" size={14} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Use Pass</Text>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function PassesScreen() {
  const { passes, isLoading, refetch } = usePasses();
  const { user } = useAuth();
  const router = useRouter();
  const skeletonData = useMemo(
    () => Array.from({ length: 4 }, (_, index) => ({ id: `skeleton-${index}` })),
    []
  );

  const handleUsePass = (passId: string) => {
    // Navigate to QR tab with selected pass
    router.push({ pathname: "/(tabs)/qr", params: { passId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-text-primary">My Passes</Text>
      </View>

      <FlatList
        data={isLoading ? skeletonData : passes}
        keyExtractor={(item: any) => item.pass_id || item.id}
        renderItem={({ item }) =>
          isLoading ? (
            <PassCardSkeleton />
          ) : (
            <PassCard pass={item} currentUserId={user?.id || ""} onUsePass={handleUsePass} />
          )
        }
        contentContainerStyle={{ padding: 24, paddingTop: 0, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20 opacity-50">
              <FontAwesome name="ticket" size={48} color="#7D737B" />
              <Text className="text-text-secondary mt-4 text-center">
                No passes found.{'\n'}Buy a membership to start sending passes.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
