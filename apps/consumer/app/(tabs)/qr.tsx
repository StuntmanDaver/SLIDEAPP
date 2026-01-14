import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQRToken } from "../../hooks/useQRToken";
import QRCode from "react-native-qrcode-svg";
import { FontAwesome } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";

export default function QRScreen() {
  // Prevent device sleep while showing QR code
  useKeepAwake();
  
  const { qrToken, timeLeft, isLoading, error, hasValidPass } = useQRToken();

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center p-6">
      <View className="items-center w-full max-w-sm">
        <Text className="text-3xl font-bold text-text-primary mb-8 text-center">
          Entry Pass
        </Text>

        {!hasValidPass ? (
          <View className="items-center opacity-60">
            <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
              <FontAwesome name="ticket" size={32} color="#7D737B" />
            </View>
            <Text className="text-text-secondary text-center text-lg">
              No active pass found.{'\n'}Claim a pass to see your QR code.
            </Text>
          </View>
        ) : error ? (
          <View className="bg-red-100 p-4 rounded-lg">
            <Text className="text-red-800 text-center">{error}</Text>
          </View>
        ) : (
          <View className="items-center">
            <View className="bg-white p-6 rounded-3xl shadow-card mb-8">
              {qrToken ? (
                <QRCode value={qrToken} size={250} />
              ) : (
                <View className="w-[250px] h-[250px] items-center justify-center">
                  <ActivityIndicator size="large" color="#090908" />
                </View>
              )}
            </View>

            <View className="flex-row items-center mb-2">
              {isLoading && <ActivityIndicator size="small" color="#090908" className="mr-2" />}
              <Text className="text-text-secondary text-sm font-medium uppercase tracking-widest">
                Refreshing in {timeLeft}s
              </Text>
            </View>
            
            <Text className="text-text-secondary text-xs text-center px-8">
              Show this code to the door staff.{'\n'}It refreshes automatically for security.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
