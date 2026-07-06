import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Surface, SegmentedButtons } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { IconSymbol } from "../../components/ui/icon-symbol";

import ThemedButton from "../../src/components/ThemedButton";
import ThemedSearchbar from "../../src/components/ThemedSearchbar";
import Text from "../../src/components/ThemedText";
import KeysModal from "../../src/components/KeysModal";
import { KeyCollection } from "../../src/types";
import { useGateStore } from "../../src/store/useGateStore";
import { Colors } from "../../constants/theme";
import { isTabletByDimensions } from "@/src/utils/dimensions";

const isTablet = isTabletByDimensions();

export default function KeysFeed() {
  const { keyCollections, syncPendingLogs, initialSyncMovements } =
    useGateStore();

  const [feedMode, setFeedMode] = useState<"active" | "history">("active");
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
      initialSyncMovements().catch(() => {});
    }, [initialSyncMovements]),
  );

  // Active key collections (currently signed out/collected)
  const activeKeys = keyCollections.filter((k) => k.status === "collected");

  // Filter list based on selected tab (active vs history)
  const filteredKeys = keyCollections
    .filter((k) => {
      if (feedMode === "active" && k.status !== "collected") {
        return false;
      }
      const query = searchQuery.toLowerCase().trim();
      return (
        k.keyTag.toLowerCase().includes(query) ||
        k.collectingStaffId.toLowerCase().includes(query) ||
        (k.collectingStaffName &&
          k.collectingStaffName.toLowerCase().includes(query)) ||
        (k.collectingStaffDepartment &&
          k.collectingStaffDepartment.toLowerCase().includes(query)) ||
        (k.returningStaffId &&
          k.returningStaffId.toLowerCase().includes(query)) ||
        (k.returningStaffName &&
          k.returningStaffName.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // Sort by most recent collected time
      return (
        new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      );
    });

  const handleStartGeneric = () => {
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: KeyCollection }) => {
    const isActive = item.status === "collected";

    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.logHeader}>
            <View style={{ flex: 1 }}>
              <Text
                variant={isTablet ? "titleLarge" : "titleMedium"}
                style={{ fontWeight: "bold", color: "#1e293b" }}
              >
                Key Tag: {item.keyTag}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: "#64748b", fontWeight: "600", marginTop: 2 }}
              >
                Collector ID: {item.collectingStaffId}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isActive
                    ? "#eff6ff"
                    : item.status === "returned"
                      ? "#e8f5e9"
                      : "#faf5ff",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isActive
                      ? "#1d4ed8"
                      : item.status === "returned"
                        ? "#2e7d32"
                        : "#6b21a8",
                  },
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.logDetails}>
            <View style={{ flex: 1 }}>
              {item.collectingStaffName && (
                <Text
                  variant={isTablet ? "bodyLarge" : "bodyMedium"}
                  style={{ color: "#475569" }}
                >
                  Staff: {item.collectingStaffName} (
                  {item.collectingStaffDepartment || "Regular"})
                </Text>
              )}
              <Text
                variant="bodySmall"
                style={{ color: "#64748b", marginTop: 4 }}
              >
                Collected: {new Date(item.collectedAt).toLocaleString()}
              </Text>
              {!isActive && item.returnedAt && (
                <>
                  {item.returningStaffId && (
                    <Text
                      variant="bodyMedium"
                      style={{ color: "#475569", marginTop: 4 }}
                    >
                      Returned By:{" "}
                      {item.returningStaffName || item.returningStaffId}
                    </Text>
                  )}
                  <Text
                    variant="bodySmall"
                    style={{
                      color: "#059669",
                      marginTop: 2,
                      fontWeight: "500",
                    }}
                  >
                    Returned: {new Date(item.returnedAt).toLocaleString()}
                  </Text>
                </>
              )}
              {!isActive && item.status === "resolved" && (
                <Text
                  variant="bodySmall"
                  style={{ color: "#7c3aed", marginTop: 2, fontWeight: "bold" }}
                >
                  Resolved by Admin (New Key Issued)
                </Text>
              )}
            </View>

            <View style={styles.syncContainer}>
              {item.syncStatus === "pending" ? (
                <Text
                  variant="bodySmall"
                  style={{ color: "#ff9800", fontStyle: "italic" }}
                >
                  ⏳ Sync Pending
                </Text>
              ) : (
                <Text variant="bodySmall" style={{ color: "#4caf50" }}>
                  ✓ Synced
                </Text>
              )}
            </View>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4, marginRight: 8 }}
          >
            <IconSymbol
              name="chevron.left"
              size={32}
              color={Colors.light.text}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: Colors.light.text,
            }}
          >
            Keys Tracking
          </Text>
        </View>
        <ThemedButton
          mode="contained"
          buttonColor="#059669"
          onPress={handleStartGeneric}
        >
          Collect / Return
        </ThemedButton>
      </View>

      {/* Stats Counter Widget */}
      <View style={styles.statsContainer}>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleMedium" style={styles.statLabel}>
            Active Checked Out
          </Text>
          <Text
            variant="headlineMedium"
            style={[styles.statValue, { color: Colors.light.tint }]}
          >
            {activeKeys.length}
          </Text>
        </Surface>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleMedium" style={styles.statLabel}>
            Total History Logs
          </Text>
          <Text
            variant="headlineMedium"
            style={[styles.statValue, { color: "#059669" }]}
          >
            {keyCollections.length}
          </Text>
        </Surface>
      </View>

      {/* Tab toggle at top of list */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <SegmentedButtons
          value={feedMode}
          onValueChange={(val) => setFeedMode(val as any)}
          buttons={[
            {
              value: "active",
              label: "Active Out",
              icon: "key",
            },
            {
              value: "history",
              label: "All Logs History",
              icon: "history",
            },
          ]}
        />
      </View>

      {/* Searchbar */}
      <View style={styles.searchContainer}>
        <ThemedSearchbar
          placeholder={
            feedMode === "active"
              ? "Search Active Staff, ID or Key Tag..."
              : "Search Logs History..."
          }
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredKeys}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              marginTop: 32,
              color: Colors.light.icon,
            }}
          >
            {searchQuery.trim().length > 0
              ? "No matching logs found."
              : feedMode === "active"
                ? "No keys are currently checked out."
                : "No history logs recorded."}
          </Text>
        }
      />

      {/* Key Collect/Return Scanner Modal */}
      <KeysModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.light.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "white",
    alignItems: "center",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontWeight: "bold",
    marginTop: 4,
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
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardContent: {
    padding: 16,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  logDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  syncContainer: {
    alignItems: "flex-end",
  },
});
