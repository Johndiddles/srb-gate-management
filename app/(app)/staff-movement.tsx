import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { Surface } from "react-native-paper";
import { useState } from "react";
import Text from "../../src/components/ThemedText";
import { useGateStore } from "../../src/store/useGateStore";
import StaffShiftModal from "../../src/components/StaffShiftModal";
import StaffShiftDetailsModal from "../../src/components/StaffShiftDetailsModal";
import { Colors } from "../../constants/theme";
import { isTabletByDimensions } from "@/src/utils/dimensions";
import ThemedButton from "@/src/components/ThemedButton";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedSearchbar from "@/src/components/ThemedSearchbar";
import { router } from "expo-router";
import { IconSymbol } from "../../components/ui/icon-symbol";

export default function StaffMovementTab() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { staffShifts, syncPendingLogs, searchQuery, setSearchQuery } =
    useGateStore();
  // const isTablet = isTabletByDimensions();

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncPendingLogs();
    setRefreshing(false);
  };

  const filteredShifts = staffShifts.filter(
    (s) =>
      s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <IconSymbol name="chevron.left" size={32} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: Colors.light.text }}>
            Staff Shifts
          </Text>
        </View>
        <ThemedButton mode="contained" onPress={() => setModalVisible(true)}>
          Scan
        </ThemedButton>
      </View>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <ThemedSearchbar
            placeholder="Search Name, Dept or Plate..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>
        <FlatList
          data={filteredShifts}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          keyExtractor={(item) => item.app_log_id}
          renderItem={({ item }) => {
            const isOut = item.exits.some((e) => !e.timeIn);
            const activeStatus =
              item.status === "completed"
                ? "Shift Ended"
                : isOut
                  ? "On Break / Errand"
                  : "On Duty";

            const statusColor =
              item.status === "completed"
                ? Colors.light.icon
                : isOut
                  ? Colors.light.error
                  : Colors.light.tint;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedShift(item);
                  setDetailsVisible(true);
                }}
              >
                <Surface style={styles.card} elevation={1}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={styles.title}>
                        {item.staffName}
                      </Text>
                      <Text variant={isTabletByDimensions() ? "bodyMedium" : "bodySmall"} style={styles.subtitle}>
                        {item.staffId} • {item.department}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + "15" },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {activeStatus}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.logGrid}>
                    <View style={styles.logColumn}>
                      <Text variant={isTabletByDimensions() ? "bodyMedium" : "bodySmall"} style={styles.label}>
                        Clock In
                      </Text>
                      <Text variant="bodyMedium" style={styles.timeValue}>
                        {new Date(item.clockIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.logColumn}>
                      <Text variant={isTabletByDimensions() ? "bodyMedium" : "bodySmall"} style={styles.label}>
                        Clock Out
                      </Text>
                      <Text variant="bodyMedium" style={styles.timeValue}>
                        {item.clockOut
                          ? new Date(item.clockOut).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "---"}
                      </Text>
                    </View>

                    {item.exits.length > 0 && (
                      <View style={styles.logColumn}>
                        <Text variant={isTabletByDimensions() ? "bodyMedium" : "bodySmall"} style={styles.label}>
                          Breaks Taken
                        </Text>
                        <Text variant="bodyMedium" style={styles.timeValue}>
                          {item.exits.length} trip(s)
                        </Text>
                      </View>
                    )}
                  </View>
                </Surface>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Active Staff Shifts</Text>
            </View>
          }
        />

        {/* <FAB
          icon="account-clock"
          style={[styles.fab, isTablet && styles.fabTablet]}
          onPress={() => setModalVisible(true)}
          color="white"
        /> */}

        <StaffShiftModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
        />
        
        <StaffShiftDetailsModal
          visible={detailsVisible}
          onDismiss={() => {
            setDetailsVisible(false);
            setSelectedShift(null);
          }}
          shift={selectedShift}
        />
      </View>
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
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    color: Colors.light.text,
  },
  subtitle: {
    color: Colors.light.icon,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  logGrid: {
    flexDirection: "row",
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  logColumn: {
    flex: 1,
  },
  label: {
    color: Colors.light.icon,
    fontSize: 11,
    textTransform: "uppercase",
  },
  timeValue: {
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.light.icon,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.tint,
  },
  fabTablet: {
    margin: 32,
  },
});
