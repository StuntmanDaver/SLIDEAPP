import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import * as SecureStore from "expo-secure-store";
import { FontAwesome } from "@expo/vector-icons";
import { GlassCard } from "./glass";
import { LinearGradient } from "expo-linear-gradient";

export function StaffLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    Keyboard.dismiss();

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

      // Save login time
      await SecureStore.setItemAsync("staff_login_time", Date.now().toString());

      // Success - role will be checked at navigation level
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center px-6">
            {/* Logo Section */}
            <View className="items-center mb-10">
              <GlassCard intensity="thin" floating>
                <View className="w-20 h-20 items-center justify-center">
                  <FontAwesome name="qrcode" size={40} color="#090908" />
                </View>
              </GlassCard>
              <Text className="text-3xl font-bold text-text-primary mt-6 text-center">
                Slide Scanner
              </Text>
              <Text className="text-sm text-text-secondary text-center mt-1">
                Staff Portal
              </Text>
            </View>

            {/* Login Form Card */}
            <GlassCard intensity="ultraThin" floating className="w-full max-w-sm">
              <View className="p-6">
                {error && (
                  <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center">
                      <FontAwesome name="exclamation-circle" size={16} color="#ef4444" />
                      <Text className="text-red-600 text-sm ml-2 flex-1">{error}</Text>
                    </View>
                  </View>
                )}

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-xs text-text-secondary uppercase tracking-wider mb-2 ml-1">
                    Email
                  </Text>
                  <View style={styles.inputContainer}>
                    <FontAwesome name="envelope" size={16} color="#7D737B" style={styles.inputIcon} />
                    <TextInput
                      placeholder="staff@venue.com"
                      placeholderTextColor="#7D737B"
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-6">
                  <Text className="text-xs text-text-secondary uppercase tracking-wider mb-2 ml-1">
                    Password
                  </Text>
                  <View style={styles.inputContainer}>
                    <FontAwesome name="lock" size={16} color="#7D737B" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter password"
                      placeholderTextColor="#7D737B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!isLoading}
                      onSubmitEditing={handleSignIn}
                      returnKeyType="go"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Sign In Button */}
                <Pressable
                  onPress={handleSignIn}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.signInButton,
                    pressed && styles.signInButtonPressed,
                    isLoading && styles.signInButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                      <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </GlassCard>

            {/* Footer */}
            <View className="mt-8 items-center">
              <Text className="text-text-secondary text-xs">
                Staff access only
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    padding: 14,
    paddingLeft: 10,
    fontSize: 16,
    color: "#090908",
  },
  signInButton: {
    backgroundColor: "#090908",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#090908",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signInButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
