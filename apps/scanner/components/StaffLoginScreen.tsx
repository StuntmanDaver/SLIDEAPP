import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { supabase } from "../lib/supabase";
import * as SecureStore from "expo-secure-store";

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
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
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
