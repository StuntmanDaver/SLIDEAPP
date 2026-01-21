import { View, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-bg">
        <ActivityIndicator size="large" color="#090908" />
      </View>
    );
  }

  return (
    <View className="justify-center items-center p-4">
      <ActivityIndicator size="small" color="#090908" />
    </View>
  );
}
