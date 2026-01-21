import React from "react";
import { View, Platform, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export interface GlassCardProps {
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
  /** Add a subtle specular highlight at the top */
  specular?: boolean;
  /** Floating style - adds shadow and doesn't touch edges */
  floating?: boolean;
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
  ultraThin: 0.12,
  thin: 0.18,
  regular: 0.25,
  thick: 0.35,
  clear: 0.06,
};

export function GlassCard({
  intensity = "regular",
  tint = "light",
  children,
  className = "",
  style,
  specular = true,
  floating = false,
}: GlassCardProps) {
  const blurIntensity = INTENSITY_MAP[intensity];
  const overlayOpacity = OVERLAY_OPACITY[intensity];

  // On Android, BlurView has limited support, so we use a fallback
  if (Platform.OS === "android") {
    return (
      <View
        className={`rounded-2xl ${className}`}
        style={[
          styles.androidCard,
          floating && styles.floating,
          { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity + 0.4})` },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardWrapper,
        floating && styles.floating,
        style
      ]}
      className={className}
    >
      {/* Blur layer */}
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />

      {/* Translucent overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }
        ]}
      />

      {/* Specular highlight - subtle gradient at top edge */}
      {specular && (
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.35)",
            "rgba(255, 255, 255, 0.08)",
            "rgba(255, 255, 255, 0)",
          ]}
          locations={[0, 0.3, 1]}
          style={styles.specularHighlight}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  specularHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  androidCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
