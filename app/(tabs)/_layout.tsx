import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";
import { useGateStore } from "../../src/store/useGateStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { permissions } = useGateStore();

  const canAccessGuests =
    permissions.includes("view_guest_list") || permissions.length === 0; // default visible if none specified maybe? Or strict. Let's say strict requires "GUEST".
  const canAccessVehicles =
    permissions.includes("log_vehicular_movement") || permissions.length === 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          href: canAccessGuests ? "/" : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Activity Log",
          href: canAccessGuests || canAccessVehicles ? "/activities" : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="local-activity" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
          href: canAccessVehicles ? "/vehicles" : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="car.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
