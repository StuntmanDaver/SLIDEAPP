import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQRToken } from "../../hooks/useQRToken";
import QRCode from "react-native-qrcode-svg";
import { FontAwesome } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { GlassCard } from "../../components/glass";
import { useState, useEffect } from "react";

export default function QRScreen() {
  // Prevent device sleep while showing QR code
  useKeepAwake();

  // Get selected pass ID from route params (if navigated from passes screen)
  const { passId: selectedPassId } = useLocalSearchParams<{ passId?: string }>();

  const { qrToken, timeLeft, isLoading, error, hasValidPass, passId } = useQRToken(selectedPassId);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("QR Screen State:", { qrToken, timeLeft, isLoading, error, hasValidPass });
  }, [qrToken, timeLeft, isLoading, error, hasValidPass]);

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center p-6">
      <View className="items-center w-full max-w-sm">
        <Text className="text-3xl font-bold text-text-primary mb-8 text-center">
          Entry Pass
        </Text>

        {!hasValidPass ? (
          <View className="items-center opacity-60">
            <GlassCard intensity="thin" floating>
              <View className="w-16 h-16 items-center justify-center">
                <FontAwesome name="ticket" size={32} color="#7D737B" />
              </View>
            </GlassCard>
            <Text className="text-text-secondary text-center text-lg mt-4">
              No active pass found.{'\n'}Claim a pass to see your QR code.
            </Text>
          </View>
        ) : error ? (
          <GlassCard intensity="thin" floating>
            <View className="p-4">
              <Text className="text-red-800 text-center">{error}</Text>
            </View>
          </GlassCard>
        ) : (
          <View className="items-center">
            <GlassCard intensity="ultraThin" floating className="mb-8">
              <View className="p-6">
                {qrToken ? (
                  <View style={{ width: 250, height: 250, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <QRCode
                      value={qrToken}
                      size={230}
                      backgroundColor="white"
                      color="#090908"
                    />
                  </View>
                ) : (
                  <View style={{ width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#090908" />
                  </View>
                )}
              </View>
            </GlassCard>

            <View className="flex-row items-center mb-2">
              {isLoading && (
                <View style={{ marginRight: 8 }}>
                  <ActivityIndicator size="small" color="#090908" />
                </View>
              )}
              <Text className="text-text-secondary text-sm font-medium uppercase tracking-widest">
                Refreshing in {timeLeft}s
              </Text>
            </View>

            <Text className="text-text-secondary text-xs text-center px-8">
              Show this code to the door staff.{'\n'}It refreshes automatically for security.
            </Text>

            {passId && (
              <Text className="text-text-secondary text-xs text-center mt-4 opacity-50">
                Pass: ...{passId.slice(-8)}
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
