import React from "react";
import { View, Pressable, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface TabConfig {
  key: string;
  icon: string;
  iconSize?: number;
}

interface GlassTabBarProps {
  tabs: TabConfig[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

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

export function GlassTabBar({ tabs, activeIndex, onTabPress }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={styles.tabsRow}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabPress(index)}
          style={styles.tabButton}
        >
          <TabIcon
            name={tab.icon}
            color="#7D737B"
            focused={activeIndex === index}
            size={tab.iconSize || 20}
          />
        </Pressable>
      ))}
    </View>
  );

  // On Android, use fallback styling
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          styles.container,
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
        styles.container,
        { marginBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <BlurView intensity={80} tint="light" style={styles.blurView}>
        <View style={styles.overlay}>{content}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    height: 70,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  androidContainer: {
    backgroundColor: "rgba(228, 227, 223, 0.95)",
  },
  blurView: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(228, 227, 223, 0.85)",
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: "#090908",
  },
});
