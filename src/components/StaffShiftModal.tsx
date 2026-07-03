import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Modal, Portal, SegmentedButtons } from "react-native-paper";
import { CameraView } from "expo-camera";
import Text from "./ThemedText";
import { Colors } from "../../constants/theme";
import ThemedButton from "./ThemedButton";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";
import { StaffShift } from "../types";
import useStaffScanner from "../hooks/useStaffScanner";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function StaffShiftModal({ visible, onDismiss }: Props) {
  const {
    logStaffShiftIn,
    logStaffShiftOut,
    logStaffShiftExit,
    logStaffShiftEntry,
    staffShifts,
  } = useGateStore();

  const scanner = useStaffScanner();

  const [mode, setMode] = useState<"scan" | "manual">("scan");

  // Form Fields
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [activeShift, setActiveShift] = useState<StaffShift | null>(null);

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setMode("scan");
      scanner.resetScanner();
      setStaffId("");
      setStaffName("");
      setDepartment("");
      setExitReason("");
      setActiveShift(null);
    }
  }, [visible]);

  // Hook into scanner
  useEffect(() => {
    if (scanner.scannedData) {
      const {
        staffId: sId,
        firstName,
        lastName,
        department: dept,
      } = scanner.scannedData;
      setStaffId(sId);
      if (firstName) setStaffName(`${firstName} ${lastName || ""}`.trim());
      if (dept) setDepartment(dept);

      evaluateActiveShift(sId);
      setMode("manual");
    }
  }, [scanner.scannedData]);

  const evaluateActiveShift = (sid: string) => {
    const existing = staffShifts.find(
      (s) => s.staffId === sid && s.status === "active",
    );
    if (existing) {
      setActiveShift(existing);
      setStaffName(existing.staffName);
      setDepartment(existing.department);
    } else {
      setActiveShift(null);
    }
  };

  const handleManualIdCheck = () => {
    evaluateActiveShift(staffId);
  };

  const handleClockIn = () => {
    if (!staffName.trim() || !department.trim() || !staffId.trim()) {
      Alert.alert(
        "Missing Fields",
        "Staff ID, Name, and Department are required to clock in.",
      );
      return;
    }
    logStaffShiftIn({ staffId, staffName, department });
    onDismiss();
  };

  const handleClockOut = () => {
    if (activeShift) {
      logStaffShiftOut(activeShift.app_log_id);
      onDismiss();
    }
  };

  const handleLogExit = () => {
    if (activeShift) {
      logStaffShiftExit({
        app_log_id: activeShift.app_log_id,
        reason: exitReason,
      });
      onDismiss();
    }
  };

  const handleLogEntry = () => {
    if (activeShift) {
      logStaffShiftEntry(activeShift.app_log_id);
      onDismiss();
    }
  };

  const isCurrentlyOut = activeShift?.exits.some((e) => !e.timeIn);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Staff Movement Tracking
        </Text>

        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as "scan" | "manual")}
          buttons={[
            {
              value: "scan",
              label: "Scan Details",
              icon: "qrcode-scan",
              disabled: !!activeShift,
            },
            {
              value: "manual",
              label: "Manual Entry",
              icon: "keyboard",
            },
          ]}
          style={styles.segmentedControl}
        />

        {mode === "scan" ? (
          <View style={styles.scannerContainer}>
            {scanner.hasPermission === null ? (
              <Text>Requesting camera permission...</Text>
            ) : scanner.hasPermission === false ? (
              <Text>No access to camera</Text>
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  onBarcodeScanned={
                    scanner.scanned ? undefined : scanner.handleBarCodeScanned
                  }
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                  }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerCutout} />
                </View>
              </View>
            )}
            <View style={styles.scanTextWrapper}>
              <Text variant="bodyMedium" style={styles.scanText}>
                Center the Staff QR Code to clock in or manage shift
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text
              variant="bodyMedium"
              style={{
                ...styles.subtitle,
                color: activeShift
                  ? isCurrentlyOut
                    ? Colors.light.error
                    : Colors.light.tint
                  : Colors.light.icon,
                fontWeight: activeShift ? "bold" : "normal",
              }}
            >
              {activeShift
                ? isCurrentlyOut
                  ? `🔴 ${activeShift.staffName} is currently OUT.`
                  : `🟢 ${activeShift.staffName} is checked in for their shift.`
                : "Record Staff Shift entry below."}
            </Text>

            <View style={styles.form}>
              <ThemedTextInput
                label="Staff ID Code *"
                value={staffId}
                onChangeText={setStaffId}
                onBlur={handleManualIdCheck}
                style={styles.input}
                autoCapitalize="characters"
                disabled={!!activeShift}
              />

              <ThemedTextInput
                label="Staff Name *"
                value={staffName}
                onChangeText={setStaffName}
                style={styles.input}
                disabled={!!activeShift}
              />

              <ThemedTextInput
                label="Department *"
                value={department}
                onChangeText={setDepartment}
                style={styles.input}
                disabled={!!activeShift}
              />

              {activeShift && !isCurrentlyOut && (
                <ThemedTextInput
                  label="Exit Reason (Optional)"
                  placeholder="E.g. Lunch, Errands"
                  value={exitReason}
                  onChangeText={setExitReason}
                  style={styles.input}
                />
              )}
            </View>

            <View style={styles.actions}>
              {!activeShift ? (
                <>
                  <ThemedButton onPress={onDismiss} style={styles.button}>
                    Cancel
                  </ThemedButton>
                  <ThemedButton
                    mode="contained"
                    onPress={handleClockIn}
                    labelStyle={{ color: "white" }}
                    style={styles.button}
                  >
                    Clock In
                  </ThemedButton>
                </>
              ) : isCurrentlyOut ? (
                <>
                  <ThemedButton onPress={onDismiss} style={styles.button}>
                    Cancel
                  </ThemedButton>
                  <ThemedButton
                    mode="contained"
                    onPress={handleLogEntry}
                    labelStyle={{ color: "white" }}
                    style={styles.button}
                  >
                    Log Entry
                  </ThemedButton>
                </>
              ) : (
                <>
                  <ThemedButton
                    onPress={handleClockOut}
                    style={{
                      ...styles.button,
                      borderColor: Colors.light.error,
                    }}
                    labelStyle={{ color: Colors.light.error }}
                  >
                    Clock Out for Day
                  </ThemedButton>
                  <ThemedButton
                    mode="contained"
                    onPress={handleLogExit}
                    labelStyle={{ color: "white" }}
                    style={styles.button}
                  >
                    Log Gate Pass
                  </ThemedButton>
                </>
              )}
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  segmentedControl: {
    marginBottom: 16,
  },
  scannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 380,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  cameraWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerCutout: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    backgroundColor: "transparent",
    borderRadius: 16,
  },
  scanTextWrapper: {
    position: "absolute",
    bottom: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanText: {
    color: "white",
    textAlign: "center",
  },
  formContainer: {
    marginTop: 8,
  },
  subtitle: {
    marginBottom: 16,
    color: Colors.light.icon,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.light.background,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});
