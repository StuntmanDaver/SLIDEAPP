import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { claimPass } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { GlassCard } from "../components/glass";

export default function ClaimPassScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!token || authLoading || !isSignedIn || claimAttempted.current) return;

    const performClaim = async () => {
      claimAttempted.current = true;
      setStatus("claiming");
      try {
        await claimPass(token);
        setStatus("success");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to claim pass");
        setStatus("error");
      }
    };

    performClaim();
  }, [token, authLoading, isSignedIn]);

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const handleGoToPasses = () => {
    router.replace("/(tabs)/passes");
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#090908" />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-bg justify-center items-center p-6">
        <GlassCard intensity="regular">
          <View className="p-6">
            <Text className="text-text-primary text-center">Please sign in to claim this pass.</Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg p-6 justify-center items-center">
      <View className="w-full max-w-sm items-center">
        {status === "idle" || status === "claiming" ? (
          <GlassCard intensity="regular">
            <View className="p-8 items-center">
              <View className="mb-6">
                <ActivityIndicator size="large" color="#090908" />
              </View>
              <Text className="text-xl font-bold text-text-primary text-center">
                Claiming your pass...
              </Text>
            </View>
          </GlassCard>
        ) : status === "success" ? (
          <GlassCard intensity="regular">
            <View className="p-6 items-center">
              <View className="w-24 h-24 bg-green-100/80 rounded-full items-center justify-center mb-6">
                <FontAwesome name="check" size={48} color="#22c55e" />
              </View>
              <Text className="text-3xl font-bold text-text-primary mb-4 text-center">
                Pass Claimed!
              </Text>
              <Text className="text-text-secondary text-center mb-10 text-lg">
                You're all set. The pass has been added to your wallet.
              </Text>

              <Pressable
                onPress={handleGoToPasses}
                className="bg-text-primary rounded-full w-full p-4 items-center mb-4"
              >
                <Text className="text-surface font-bold text-lg">View My Passes</Text>
              </Pressable>

              <Pressable onPress={handleGoHome} className="p-4">
                <Text className="text-text-secondary font-medium">Go Home</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <GlassCard intensity="regular">
            <View className="p-6 items-center">
              <View className="w-24 h-24 bg-red-100/80 rounded-full items-center justify-center mb-6">
                <FontAwesome name="exclamation-triangle" size={40} color="#ef4444" />
              </View>
              <Text className="text-2xl font-bold text-text-primary mb-2 text-center">
                Unable to Claim
              </Text>
              <Text className="text-text-secondary text-center mb-10">
                {errorMessage || "This pass link is invalid or has already been claimed."}
              </Text>

              <Pressable
                onPress={handleGoHome}
                className="bg-white/80 border border-glass-border rounded-full w-full p-4 items-center"
              >
                <Text className="text-text-primary font-bold text-lg">Go Home</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}
      </View>
    </SafeAreaView>
  );
}
