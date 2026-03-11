import React, { useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl } from "react-native";
import { Searchbar, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGateStore } from "../../src/store/useGateStore";
import { ActivityLog } from "../../src/types";

import { useFocusEffect } from "expo-router";

export default function ActivityFeed() {
  const { logs, guests, syncPendingLogs, initialSyncMovements } =
    useGateStore();
  const [searchQuery, setSearchQuery] = useState("");
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
      // Background sync on focus
      initialSyncMovements().catch(() => {});
    }, [initialSyncMovements]),
  );

  console.log({ logs });

  const filteredLogs = logs
    .filter((log) => {
      // Find guest to check status
      const guest = guests.find((g) => g._id === log.guestId);
      // Ensure we show logs for guests who are currently in-house or checked-out (as per request)
      // "all activities for all in-house/checked-in guests... throughout the guest's stay"
      if (!guest) return false;

      const matchesSearch =
        log.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      return new Date(b.timeOut).getTime() - new Date(a.timeOut).getTime();
    });

  const renderItem = ({ item }: { item: ActivityLog }) => {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.logHeader}>
            <Text variant="titleMedium">{item.guestName}</Text>
            <Text variant="labelSmall" style={{ color: "gray" }}>
              Room {item.roomNumber}
            </Text>
          </View>

          <View style={styles.logDetails}>
            <View style={styles.timeRow}>
              <Text variant="bodyMedium">
                📤 Out: {new Date(item.timeOut).toLocaleString()}
              </Text>
              {item.timeIn ? (
                <Text variant="bodyMedium">
                  📥 RETURNED: {new Date(item.timeIn).toLocaleString()}
                </Text>
              ) : (
                <Text variant="bodyMedium" style={{ color: "orange" }}>
                  Currently Out
                </Text>
              )}
              <Text
                variant="bodyMedium"
                style={{ color: "#666", marginTop: 4 }}
              >
                To: {item.destination}{" "}
                {item.mode
                  ? `(${item.mode} ${item.plateNumber ? `- ${item.plateNumber}` : ""})`
                  : ""}
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32, fontWeight: "bold" }}>Activity Log</Text>
      </View>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search Activities..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            No activities recorded.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "white",
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#eee",
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "white",
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
  },
  timeRow: {},
});
