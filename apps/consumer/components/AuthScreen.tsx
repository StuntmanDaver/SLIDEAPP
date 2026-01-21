import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, Alert, TextInput } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../lib/supabase";
import { GlassCard } from "./glass";

// Required for Google auth session
WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if Apple auth is available (iOS 13+)
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
    }
  }, []);

  // Check if Google OAuth is configured
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const isGoogleConfigured = Boolean(googleIosClientId || googleWebClientId);

  // Google OAuth configuration - use placeholder when not configured to avoid crash
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId || "placeholder.apps.googleusercontent.com",
    webClientId: googleWebClientId,
    redirectUri: makeRedirectUri({
      scheme: "slide",
    }),
  });

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleSignIn(id_token);
      } else {
        setError("No ID token received from Google");
        setIsLoading(false);
      }
    } else if (response?.type === "error") {
      setError(response.error?.message || "Google sign in failed");
      setIsLoading(false);
    } else if (response?.type === "dismiss") {
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithApple = async () => {
    if (!appleAuthAvailable) {
      Alert.alert(
        "Apple Sign In Unavailable",
        "Apple Sign In requires iOS 13+ and a development build. It is not available in Expo Go.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) {
          setError(error.message);
        }
      } else {
        setError("No identity token received from Apple");
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") {
        // User canceled the sign in - do nothing
      } else {
        setError(err instanceof Error ? err.message : "Apple sign in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        "Google Sign In Not Configured",
        "Google OAuth credentials are not set up. Please add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env.local file.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await promptAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Google sign in");
      setIsLoading(false);
    }
  };

  const handleSignInWithEmail = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg justify-center items-center px-6">
      <GlassCard intensity="regular" className="w-full max-w-xs">
        <View className="p-6">
          <Text className="text-4xl font-bold text-text-primary mb-2 text-center">
            Slide
          </Text>
          <Text className="text-base text-text-secondary text-center mb-8">
            Your line-skip pass to any night
          </Text>

          {error && (
            <View className="bg-red-100/80 rounded-lg p-3 mb-6">
              <Text className="text-red-800 text-sm">{error}</Text>
            </View>
          )}

          {Platform.OS === "ios" && appleAuthAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={{ width: "100%", height: 50, marginBottom: 12 }}
              onPress={handleSignInWithApple}
            />
          ) : (
            <Pressable
              onPress={handleSignInWithApple}
              disabled={isLoading}
              className="bg-text-primary rounded-lg p-4 mb-3 flex-row items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Sign in with Apple</Text>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={handleSignInWithGoogle}
            disabled={isLoading}
            className="bg-white/80 border border-glass-border rounded-lg p-4 flex-row items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#090908" />
            ) : (
              <Text className="text-text-primary font-semibold">Sign in with Google</Text>
            )}
          </Pressable>

          {!isGoogleConfigured && (
            <Text className="text-text-secondary text-xs text-center mt-4">
              Google Sign In requires OAuth credentials to be configured
            </Text>
          )}

          {/* Email/Password Sign In */}
          <View className="mt-4 pt-4 border-t border-glass-border">
            {showEmailForm ? (
              <>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="bg-white/60 border border-glass-border rounded-lg p-3 mb-2 text-text-primary"
                  placeholderTextColor="#999"
                />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="bg-white/60 border border-glass-border rounded-lg p-3 mb-3 text-text-primary"
                  placeholderTextColor="#999"
                />
                <Pressable
                  onPress={handleSignInWithEmail}
                  disabled={isLoading}
                  className="bg-text-primary rounded-lg p-3 items-center mb-2"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">Sign In</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setShowEmailForm(false)}>
                  <Text className="text-text-secondary text-center text-sm">Cancel</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setShowEmailForm(true)}>
                <Text className="text-text-secondary text-center text-sm">
                  Sign in with email
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </GlassCard>
    </View>
  );
}
