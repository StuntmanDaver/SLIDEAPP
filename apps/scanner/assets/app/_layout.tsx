import { Stack } from "expo-router";
import { View, ActivityIndicator, AppState, AppStateStatus } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../../lib/supabase";

SplashScreen.preventAutoHideAsync();

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

export default function RootLayout() {
  const { isLoading, isSignedIn } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isSignedIn
      ) {
        // App has come to the foreground
        const loginTimeStr = await SecureStore.getItemAsync("staff_login_time");
        if (loginTimeStr) {
          const loginTime = parseInt(loginTimeStr, 10);
          const now = Date.now();
          if (now - loginTime > SESSION_TIMEOUT) {
            await supabase.auth.signOut();
            // Clear login time
            await SecureStore.deleteItemAsync("staff_login_time");
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg">
        <ActivityIndicator size="large" color="#090908" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="history" options={{ presentation: "modal" }} />
    </Stack>
  );
}
