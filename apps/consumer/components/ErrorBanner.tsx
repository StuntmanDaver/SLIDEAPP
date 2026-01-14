import { View, Text, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View className="bg-red-50 p-4 rounded-lg flex-row items-start border border-red-100 mb-4">
      <FontAwesome name="exclamation-circle" size={16} color="#ef4444" style={{ marginTop: 2 }} />
      <View className="flex-1 ml-3">
        <Text className="text-red-800 text-sm font-medium">{message}</Text>
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} className="ml-2">
          <FontAwesome name="times" size={12} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );
}
