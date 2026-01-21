// NativeWind setup for third-party components (global.css is imported in index.js)
import "../nativewind-setup";
import { Stack, Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, Modal, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../components/AuthScreen";
import { useEffect, useState } from "react";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { OfflineBanner } from "../components/OfflineBanner";
import { SurgeBanner } from "../components/SurgeBanner";
import * as SecureStore from "expo-secure-store";
import OnboardingScreen from "./onboarding";
import { useDeviceBinding } from "../hooks/useDeviceBinding";
import { useSurge } from "../hooks/useSurge";
import { supabase } from "../lib/supabase";
import { setupPushNotifications } from "../lib/notifications";
import { FontAwesome } from "@expo/vector-icons";
import { SplashScreen } from "../components/SplashScreen";

// Keep the expo splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "has_seen_onboarding";

// Dev auth bypass for local testing - set EXPO_PUBLIC_DEV_AUTH_BYPASS=true in .env.local
const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function RootLayout() {
  const { isSignedIn: authSignedIn, isLoading: authLoading } = useAuth();
  const { isConnected } = useNetworkStatus();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeviceBlockedModal, setShowDeviceBlockedModal] = useState(false);
  const [boundDeviceName, setBoundDeviceName] = useState<string | null>(null);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Use dev bypass if enabled, otherwise use actual auth state
  const isSignedIn = DEV_AUTH_BYPASS || authSignedIn;

  const { bindingStatus, isLoading: deviceBindingLoading } = useDeviceBinding();
  const { surge, userClaim, dismissSurge } = useSurge();

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

  // Check device binding status after sign in
  useEffect(() => {
    if (isSignedIn && bindingStatus && !deviceBindingLoading) {
      if (bindingStatus.is_bound && !bindingStatus.is_current_device) {
        setBoundDeviceName(bindingStatus.bound_device_name || "another device");
        setShowDeviceBlockedModal(true);
      }
    }
  }, [isSignedIn, bindingStatus, deviceBindingLoading]);

  // Setup push notifications when signed in
  useEffect(() => {
    if (isSignedIn) {
      setupPushNotifications().catch((err) => {
        console.log("Push notification setup error:", err);
      });
    }
  }, [isSignedIn]);

  // Hide the expo splash screen once we're ready to show our custom splash
  useEffect(() => {
    if (!isLoading && !authLoading) {
      ExpoSplashScreen.hideAsync();
    }
  }, [isLoading, authLoading]);

  // Handle custom splash screen finish
  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  const handleSignOut = async () => {
    setShowDeviceBlockedModal(false);
    await supabase.auth.signOut();
  };

  if (isLoading || authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg">
        <ActivityIndicator size="large" color="#090908" />
      </View>
    );
  }

  // Show custom splash screen for 5 seconds before transitioning
  if (showCustomSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"}
      merchantIdentifier="merchant.com.slidevenue.consumer"
    >
      <View className="flex-1">
        {!isConnected && <OfflineBanner />}
        {DEV_AUTH_BYPASS && (
          <View className="bg-yellow-500 px-3 py-1">
            <Text className="text-black text-xs font-bold text-center">
              DEV MODE - Auth Bypassed
            </Text>
          </View>
        )}
        {!hasSeenOnboarding ? (
          <OnboardingScreen onComplete={() => setHasSeenOnboarding(true)} />
        ) : !isSignedIn ? (
          <AuthScreen />
        ) : (
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="send-pass" options={{ presentation: "modal" }} />
              <Stack.Screen name="claim" />
              <Stack.Screen name="membership" options={{ presentation: "modal" }} />
              <Stack.Screen name="surge" options={{ presentation: "transparentModal" }} />
            </Stack>

            {/* Surge Banner */}
            {surge && (
              <SurgeBanner
                surge={surge}
                userClaim={userClaim}
                onDismiss={dismissSurge}
              />
            )}

            {/* Device Blocked Modal with Glass Effect */}
            <Modal
              visible={showDeviceBlockedModal}
              animationType="fade"
              transparent={true}
              onRequestClose={() => {}}
            >
              {Platform.OS === "ios" ? (
                <BlurView intensity={40} tint="dark" className="flex-1 justify-center items-center p-6">
                  <View className="bg-white/90 rounded-2xl p-6 w-full max-w-sm shadow-lg border border-glass-border overflow-hidden">
                    <View className="items-center mb-4">
                      <View className="w-16 h-16 bg-red-100/80 rounded-full items-center justify-center mb-4">
                        <FontAwesome name="exclamation-triangle" size={32} color="#EF4444" />
                      </View>
                      <Text className="text-xl font-bold text-text-primary text-center mb-2">
                        Device Already Bound
                      </Text>
                      <Text className="text-text-secondary text-center">
                        Your account is already bound to{" "}
                        <Text className="font-semibold">{boundDeviceName}</Text>.
                      </Text>
                      <Text className="text-text-secondary text-center mt-2">
                        For security, each account can only be used on one device at a time.
                      </Text>
                    </View>

                    <Text className="text-sm text-text-secondary text-center mb-6">
                      To use Slide on this device, please sign in with a different account or transfer
                      your device binding from the original device's Account settings.
                    </Text>

                    <Pressable
                      onPress={handleSignOut}
                      className="bg-text-primary rounded-full p-4 items-center"
                    >
                      <Text className="text-white font-bold">Sign Out</Text>
                    </Pressable>
                  </View>
                </BlurView>
              ) : (
                <View className="flex-1 bg-black/60 justify-center items-center p-6">
                  <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
                    <View className="items-center mb-4">
                      <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                        <FontAwesome name="exclamation-triangle" size={32} color="#EF4444" />
                      </View>
                      <Text className="text-xl font-bold text-text-primary text-center mb-2">
                        Device Already Bound
                      </Text>
                      <Text className="text-text-secondary text-center">
                        Your account is already bound to{" "}
                        <Text className="font-semibold">{boundDeviceName}</Text>.
                      </Text>
                      <Text className="text-text-secondary text-center mt-2">
                        For security, each account can only be used on one device at a time.
                      </Text>
                    </View>

                    <Text className="text-sm text-text-secondary text-center mb-6">
                      To use Slide on this device, please sign in with a different account or transfer
                      your device binding from the original device's Account settings.
                    </Text>

                    <Pressable
                      onPress={handleSignOut}
                      className="bg-text-primary rounded-full p-4 items-center"
                    >
                      <Text className="text-white font-bold">Sign Out</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Modal>
          </>
        )}
      </View>
    </StripeProvider>
  );
}
