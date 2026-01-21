import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { FontAwesome } from "@expo/vector-icons";
import { GlassCard } from "../components/glass";

const ONBOARDING_KEY = "has_seen_onboarding";

const slides = [
  {
    title: "Skip the Line",
    description: "Your membership is your VIP pass. No more waiting in long queues at your favorite venues.",
    icon: "ticket",
  },
  {
    title: "Share with Friends",
    description: "Send line-skip passes to your friends instantly. Be the hero of the night.",
    icon: "share-alt",
  },
  {
    title: "Secure & Simple",
    description: "Rotating QR codes ensure your pass is unique and secure. Just scan and go.",
    icon: "shield",
  },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    onComplete?.();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg justify-between p-6">
      <View className="items-end">
        <GlassCard intensity="thin">
          <Pressable onPress={handleSkip} className="px-4 py-2">
            <Text className="text-text-secondary font-medium">Skip</Text>
          </Pressable>
        </GlassCard>
      </View>

      <View className="items-center">
        <GlassCard intensity="thick" className="mb-8">
          <View className="w-64 h-64 items-center justify-center">
            <FontAwesome name={slides[currentIndex].icon as any} size={80} color="#090908" />
          </View>
        </GlassCard>
        <Text className="text-3xl font-bold text-text-primary text-center mb-4">
          {slides[currentIndex].title}
        </Text>
        <Text className="text-text-secondary text-center text-lg px-4">
          {slides[currentIndex].description}
        </Text>
      </View>

      <View>
        <View className="flex-row justify-center mb-8 gap-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? "w-8 bg-text-primary" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          className="bg-text-primary rounded-full p-4 items-center"
        >
          <Text className="text-surface font-bold text-lg">
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
