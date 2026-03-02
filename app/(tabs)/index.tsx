import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MovementLogModal from "../../src/components/MovementLogModal";
import { pickAndParseFile } from "../../src/services/FileImporter";
import { useGateStore } from "../../src/store/useGateStore";
import { Guest } from "../../src/types";

export default function Dashboard() {
  const {
    guests,
    logs,
    searchQuery,
    setSearchQuery,
    importGuests,
    fetchGuests,
    updateGuestStatus,
    completeMovement,
  } = useGateStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'arrival' | 'in-house'
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredGuests = guests.filter((g) => {
    let matchesTab = true;
    if (activeTab === "arrival") matchesTab = g.status === "arrival";
    if (activeTab === "in-house") matchesTab = g.status === "in-house";
    // 'all' includes both 'arrival' and 'in-house' (and technically 'checked-out' but user asked for "All" to include guests from in-house and arrivals)
    if (activeTab === "all")
      matchesTab =
        g.status === "arrival" ||
        g.status === "in-house" ||
        g.status === "checked-out";

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      g.firstName.toLowerCase().includes(searchLower) ||
      g.lastName.toLowerCase().includes(searchLower) ||
      g.roomNumber.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const handleImportFile = async () => {
    try {
      const newGuests = await pickAndParseFile();
      if (newGuests.length > 0) {
        importGuests(newGuests);
        alert("Import Successful");
      }
    } catch (e) {
      console.error("Import failed", e);
      alert("Import Failed");
    }
  };

  const handleSyncApi = async () => {
    setIsImporting(true);
    try {
      await fetchGuests();
      alert("Sync Successful");
    } catch (e) {
      console.error("Sync failed", e);
      alert("Sync Failed");
    } finally {
      setIsImporting(false);
    }
  };

  const openLogModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setModalVisible(true);
  };

  const handleReturn = (guestId: string) => {
    const activeLog = logs.find((l) => l.guestId === guestId && !l.timeIn);
    if (activeLog) {
      completeMovement(activeLog.id);
    }
  };

  const renderItem = ({ item }: { item: Guest }) => {
    const activeLog = logs.find((l) => l.guestId === item.id && !l.timeIn);
    const isOut = !!activeLog;

    return (
      <Surface style={styles.card} elevation={1}>
        <TouchableRipple
          onPress={() => router.push(`/guest/${item.id}`)}
          style={{ flex: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.guestInfo}>
              <Text variant="headlineSmall" style={styles.roomNumber}>
                {item.roomNumber}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.lastName}, {item.firstName}
                </Text>
                <Text variant="bodySmall" style={{ color: "gray" }}>
                  {item.status === "arrival"
                    ? "Arrival"
                    : isOut
                      ? `🔴 OUT - ${activeLog?.destination} (${activeLog?.mode})`
                      : item.status === "checked-out"
                        ? "Checked Out"
                        : `🟢 In-House`}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              {item.status === "arrival" && (
                <Button
                  mode="contained"
                  onPress={(e) => {
                    e.stopPropagation();
                    updateGuestStatus(item.id, "in-house");
                  }}
                  compact
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 0,
                  }}
                >
                  Check-In
                </Button>
              )}
              {item.status === "in-house" && (
                <View style={styles.actionButtons}>
                  {isOut ? (
                    <Button
                      mode="contained"
                      buttonColor="#4caf50"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleReturn(item.id);
                      }}
                      compact
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 0,
                      }}
                    >
                      Return
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={(e) => {
                        e.stopPropagation();
                        openLogModal(item);
                      }}
                      compact
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 0,
                      }}
                    >
                      Log Exit
                    </Button>
                  )}
                  <Button
                    mode="contained-tonal"
                    compact
                    onPress={(e) => {
                      e.stopPropagation();
                      updateGuestStatus(item.id, "checked-out");
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 0,
                    }}
                  >
                    Out
                  </Button>
                </View>
              )}
              {item.status === "checked-out" && (
                <Text variant="bodySmall" style={{ fontStyle: "italic" }}>
                  Departed
                </Text>
              )}
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32, fontWeight: "bold" }}>Gate Guard</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            icon="cloud-download"
            mode="contained-tonal"
            onPress={handleSyncApi}
            loading={isImporting}
            compact
          >
            Sync
          </Button>
          <Button
            icon="file-import"
            mode="contained-tonal"
            onPress={handleImportFile}
            compact
          >
            Import
          </Button>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search Name or Room..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: "all", label: "All" },
          { value: "arrival", label: "Arrivals" },
          { value: "in-house", label: "In-House" },
        ]}
        style={styles.tabs}
        density="small" // Better for mobile
      />

      <FlatList
        data={filteredGuests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <MovementLogModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        guest={selectedGuest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    marginBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "white",
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#eee",
  },
  tabs: {
    margin: 16,
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
    padding: 12, // Reduced padding for mobile
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap", // Allow wrapping on very small screens
  },
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Reduced gap
    flex: 1,
    minWidth: 150, // Ensure minimum width before wrapping
  },
  roomNumber: {
    fontWeight: "bold",
    minWidth: 50,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4, // Space if wrapped
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
});
