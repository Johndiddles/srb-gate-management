import React, { useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl } from "react-native";
import { Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import ThemedButton from "../../src/components/ThemedButton";
import ThemedSearchbar from "../../src/components/ThemedSearchbar";
import Text from "../../src/components/ThemedText";
import StaffParkingModal from "../../src/components/StaffParkingModal";
import { StaffParkingMovement } from "../../src/types";
import { useGateStore } from "../../src/store/useGateStore";
import { Colors } from "../../constants/theme";
import { isTabletByDimensions } from "@/src/utils/dimensions";

const isTablet = isTabletByDimensions();

export default function StaffParkingFeed() {
  const {
    staffParkingMovements,
    logStaffVehicleOut,
    syncPendingLogs,
    initialSyncMovements,
  } = useGateStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await syncPendingLogs();
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [syncPendingLogs]);

  useFocusEffect(
    React.useCallback(() => {
      // Attempt background sync on focus
      initialSyncMovements().catch(() => {});
    }, [initialSyncMovements]),
  );

  const filteredMovements = staffParkingMovements
    .filter((v) => {
      const query = searchQuery.toLowerCase();
      return (
        v.staffName.toLowerCase().includes(query) ||
        v.department.toLowerCase().includes(query) ||
        (v.plateNumber && v.plateNumber.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // Sort by most recent activity
      return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime();
    });

  const handleLogOut = (item: StaffParkingMovement) => {
    logStaffVehicleOut({
      staffId: item.staffId,
      staffName: item.staffName,
      department: item.department,
      plateNumber: item.plateNumber,
    });
  };

  const renderItem = ({ item }: { item: StaffParkingMovement }) => {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.logHeader}>
            <Text
              variant={isTablet ? "titleLarge" : "titleMedium"}
              style={{ fontWeight: "bold" }}
            >
              {item.staffName}
            </Text>
            <Text
              variant={isTablet ? "bodyLarge" : "bodyMedium"}
              style={{ color: Colors.light.text, fontWeight: "600" }}
            >
              {item.plateNumber || "NO PLATE"}
            </Text>
          </View>

          <View style={styles.logDetails}>
            <View>
              <View style={styles.timeRow}>
                <Text variant={isTablet ? "bodyLarge" : "bodyMedium"}>
                  Department: {item.department}
                </Text>
              </View>

              <View style={[styles.timeRow, { marginTop: 4 }]}>
                <Text
                  variant={isTablet ? "bodyLarge" : "bodyMedium"}
                  style={{ fontWeight: "500" }}
                >
                  {item.timeOut ? "⚫ OUT" : "🟢 Inside"}
                </Text>
              </View>
            </View>

            <View style={[styles.timeRow, { marginTop: 4 }]}>
              <Text variant={isTablet ? "bodyLarge" : "bodyMedium"}>
                In: {new Date(item.timeIn).toLocaleString()}
              </Text>
              {item.timeOut && (
                <Text variant={isTablet ? "bodyLarge" : "bodyMedium"}>
                  Out: {new Date(item.timeOut).toLocaleString()}
                </Text>
              )}

              {!item.timeOut && (
                <View
                  style={[
                    styles.timeRow,
                    {
                      marginTop: 12,
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    },
                  ]}
                >
                  <ThemedButton
                    mode="outlined"
                    onPress={() => handleLogOut(item)}
                  >
                    Log Exit
                  </ThemedButton>
                </View>
              )}
            </View>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: Colors.light.text }}>
          Staff Parking
        </Text>
        <ThemedButton mode="contained" onPress={() => setModalVisible(true)}>
          Scan
        </ThemedButton>
      </View>

      <View style={styles.searchContainer}>
        <ThemedSearchbar
          placeholder="Search Name, Dept or Plate..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredMovements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: Colors.light.icon }}>
            No staff parking recorded.
          </Text>
        }
      />

      <StaffParkingModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    padding: 16,
    backgroundColor: Colors.light.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#f0f0f0",
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  cardContent: {
    padding: 16,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  logDetails: {
    gap: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeRow: {},
});
