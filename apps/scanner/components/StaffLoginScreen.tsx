import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import type { StaffRole } from "@slide/shared";

export function StaffLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign in with email/password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.user) {
        setError("No user returned from sign-in");
        return;
      }

      // Verify staff role
      const { data: staffData, error: staffError } = await supabase
        .from("staff_users")
        .select("role, is_active")
        .eq("user_id", data.user.id)
        .single();

      if (staffError || !staffData) {
        setError("Account not authorized as staff");
        // Sign them out
        await supabase.auth.signOut();
        return;
      }

      if (!staffData.is_active) {
        setError("Staff account is disabled");
        await supabase.auth.signOut();
        return;
      }

      // Success - role will be checked at navigation level
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg justify-center items-center px-6">
      <View className="w-full max-w-xs">
        <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
          Slide Scanner
        </Text>
        <Text className="text-sm text-text-secondary text-center mb-8">
          Staff Login
        </Text>

        {error && (
          <View className="bg-red-100 rounded-lg p-3 mb-4">
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        )}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#7D737B"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-surface border border-border-hair rounded-lg p-3 mb-4 text-text-primary"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#7D737B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          className="bg-surface border border-border-hair rounded-lg p-3 mb-6 text-text-primary"
        />

        <Pressable
          onPress={handleSignIn}
          disabled={isLoading}
          className="bg-text-primary rounded-lg p-4 flex-row items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Sign In</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
