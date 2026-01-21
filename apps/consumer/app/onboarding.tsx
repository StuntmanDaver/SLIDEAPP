import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { FontAwesome } from "@expo/vector-icons";

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

export default function OnboardingScreen() {
  const router = useRouter();
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
    // Navigate to auth or home depending on logic, for now we assume this is called when not auth
    // We can just replace with the root route which will trigger the auth check
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg justify-between p-6">
      <View className="items-end">
        <Pressable onPress={handleSkip} className="p-2">
          <Text className="text-text-secondary font-medium">Skip</Text>
        </Pressable>
      </View>

      <View className="items-center">
        <View className="w-64 h-64 bg-surface rounded-full items-center justify-center mb-8 shadow-control">
          <FontAwesome name={slides[currentIndex].icon as any} size={80} color="#090908" />
        </View>
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
