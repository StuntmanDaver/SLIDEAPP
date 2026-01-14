import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { supabase } from "../../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";

export default function AccountScreen() {
  const { user } = useAuth();
  const { subscription } = useSubscription();

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
            // In a real app, call an Edge Function to delete user and data
            Alert.alert("Account Deleted", "Your account has been scheduled for deletion.");
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const handleManageSubscription = () => {
    // In a real app, open Stripe Customer Portal URL
    Alert.alert("Manage Subscription", "This would open the Stripe Customer Portal.");
  };

  const email = user?.email;
  const isMember = subscription?.status === "active";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="p-6">
        <Text className="text-3xl font-bold text-text-primary mb-8">Account</Text>

        {/* Profile Card */}
        <View className="bg-surface rounded-xl p-4 mb-6 shadow-control flex-row items-center">
          <View className="w-16 h-16 bg-lavender-secondary rounded-full items-center justify-center mr-4">
            <FontAwesome name="user" size={32} color="#090908" />
          </View>
          <View>
            <Text className="text-lg font-bold text-text-primary">
              {user?.user_metadata?.full_name || "Slide Member"}
            </Text>
            <Text className="text-text-secondary">{email}</Text>
            <View className={`mt-2 self-start px-2 py-1 rounded-full ${isMember ? "bg-green-100" : "bg-gray-200"}`}>
              <Text className={`text-xs font-bold ${isMember ? "text-green-800" : "text-gray-600"}`}>
                {isMember ? "Active Member" : "Free Account"}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View className="bg-surface rounded-xl overflow-hidden shadow-control mb-6">
          <Pressable 
            onPress={handleManageSubscription}
            className="p-4 flex-row items-center justify-between border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                <FontAwesome name="credit-card" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Manage Subscription</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>

          <Pressable 
            className="p-4 flex-row items-center justify-between border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center mr-3">
                <FontAwesome name="bell" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Notifications</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>

          <Pressable 
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center mr-3">
                <FontAwesome name="question-circle" size={14} color="#090908" />
              </View>
              <Text className="text-text-primary font-medium">Help & Support</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#7D737B" />
          </Pressable>
        </View>

        <Pressable 
          onPress={handleSignOut}
          className="bg-surface rounded-xl p-4 mb-4 shadow-control flex-row items-center justify-center"
        >
          <Text className="text-text-primary font-bold">Sign Out</Text>
        </Pressable>

        <Pressable 
          onPress={handleDeleteAccount}
          className="p-4 items-center"
        >
          <Text className="text-red-500 font-medium">Delete Account</Text>
        </Pressable>

        <View className="mt-8 items-center">
          <Text className="text-text-secondary text-xs">Version 0.1.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
