import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect } from "react";
import { SCAN_RESULTS } from "../lib/shared";

interface ScanResultProps {
  result: keyof typeof SCAN_RESULTS;
  passId?: string;
  onDismiss: () => void;
}

export function ScanResult({ result, passId, onDismiss }: ScanResultProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000); // Auto dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  let backgroundColor = "bg-red-500";
  let iconName: any = "times-circle";
  let title = "Invalid";
  let message = "This pass is not valid.";

  switch (result) {
    case SCAN_RESULTS.VALID:
      backgroundColor = "bg-green-500";
      iconName = "check-circle";
      title = "Valid Pass";
      message = "Access Granted";
      break;
    case SCAN_RESULTS.USED:
      backgroundColor = "bg-yellow-500";
      iconName = "exclamation-circle";
      title = "Already Used";
      message = "Pass has already been redeemed.";
      break;
    case SCAN_RESULTS.EXPIRED:
      backgroundColor = "bg-orange-500";
      iconName = "clock-o";
      title = "Expired";
      message = "QR code expired. Ask to refresh.";
      break;
    case SCAN_RESULTS.REVOKED:
      backgroundColor = "bg-red-600";
      iconName = "ban";
      title = "Revoked";
      message = "Pass has been revoked.";
      break;
    case SCAN_RESULTS.INVALID:
    default:
      backgroundColor = "bg-red-500";
      iconName = "times-circle";
      title = "Invalid";
      message = "QR code not recognized.";
      break;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onDismiss}
      className={`absolute bottom-0 left-0 right-0 ${backgroundColor} p-8 items-center justify-center rounded-t-3xl shadow-lg z-50`}
      style={{ height: Dimensions.get("window").height * 0.4 }}
    >
      <FontAwesome name={iconName} size={64} color="white" />
      <Text className="text-white text-4xl font-bold mt-4 mb-2">{title}</Text>
      <Text className="text-white text-xl opacity-90 text-center">{message}</Text>
      {passId && (
        <Text className="text-white text-sm opacity-70 mt-4">
          ID: ...{passId.slice(-8)}
        </Text>
      )}
    </TouchableOpacity>
  );
}
