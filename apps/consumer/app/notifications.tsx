import { View, Text, Pressable, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { GlassCard } from "../components/glass";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "pass_claimed",
      title: "Pass Claimed",
      description: "When someone claims a pass you sent",
      enabled: true,
    },
    {
      id: "pass_redeemed",
      title: "Pass Redeemed",
      description: "When your pass is used at the door",
      enabled: true,
    },
    {
      id: "pass_received",
      title: "Pass Received",
      description: "When you receive a pass from a friend",
      enabled: true,
    },
    {
      id: "membership_updates",
      title: "Membership Updates",
      description: "Renewal reminders and billing notifications",
      enabled: true,
    },
    {
      id: "promotions",
      title: "Promotions & News",
      description: "Special offers and app updates",
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const enableAll = () => {
    setSettings(prev => prev.map(setting => ({ ...setting, enabled: true })));
  };

  const disableAll = () => {
    setSettings(prev => prev.map(setting => ({ ...setting, enabled: false })));
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <GlassCard intensity="thin" floating>
            <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
              <FontAwesome name="arrow-left" size={18} color="#090908" />
            </Pressable>
          </GlassCard>
          <Text className="text-3xl font-bold text-text-primary ml-4">Notifications</Text>
        </View>

        {/* Description */}
        <Text className="text-text-secondary mb-6">
          Choose which notifications you'd like to receive. You can change these settings at any time.
        </Text>

        {/* Quick Actions */}
        <View className="flex-row mb-6" style={{ gap: 12 }}>
          <Pressable
            onPress={enableAll}
            className="flex-1 bg-text-primary/10 rounded-full py-3 items-center"
          >
            <Text className="text-text-primary font-medium">Enable All</Text>
          </Pressable>
          <Pressable
            onPress={disableAll}
            className="flex-1 bg-text-primary/10 rounded-full py-3 items-center"
          >
            <Text className="text-text-primary font-medium">Disable All</Text>
          </Pressable>
        </View>

        {/* Notification Settings */}
        <GlassCard intensity="ultraThin" floating className="mb-6">
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              className={`p-4 flex-row items-center justify-between ${
                index < settings.length - 1 ? "border-b border-glass-border" : ""
              }`}
            >
              <View className="flex-1 mr-4">
                <Text className="text-text-primary font-medium text-base">{setting.title}</Text>
                <Text className="text-text-secondary text-sm mt-1">{setting.description}</Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: "#E4E3DF", true: "#090908" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </GlassCard>

        {/* Push Notification Status */}
        <GlassCard intensity="thin" floating className="mb-6">
          <View className="p-4">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-green-100/80 rounded-full items-center justify-center mr-3">
                <FontAwesome name="bell" size={14} color="#16a34a" />
              </View>
              <Text className="text-text-primary font-medium">Push Notifications</Text>
            </View>
            <Text className="text-text-secondary text-sm ml-11">
              Push notifications are enabled for this device. To change system-level permissions, go to Settings → Slide.
            </Text>
          </View>
        </GlassCard>

        {/* Info */}
        <View className="items-center">
          <Text className="text-text-secondary text-xs text-center">
            We respect your privacy. You can manage your notification preferences at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
