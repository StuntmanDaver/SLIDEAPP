import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SurgeEvent, UserClaim, formatTimeRemaining } from "../lib/surge-api";

interface SurgeBannerProps {
  surge: SurgeEvent;
  userClaim: UserClaim | null;
  onDismiss: () => void;
}

export function SurgeBanner({ surge, userClaim, onDismiss }: SurgeBannerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeRemaining, setTimeRemaining] = useState(
    formatTimeRemaining(surge.expires_at)
  );

  // Slide in animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  // Pulse animation for the fire icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // Update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(surge.expires_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [surge.expires_at]);

  const handlePress = () => {
    router.push("/surge");
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const spotsRemaining = surge.max_claims - surge.claims_count;
  const hasClaimedSpot = userClaim !== null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        paddingTop: insets.top,
      }}
      className="absolute top-0 left-0 right-0 z-50"
    >
      <Pressable
        onPress={handlePress}
        className="mx-3 mt-2 rounded-2xl overflow-hidden"
      >
        <View className="bg-orange-500 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text className="text-2xl mr-2">
                {hasClaimedSpot ? "\u2713" : "\uD83D\uDD25"}
              </Text>
            </Animated.View>

            <View className="flex-1">
              {hasClaimedSpot ? (
                <>
                  <Text className="text-white font-bold text-sm">
                    YOU'RE #{userClaim.position}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    Show at door for priority entry
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-bold text-sm">
                    PRIORITY ENTRY - {spotsRemaining} spots left
                  </Text>
                  <Text className="text-white/80 text-xs">
                    Tap to claim your spot - {timeRemaining}
                  </Text>
                </>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleDismiss}
            hitSlop={10}
            className="ml-2 p-1"
          >
            <FontAwesome name="times" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
