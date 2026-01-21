import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View } from "react-native";

function TabIcon({ name, color, focused, size = 20 }: { name: any, color: string, focused: boolean, size?: number }) {
  return (
    <View style={{
      backgroundColor: focused ? "#090908" : "transparent",
      borderRadius: 20, // Pill shape
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8 // Adjust alignment
    }}>
      <FontAwesome name={name} size={size} color={focused ? "#FFFFFF" : color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#E4E3DF",
          borderTopWidth: 0,
          borderRadius: 28,
          marginHorizontal: 24,
          marginBottom: 24,
          position: "absolute",
          height: 70, // Increased height for floating look
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
          elevation: 5,
          paddingBottom: 0, // Remove default padding
        },
        tabBarActiveTintColor: "#090908",
        tabBarInactiveTintColor: "#7D737B",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="passes"
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="ticket" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="qrcode" color={color} focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
