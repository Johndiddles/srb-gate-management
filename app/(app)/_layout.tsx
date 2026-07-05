import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useGateStore } from "../../src/store/useGateStore";
import ThemedText from "../../src/components/ThemedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppLayout() {
  const { deviceName, location } = useGateStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="guests" />
        <Stack.Screen name="activities" />
        <Stack.Screen name="vehicles" />
        <Stack.Screen name="staff-parking" />
        <Stack.Screen name="staff-movement" />
        <Stack.Screen name="phone-booth" />
      </Stack>
      {deviceName && location && (
        <View
          style={{
            position: "absolute",
            top: Math.max(insets.top, 8) + 8,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            pointerEvents: "none",
          }}
        >
          <ThemedText style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {deviceName} • {location}
          </ThemedText>
        </View>
      )}
    </View>
  );
}
