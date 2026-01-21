import React from "react";
import { View, Pressable, Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  name,
  color,
  focused,
  size = 20,
}: {
  name: any;
  color: string;
  focused: boolean;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerActive,
      ]}
    >
      <FontAwesome
        name={name}
        size={size}
        color={focused ? "#FFFFFF" : color}
      />
    </View>
  );
}

function LiquidGlassTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: "index", icon: "home", size: 20 },
    { key: "passes", icon: "ticket", size: 20 },
    { key: "qr", icon: "qrcode", size: 24 },
    { key: "account", icon: "user", size: 20 },
  ];

  const content = (
    <View style={styles.tabsRow}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
          >
            <TabIcon
              name={tab?.icon || "circle"}
              color="#7D737B"
              focused={isFocused}
              size={tab?.size || 20}
            />
          </Pressable>
        );
      })}
    </View>
  );

  // On Android, use fallback styling
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          styles.tabBarContainer,
          styles.androidContainer,
          { marginBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tabBarContainer,
        { marginBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      {/* Ultra-thin blur layer */}
      <BlurView intensity={12} tint="light" style={StyleSheet.absoluteFill} />

      {/* Translucent overlay - very subtle */}
      <View style={styles.translucentOverlay} />

      {/* Specular highlight at top edge */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.5)",
          "rgba(255, 255, 255, 0.15)",
          "rgba(255, 255, 255, 0)",
        ]}
        locations={[0, 0.4, 1]}
        style={styles.specularHighlight}
      />

      {/* Inner border glow */}
      <View style={styles.innerBorder} />

      {/* Content */}
      <View style={styles.contentWrapper}>
        {content}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="passes" />
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    // Liquid glass shadow - softer and more diffuse
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
    // Subtle border
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  androidContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  translucentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  specularHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  contentWrapper: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconContainer: {
    backgroundColor: "transparent",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: "#090908",
    shadowColor: "#090908",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
