import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  return (
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
    </Stack>
  );
}
