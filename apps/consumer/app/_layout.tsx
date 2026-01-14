import { Stack, Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../components/AuthScreen";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { OfflineBanner } from "../components/OfflineBanner";
import * as SecureStore from "expo-secure-store";
import OnboardingScreen from "./onboarding";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "has_seen_onboarding";

export default function RootLayout() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isConnected } = useNetworkStatus();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
        setHasSeenOnboarding(value === "true");
      } catch (e) {
        setHasSeenOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (!isLoading && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, authLoading]);

  if (isLoading || authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg">
        <ActivityIndicator size="large" color="#090908" />
      </View>
    );
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"}
      merchantIdentifier="merchant.com.slidevenue.consumer"
    >
      <View className="flex-1">
        {!isConnected && <OfflineBanner />}
        {!hasSeenOnboarding ? (
          <OnboardingScreen />
        ) : !isSignedIn ? (
          <AuthScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="send-pass" options={{ presentation: "modal" }} />
            <Stack.Screen name="claim" />
          </Stack>
        )}
      </View>
    </StripeProvider>
  );
}
