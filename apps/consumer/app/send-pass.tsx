import { View, Text, Pressable, ActivityIndicator, Share } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { createPass } from "../lib/api";
import { usePassBalance } from "../hooks/usePassBalance";
import * as Haptics from "expo-haptics";
import { GlassCard } from "../components/glass";

export default function SendPassScreen() {
  const router = useRouter();
  const { refetch } = usePassBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendPass = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);

    try {
      const response = await createPass();

      // Update balance
      await refetch();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);

      // Open share sheet
      const result = await Share.share({
        message: `Here is a Slide pass for you! Claim it here: ${response.claim_link}`,
        url: response.claim_link, // iOS only
      });

      if (result.action === Share.dismissedAction) {
        // User dismissed, maybe keep success state or close modal
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pass");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg p-6">
      <View className="flex-1 justify-center items-center">
        {success ? (
          <GlassCard intensity="regular" className="w-full max-w-sm">
            <View className="p-6 items-center">
              <View className="w-20 h-20 bg-text-primary rounded-full items-center justify-center mb-6">
                <FontAwesome name="check" size={40} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-bold text-text-primary mb-2">Pass Sent!</Text>
              <Text className="text-text-secondary text-center mb-8">
                Your pass has been created and is ready to be claimed.
              </Text>
              <Pressable
                onPress={handleClose}
                className="bg-white/80 border border-glass-border rounded-full px-8 py-3"
              >
                <Text className="text-text-primary font-bold">Done</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <GlassCard intensity="regular" className="w-full max-w-sm">
            <View className="p-6">
              <Text className="text-3xl font-bold text-text-primary mb-4 text-center">
                Send a Pass
              </Text>
              <Text className="text-text-secondary text-center mb-8">
                Create a single-use link to send one of your line-skip passes to a friend.
              </Text>

              {error && (
                <View className="bg-red-100/80 rounded-md p-3 mb-6">
                  <Text className="text-red-800 text-center">{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleSendPass}
                disabled={isLoading}
                className="bg-text-primary rounded-full p-4 flex-row items-center justify-center mb-4"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-surface font-bold text-lg mr-2">Create Link</Text>
                    <FontAwesome name="link" size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleClose}
                disabled={isLoading}
                className="items-center p-4"
              >
                <Text className="text-text-secondary font-medium">Cancel</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}
      </View>
    </SafeAreaView>
  );
}
