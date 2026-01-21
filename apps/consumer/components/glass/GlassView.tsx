import React from "react";
import { View, Platform, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

export interface GlassViewProps {
  /**
   * Intensity of the glass effect
   * - ultraThin: Most transparent, subtle presence (blur: 8)
   * - thin: Light transparency (blur: 15)
   * - regular: Balanced translucency (blur: 25)
   * - thick: More visible but still translucent (blur: 40)
   * - clear: Minimal blur, maximum transparency (blur: 5)
   */
  intensity?: "ultraThin" | "thin" | "regular" | "thick" | "clear";
  tint?: "light" | "dark" | "default";
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

// Lower blur values for more transparency like liquid glass
const INTENSITY_MAP = {
  ultraThin: 8,
  thin: 15,
  regular: 25,
  thick: 40,
  clear: 5,
};

// Background opacity based on intensity
const OVERLAY_OPACITY = {
  ultraThin: 0.08,
  thin: 0.12,
  regular: 0.18,
  thick: 0.28,
  clear: 0.04,
};

export function GlassView({
  intensity = "regular",
  tint = "light",
  children,
  className = "",
  style,
}: GlassViewProps) {
  const blurIntensity = INTENSITY_MAP[intensity];
  const overlayOpacity = OVERLAY_OPACITY[intensity];

  // On Android, BlurView has limited support, so we use a fallback
  if (Platform.OS === "android") {
    return (
      <View
        className={className}
        style={[
          styles.androidFallback,
          { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity + 0.3})` },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} className={className}>
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }
        ]}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  androidFallback: {
    // Android uses semi-transparent background as fallback
  },
});
