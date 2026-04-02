import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Removed next/navigation
// Let's use `expo-router`'s router instead!
import { router } from "expo-router"; 
import Text from "../../src/components/ThemedText";
// Header removed
import { Colors } from "../../constants/theme";
import { useGateStore } from "../../src/store/useGateStore";
import { IconSymbol } from "../../components/ui/icon-symbol";

export default function DashboardHub() {
  const { permissions, deactivateProvider, isActivated } = useGateStore();

  useEffect(() => {
    if (!isActivated) {
      router.replace("/activation" as any);
    }
  }, [isActivated]);

  const canAccessGuests =
    permissions.includes("view_guest_list") || permissions.length === 0;
  const canAccessActivities =
    permissions.includes("log_guest_movement") || permissions.length === 0;
  const canAccessVehicles =
    permissions.includes("log_vehicular_movement") || permissions.length === 0;
  const canAccessStaffParking =
    permissions.includes("log_staff_parking") || permissions.length === 0;
  const canAccessStaffMovement =
    permissions.includes("log_staff_movement") || permissions.length === 0;

  const handleDeactivate = () => {
    // Actually handle device deactivation
    deactivateProvider();
    router.replace("/activation" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Gate Guard Modules
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Select a module below to begin tracking logs.
          </Text>
        </View>

        <View style={styles.grid}>
          {canAccessGuests && (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/guests" as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.tint + "20" }]}>
                <IconSymbol size={32} name="house.fill" color={Colors.light.tint} />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>Guest List</Text>
            </TouchableOpacity>
          )}

          {canAccessActivities && (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/activities" as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#FF980020" }]}>
                <IconSymbol size={32} name="local-activity" color="#FF9800" />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>Activity Feed</Text>
            </TouchableOpacity>
          )}

          {canAccessVehicles && (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/vehicles" as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#4CAF5020" }]}>
                <IconSymbol size={32} name="car.fill" color="#4CAF50" />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>Vehicles</Text>
            </TouchableOpacity>
          )}

          {canAccessStaffParking && (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/staff-parking" as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#9C27B020" }]}>
                <IconSymbol size={32} name="person.badge.key.fill" color="#9C27B0" />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>Staff Parking</Text>
            </TouchableOpacity>
          )}

          {canAccessStaffMovement && (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/staff-movement" as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#E91E6320" }]}>
                <IconSymbol size={32} name="timer" color="#E91E63" />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>Staff Shifts</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
          <Text style={styles.deactivateText}>Deactivate Device</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.icon,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  deactivateBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 12,
    alignItems: "center",
  },
  deactivateText: {
    color: "#f44336",
    fontWeight: "600",
    fontSize: 16,
  },
});
