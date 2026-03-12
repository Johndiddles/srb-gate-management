import { useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Divider, Surface } from "react-native-paper";
import Text from "../../src/components/ThemedText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGateStore } from "../../src/store/useGateStore";
import { ActivityLog } from "../../src/types";

export default function GuestDetails() {
  const { id } = useLocalSearchParams();
  const { guests, logs } = useGateStore();

  const guest = guests.find((g) => g._id === id);
  const guestLogs = logs
    .filter((l) => l.guestId === id)
    .sort(
      (a, b) => new Date(b.timeOut).getTime() - new Date(a.timeOut).getTime(),
    );

  if (!guest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text variant="headlineMedium" style={{ padding: 16 }}>
          Guest not found
        </Text>
      </SafeAreaView>
    );
  }

  const renderLogItem = ({ item }: { item: ActivityLog }) => (
    <Surface style={styles.logCard} elevation={0}>
      <View style={{ flexDirection: "column" }}>
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

        {item.mode && (
          <Text variant="bodySmall" style={{ color: "#666" }} numberOfLines={1}>
            {item.mode.toUpperCase()}
          </Text>
        )}
      </View>
      <Text variant="bodySmall" numberOfLines={1}>
        To: {item.destination} {item.plateNumber ? `(${item.plateNumber})` : ""}
      </Text>
      <Divider style={{ marginTop: 8 }} />
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">
          {guest.firstName} {guest.lastName}
        </Text>
        <Text variant="titleMedium" style={{ color: "gray" }}>
          Room {guest.roomNumber}
        </Text>
        <View style={styles.statusBadge}>
          <Text variant="labelLarge" style={{ color: "white" }}>
            {guest.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Surface style={styles.infoSection} elevation={1}>
        <Text variant="titleSmall">Arrival: {guest.arrivalDate}</Text>
        {guest.notes ? (
          <Text variant="bodyMedium" style={{ marginTop: 4 }}>
            Notes: {guest.notes}
          </Text>
        ) : null}
      </Surface>

      <View style={styles.logSection}>
        <Text variant="titleLarge" style={{ marginBottom: 12 }}>
          Activity History
        </Text>
        <FlatList
          data={guestLogs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={{ fontStyle: "italic", color: "gray" }}>
              No activity recorded.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 24,
    backgroundColor: "white",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "white",
  },
  logSection: {
    flex: 1,
    padding: 16,
  },
  logCard: {
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
});
