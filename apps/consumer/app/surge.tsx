import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useSurge } from "../hooks/useSurge";
import { formatTimeRemaining } from "../lib/surge-api";

export default function SurgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surge, userClaim, isLoading, isClaiming, claimSpot, error } =
    useSurge();
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (surge) {
      setTimeRemaining(formatTimeRemaining(surge.expires_at));
      const interval = setInterval(() => {
        setTimeRemaining(formatTimeRemaining(surge.expires_at));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [surge]);

  const handleClaim = async () => {
    const success = await claimSpot();
    // Stay on screen to show the result
  };

  const handleClose = () => {
    router.back();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      );
    }

    if (!surge) {
      return (
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <FontAwesome name="clock-o" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-text-primary text-center mb-2">
            No Active Surge
          </Text>
          <Text className="text-text-secondary text-center">
            Check back later for priority entry opportunities
          </Text>
        </View>
      );
    }

    // User already claimed
    if (userClaim) {
      const qrData = JSON.stringify({
        type: "surge",
        surge_id: surge.surge_id,
        position: userClaim.position,
        claimed_at: userClaim.claimed_at,
      });

      return (
        <View className="items-center py-4">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl font-bold text-green-600">
              #{userClaim.position}
            </Text>
          </View>

          <Text className="text-2xl font-bold text-text-primary text-center mb-2">
            You're In!
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            Show this at the door for priority entry tonight
          </Text>

          <View className="bg-white p-4 rounded-2xl shadow-lg mb-6">
            <QRCode value={qrData} size={180} />
          </View>

          <View className="bg-orange-50 rounded-xl px-4 py-3 flex-row items-center">
            <FontAwesome name="clock-o" size={16} color="#F97316" />
            <Text className="text-orange-600 font-medium ml-2">
              Valid for {timeRemaining}
            </Text>
          </View>
        </View>
      );
    }

    // Surge is full
    if (surge.is_full) {
      return (
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <FontAwesome name="ban" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-2xl font-bold text-text-primary text-center mb-2">
            Sold Out
          </Text>
          <Text className="text-text-secondary text-center">
            All priority spots have been claimed
          </Text>
        </View>
      );
    }

    // Can claim
    return (
      <View className="items-center py-4">
        <Text className="text-5xl mb-4">{"\uD83D\uDD25"}</Text>

        <Text className="text-2xl font-bold text-text-primary text-center mb-2">
          {surge.title}
        </Text>
        <Text className="text-text-secondary text-center mb-6">
          {surge.message}
        </Text>

        <View className="bg-orange-50 rounded-xl px-6 py-4 mb-6 items-center">
          <Text className="text-3xl font-bold text-orange-600">
            {surge.spots_remaining}/{surge.max_claims}
          </Text>
          <Text className="text-orange-600/70 text-sm">spots remaining</Text>
        </View>

        <Pressable
          onPress={handleClaim}
          disabled={isClaiming}
          className={`w-full rounded-full py-4 items-center mb-4 ${
            isClaiming ? "bg-orange-300" : "bg-orange-500 active:bg-orange-600"
          }`}
        >
          {isClaiming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">CLAIM MY SPOT</Text>
          )}
        </Pressable>

        {error && (
          <Text className="text-red-500 text-center text-sm">{error}</Text>
        )}

        <View className="flex-row items-center mt-2">
          <FontAwesome name="clock-o" size={14} color="#9CA3AF" />
          <Text className="text-text-secondary text-sm ml-2">
            Expires in {timeRemaining}
          </Text>
        </View>
      </View>
    );
  };

  const modalContent = (
    <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
      {/* Header with close button */}
      <View className="flex-row justify-end p-4 pb-0">
        <Pressable
          onPress={handleClose}
          hitSlop={10}
          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
        >
          <FontAwesome name="times" size={16} color="#6B7280" />
        </Pressable>
      </View>

      {/* Content */}
      <View className="px-6 pb-6">{renderContent()}</View>
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={40}
        tint="dark"
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          paddingBottom: insets.bottom,
        }}
      >
        {modalContent}
      </BlurView>
    );
  }

  return (
    <View
      className="flex-1 bg-black/60 justify-center items-center p-6"
      style={{ paddingBottom: insets.bottom }}
    >
      {modalContent}
    </View>
  );
}
