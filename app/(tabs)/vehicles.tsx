import React, { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Searchbar, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import VehicleMovementModal from "../../src/components/VehicleMovementModal";
import { useGateStore } from "../../src/store/useGateStore";
import { VehicularMovement } from "../../src/types";

export default function VehiclesFeed() {
  const { vehicularMovements, logVehicleOut } = useGateStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const filteredMovements = vehicularMovements
    .filter((v) => {
      const query = searchQuery.toLowerCase();
      return (
        v.plateNumber.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Sort by most recent activity
      const timeA = a.timeOut || a.timeIn || a.date;
      const timeB = b.timeOut || b.timeIn || b.date;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

  const handleLogOut = (id: string) => {
    logVehicleOut(id);
  };

  const renderItem = ({ item }: { item: VehicularMovement }) => {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.logHeader}>
            <Text variant="titleMedium">{item.plateNumber}</Text>
            <Text variant="labelSmall" style={{ color: "gray" }}>
              {item.name}
            </Text>
          </View>

          <View style={styles.logDetails}>
            <View style={styles.timeRow}>
              <Text variant="bodyMedium">Reason: {item.reason}</Text>
            </View>

            {item.timeIn && (
              <View style={[styles.timeRow, { marginTop: 4 }]}>
                <Text variant="bodyMedium">
                  🟢 In: {new Date(item.timeIn).toLocaleString()}
                </Text>
              </View>
            )}

            {item.timeOut ? (
              <View style={[styles.timeRow, { marginTop: 4 }]}>
                <Text variant="bodyMedium">
                  🔴 Out: {new Date(item.timeOut).toLocaleString()}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.timeRow,
                  {
                    marginTop: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                ]}
              >
                <Text variant="labelSmall" style={{ color: "orange" }}>
                  Currently Inside
                </Text>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => handleLogOut(item.id)}
                >
                  Log Exit
                </Button>
              </View>
            )}
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32, fontWeight: "bold" }}>Vehicles Feed</Text>
        <Button mode="contained" onPress={() => setModalVisible(true)}>
          Log Entry
        </Button>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search License Plate or Name..."
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
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            No vehicles recorded.
          </Text>
        }
      />

      <VehicleMovementModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
