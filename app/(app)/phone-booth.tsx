import React, { useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
import { Surface, SegmentedButtons } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { IconSymbol } from "../../components/ui/icon-symbol";

import ThemedButton from "../../src/components/ThemedButton";
import ThemedSearchbar from "../../src/components/ThemedSearchbar";
import Text from "../../src/components/ThemedText";
import PhoneBoothModal from "../../src/components/PhoneBoothModal";
import { PhoneBoothAssignment } from "../../src/types";
import { useGateStore } from "../../src/store/useGateStore";
import { Colors } from "../../constants/theme";
import { isTabletByDimensions } from "@/src/utils/dimensions";

const isTablet = isTabletByDimensions();

export default function PhoneBoothFeed() {
  const {
    phoneBoothAssignments,
    syncPendingLogs,
    initialSyncMovements,
  } = useGateStore();

  const [feedMode, setFeedMode] = useState<"active" | "history">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
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

  // Active assignments (currently inside booth)
  const activeAssignments = phoneBoothAssignments.filter(
    (a) => a.status === "assigned"
  );

  // Filter list based on selected tab (active vs history)
  const filteredAssignments = phoneBoothAssignments
    .filter((a) => {
      if (feedMode === "active" && a.status !== "assigned") {
        return false;
      }
      const query = searchQuery.toLowerCase().trim();
      return (
        a.staffId.toLowerCase().includes(query) ||
        (a.staffName && a.staffName.toLowerCase().includes(query)) ||
        (a.department && a.department.toLowerCase().includes(query)) ||
        a.slotNumber.toString().includes(query)
      );
    })
    .sort((a, b) => {
      if (feedMode === "active") {
        return a.slotNumber - b.slotNumber; // Sort logically by slot number
      } else {
        // Sort history by most recent deposit
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      }
    });

  const handleStartRetrieval = (item: PhoneBoothAssignment) => {
    setSelectedStaffId(item.staffId);
    setModalVisible(true);
  };

  const handleStartGeneric = () => {
    setSelectedStaffId("");
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: PhoneBoothAssignment }) => {
    const isActive = item.status === "assigned";
    
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.logHeader}>
            <View>
              <Text
                variant={isTablet ? "titleLarge" : "titleMedium"}
                style={{ fontWeight: "bold", color: "#1e293b" }}
              >
                {item.staffName || "Unknown Staff Member"}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: "#64748b", fontWeight: "600", marginTop: 2 }}
              >
                ID: {item.staffId}
              </Text>
            </View>
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeText}>SLOT {item.slotNumber}</Text>
            </View>
          </View>

          <View style={styles.logDetails}>
            <View style={{ flex: 1 }}>
              {item.department && (
                <Text variant={isTablet ? "bodyLarge" : "bodyMedium"} style={{ color: "#475569" }}>
                  Department: {item.department}
                </Text>
              )}
              <Text variant="bodySmall" style={{ color: "#64748b", marginTop: 4 }}>
                Deposited: {new Date(item.assignedAt).toLocaleString()}
              </Text>
              {!isActive && item.retrievedAt && (
                <Text variant="bodySmall" style={{ color: "#059669", marginTop: 2, fontWeight: "500" }}>
                  Retrieved: {new Date(item.retrievedAt).toLocaleString()}
                </Text>
              )}
            </View>

            {isActive ? (
              <View style={styles.retrieveBtnContainer}>
                <ThemedButton
                  mode="contained"
                  buttonColor="#059669"
                  labelStyle={{ color: "white", fontSize: 13 }}
                  onPress={() => handleStartRetrieval(item)}
                >
                  Retrieve
                </ThemedButton>
              </View>
            ) : (
              <View style={styles.badgeContainer}>
                <View style={[styles.statusBadge, { backgroundColor: "#e8f5e9" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#2e7d32" }]}>
                    RETRIEVED
                  </Text>
                </View>
                {item.syncStatus === "pending" ? (
                  <Text variant="bodySmall" style={{ color: "#ff9800", marginTop: 4, fontStyle: "italic", textAlign: "right" }}>
                    ⏳ Sync Pending
                  </Text>
                ) : (
                  <Text variant="bodySmall" style={{ color: "#4caf50", marginTop: 4, textAlign: "right" }}>
                    ✓ Synced
                  </Text>
                )}
              </View>
            )}
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
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <IconSymbol name="chevron.left" size={32} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: Colors.light.text }}>
            Phone Booth
          </Text>
        </View>
        <ThemedButton
          mode="contained"
          buttonColor="#750670ff"
          onPress={handleStartGeneric}
        >
          Deposit / Retrieve
        </ThemedButton>
      </View>

      {/* Stats Counter Widget */}
      <View style={styles.statsContainer}>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleMedium" style={styles.statLabel}>Occupied</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: Colors.light.error }]}>
            {activeAssignments.length}
          </Text>
        </Surface>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleMedium" style={styles.statLabel}>Available</Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: "#059669" }]}>
            {254 - activeAssignments.length}
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
              label: "Active Stored",
              icon: "phone-in-talk",
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
          placeholder={feedMode === "active" ? "Search Active Slot, ID or Name..." : "Search Logs History..."}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredAssignments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 32, color: Colors.light.icon }}>
            {searchQuery.trim().length > 0
              ? "No matching logs found."
              : feedMode === "active"
              ? "No phones are currently stored in the booth."
              : "No history logs recorded."}
          </Text>
        }
      />

      {/* Phone Deposit/Retrieval Modal */}
      <PhoneBoothModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        initialStaffId={selectedStaffId}
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
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  slotBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#475569",
  },
  logDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  retrieveBtnContainer: {
    justifyContent: "flex-end",
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
