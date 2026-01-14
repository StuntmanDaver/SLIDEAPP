import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignInWithApple = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: "slide://auth/callback",
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "slide://auth/callback",
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg justify-center items-center px-6">
      <View className="w-full max-w-xs">
        <Text className="text-4xl font-bold text-text-primary mb-2 text-center">
          Slide
        </Text>
        <Text className="text-base text-text-secondary text-center mb-12">
          Your line-skip pass to any night
        </Text>

        {error && (
          <View className="bg-red-100 rounded-lg p-3 mb-6">
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSignInWithApple}
          disabled={isLoading}
          className="bg-text-primary rounded-md p-4 mb-3 flex-row items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Sign in with Apple</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleSignInWithGoogle}
          disabled={isLoading}
          className="bg-surface border border-border-hair rounded-md p-4 flex-row items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator color="#090908" />
          ) : (
            <Text className="text-text-primary font-semibold">Sign in with Google</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
