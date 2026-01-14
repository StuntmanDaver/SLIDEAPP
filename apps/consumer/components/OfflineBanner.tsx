import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

export function OfflineBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute top-0 left-0 right-0 bg-red-600 z-50 flex-row justify-center items-center p-2"
      style={{ paddingTop: insets.top }}
    >
      <FontAwesome name="wifi" size={14} color="#FFFFFF" />
      <Text className="text-white font-medium ml-2 text-xs">
        No Internet Connection
      </Text>
    </View>
  );
}
