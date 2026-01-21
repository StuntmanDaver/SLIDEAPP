import { View, Text, Pressable, Alert, Linking, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { useDeviceBinding } from "../../hooks/useDeviceBinding";
import { supabase } from "../../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { createPortalSession } from "../../lib/api";
import { useState } from "react";
import { GlassCard } from "../../components/glass";

export default function AccountScreen() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { bindingStatus, deviceInfo, transferToCurrentDevice, isLoading: deviceLoading } = useDeviceBinding();
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Alert.alert("Account Deleted", "Your account has been scheduled for deletion.");
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await createPortalSession();
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Failed to open the billing portal");
    }
  };

  const handleTransferDevice = () => {
    Alert.alert(
      "Transfer Device",
      "This will bind your account to this device. You can only do this once every 7 days. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          onPress: async () => {
            setIsTransferring(true);
            const result = await transferToCurrentDevice();
            setIsTransferring(false);

            if (result.success) {
              Alert.alert("Success", result.message);
            } else {
              Alert.alert("Error", result.message);
            }
          }
        }
      ]
    );
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleHelpSupport = () => {
    Alert.alert(
      "Help & Support",
      "Need help?\n\nVisit: slideapp.com/support\nEmail: support@slideapp.com",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Visit Website",
          onPress: () => Linking.openURL("https://slideapp.com/support")
        },
        {
          text: "Email Us",
          onPress: () => Linking.openURL("mailto:support@slideapp.com?subject=Slide App Support")
        }
      ]
    );
  };

  const email = user?.email;
  const isMember = subscription?.status === "active";

  const currentDeviceName = deviceInfo?.device_name || "Unknown Device";
  const boundDeviceName = bindingStatus?.bound_device_name || "Not bound";
  const isCurrentDeviceBound = bindingStatus?.is_current_device;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Text className="text-3xl font-bold text-text-primary mb-8">Account</Text>

        {/* Profile Card */}
        <GlassCard intensity="thin" floating className="mb-6">
          <View className="p-4 flex-row items-center">
            <View className="w-16 h-16 bg-lavender-secondary/60 rounded-full items-center justify-center mr-4">
              <FontAwesome name="user" size={32} color="#090908" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-primary">
                {user?.user_metadata?.full_name || "Slide Member"}
              </Text>
              <Text className="text-text-secondary">{email}</Text>
              <View className={`mt-2 self-start px-2 py-1 rounded-full ${isMember ? "bg-green-100/80" : "bg-gray-200/80"}`}>
                <Text className={`text-xs font-bold ${isMember ? "text-green-800" : "text-gray-600"}`}>
                  {isMember ? "Active Member" : "Free Account"}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Settings Options */}
        <GlassCard intensity="ultraThin" floating className="mb-6">
          <Pressable
            onPress={handleManageSubscription}
            className="p-4 flex-row items-center justify-between border-b border-glass-border"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-50/80 rounded-full items-center justify-center mr-3">
                <FontAwesome name="credit-card" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Manage Subscription</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>

          <Pressable
            onPress={handleNotifications}
            className="p-4 flex-row items-center justify-between border-b border-glass-border"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-50/80 rounded-full items-center justify-center mr-3">
                <FontAwesome name="bell" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Notifications</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>

          <Pressable
            onPress={handleHelpSupport}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-50/80 rounded-full items-center justify-center mr-3">
                <FontAwesome name="question-circle" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Help & Support</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>
        </GlassCard>

        {/* Device Binding Section */}
        <GlassCard intensity="ultraThin" floating className="mb-6">
          <View className="p-4 border-b border-glass-border">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-green-50/80 rounded-full items-center justify-center mr-3">
                <FontAwesome name="mobile" size={16} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Device Binding</Text>
            </View>
            {deviceLoading ? (
              <ActivityIndicator size="small" color="#090908" />
            ) : (
              <View className="ml-11">
                <Text className="text-text-secondary text-sm">
                  Current: <Text className="font-medium">{currentDeviceName}</Text>
                </Text>
                {bindingStatus?.is_bound && (
                  <Text className="text-text-secondary text-sm mt-1">
                    Bound to: <Text className="font-medium">{boundDeviceName}</Text>
                    {isCurrentDeviceBound && (
                      <Text className="text-green-600"> (This device)</Text>
                    )}
                  </Text>
                )}
                {!bindingStatus?.is_bound && (
                  <Text className="text-text-secondary text-sm mt-1">
                    No device bound yet
                  </Text>
                )}
              </View>
            )}
          </View>

          {bindingStatus?.is_bound && !isCurrentDeviceBound && (
            <Pressable
              onPress={handleTransferDevice}
              disabled={isTransferring}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-orange-50/80 rounded-full items-center justify-center mr-3">
                  <FontAwesome name="exchange" size={14} color="#090908" />
                </View>
                <View>
                  <Text className="text-text-primary font-medium">Transfer to This Device</Text>
                  <Text className="text-text-secondary text-xs">7-day cooldown applies</Text>
                </View>
              </View>
              {isTransferring ? (
                <ActivityIndicator size="small" color="#090908" />
              ) : (
                <FontAwesome name="chevron-right" size={12} color="#7D737B" />
              )}
            </Pressable>
          )}
        </GlassCard>

        <GlassCard intensity="thin" floating className="mb-4">
          <Pressable
            onPress={handleSignOut}
            className="p-4 flex-row items-center justify-center"
          >
            <Text className="text-text-primary font-bold">Sign Out</Text>
          </Pressable>
        </GlassCard>

        <Pressable
          onPress={handleDeleteAccount}
          className="p-4 items-center"
        >
          <Text className="text-red-500 font-medium">Delete Account</Text>
        </Pressable>

        <View className="mt-8 items-center">
          <Text className="text-text-secondary text-xs">Version 0.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
