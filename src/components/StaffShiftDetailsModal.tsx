import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Modal, Portal, Surface, Divider } from "react-native-paper";
import Text from "./ThemedText";
import { Colors } from "../../constants/theme";
import ThemedButton from "./ThemedButton";
import { StaffShift } from "../types";
import { isTabletByDimensions } from "../utils/dimensions";

export default function StaffShiftDetailsModal({
  visible,
  onDismiss,
  shift,
}: {
  visible: boolean;
  onDismiss: () => void;
  shift: StaffShift | null;
}) {
  if (!shift) return null;

  const isCurrentlyOut = shift.exits.some((e) => !e.timeIn);
  const shiftStatus =
    shift.status === "completed"
      ? "Shift Ended"
      : isCurrentlyOut
        ? "On Break / Errand"
        : "On Duty";

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text variant="titleLarge" style={styles.title}>
          Shift Timeline
        </Text>

        <ScrollView style={styles.scroll}>
          <Surface style={styles.headerCard} elevation={0}>
            <Text variant="titleMedium" style={styles.name}>
              {shift.staffName}
            </Text>
            <Text variant="bodySmall" style={styles.dept}>
              {shift.staffId} • {shift.department}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    shift.status === "completed"
                      ? Colors.light.icon + "15"
                      : isCurrentlyOut
                        ? Colors.light.error + "15"
                        : Colors.light.tint + "15",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      shift.status === "completed"
                        ? Colors.light.icon
                        : isCurrentlyOut
                          ? Colors.light.error
                          : Colors.light.tint,
                  },
                ]}
              >
                {shiftStatus}
              </Text>
            </View>
          </Surface>

          <View style={styles.timelineRow}>
            <View style={styles.timeBlock}>
              <Text variant="bodySmall" style={styles.label}>
                Clock In
              </Text>
              <Text variant="bodyMedium" style={styles.time}>
                {new Date(shift.clockIn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text variant="bodySmall" style={styles.label}>
                Clock Out
              </Text>
              <Text variant="bodyMedium" style={styles.time}>
                {shift.clockOut
                  ? new Date(shift.clockOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "---"}
              </Text>
            </View>
          </View>

          {shift.exits.length > 0 && (
            <View style={styles.exitsWrapper}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Authorized Breaks ({shift.exits.length})
              </Text>

              {shift.exits.map((exit, idx) => (
                <View key={exit.app_log_id || idx} style={styles.exitItem}>
                  <View style={styles.exitHeader}>
                    <Text
                      variant={
                        isTabletByDimensions() ? "bodyMedium" : "bodySmall"
                      }
                      style={styles.exitReason}
                    >
                      Reason: {exit.reason || "N/A"}
                    </Text>
                    {!exit.timeIn && (
                      <Text style={styles.currentlyOut}>CURRENTLY OUT</Text>
                    )}
                  </View>
                  <View style={styles.exitTimes}>
                    <Text
                      variant={
                        isTabletByDimensions() ? "bodyMedium" : "bodySmall"
                      }
                      style={styles.timeRow}
                    >
                      Out:{" "}
                      {new Date(exit.timeOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text
                      variant={
                        isTabletByDimensions() ? "bodyMedium" : "bodySmall"
                      }
                      style={styles.timeRow}
                    >
                      In:{" "}
                      {exit.timeIn
                        ? new Date(exit.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "---"}
                    </Text>
                  </View>
                  {idx < shift.exits.length - 1 && (
                    <Divider style={{ marginTop: 8 }} />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <ThemedButton onPress={onDismiss} style={styles.closeBtn}>
          Close
        </ThemedButton>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
    padding: 0,
    overflow: "hidden",
  },
  title: {
    padding: 20,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  scroll: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  dept: {
    color: Colors.light.icon,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  timeBlock: {
    alignItems: "center",
  },
  label: {
    color: Colors.light.icon,
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  time: {
    fontWeight: "600",
  },
  exitsWrapper: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  exitItem: {
    marginBottom: 12,
  },
  exitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  exitReason: {
    fontWeight: "bold",
  },
  currentlyOut: {
    fontSize: 10,
    color: Colors.light.error,
    fontWeight: "bold",
  },
  exitTimes: {
    flexDirection: "row",
    gap: 16,
  },
  timeRow: {
    color: Colors.light.text,
  },
  closeBtn: {
    margin: 20,
    marginTop: 0,
  },
});
