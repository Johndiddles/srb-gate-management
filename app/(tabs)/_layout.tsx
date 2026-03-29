import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { useGateStore } from "../../src/store/useGateStore";

export default function TabLayout() {
  const { permissions } = useGateStore();

  const canAccessGuests =
    permissions.includes("view_guest_list") || permissions.length === 0; // default visible if none specified maybe? Or strict. Let's say strict requires "GUEST".
  const canAccessActivities =
    permissions.includes("log_guest_movement") || permissions.length === 0;
  const canAccessVehicles =
    permissions.includes("log_vehicular_movement") || permissions.length === 0;
  const canAccessStaffParking =
    permissions.includes("log_vehicular_movement") || permissions.length === 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
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
          href: canAccessActivities ? "/activities" : null,
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
      
      <Tabs.Screen
        name="staff-parking"
        options={{
          title: "Staff",
          href: canAccessStaffParking ? ("/staff-parking" as any) : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.badge.key.fill" color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="staff-movement"
        options={{
          title: "Shifts",
          href: canAccessStaffParking ? ("/staff-movement" as any) : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="timer" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
