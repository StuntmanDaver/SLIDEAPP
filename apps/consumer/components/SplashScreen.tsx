import { View, Text, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // After 5 seconds, fade out and call onFinish
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 4500); // 4.5s + 0.5s fade out = 5s total

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#090908", "#1a1a19", "#090908"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>SLIDE</Text>
          <View style={styles.logoUnderline} />
        </View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.tagline}>Go out once</Text>
          <Text style={styles.tagline}>Get in everywhere</Text>
          <Text style={[styles.tagline, styles.taglineAccent]}>One Pass more places</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottomBranding, { opacity: fadeAnim }]}>
        <Text style={styles.brandingText}>slidenightlife.com</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090908",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 72,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 12,
  },
  logoUnderline: {
    width: 120,
    height: 4,
    backgroundColor: "#E8E4F0", // lavender-primary
    marginTop: 8,
    borderRadius: 2,
  },
  taglineContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginVertical: 4,
  },
  taglineAccent: {
    color: "#E8E4F0",
    fontWeight: "600",
    marginTop: 8,
  },
  bottomBranding: {
    position: "absolute",
    bottom: 60,
  },
  brandingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 2,
  },
});
