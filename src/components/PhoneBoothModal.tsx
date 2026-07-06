import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Modal, Portal, SegmentedButtons } from "react-native-paper";
import { CameraView, Camera } from "expo-camera";
import Text from "./ThemedText";
import ThemedButton from "./ThemedButton";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";
import { PhoneBoothAssignment } from "../types";
import { Colors } from "../../constants/theme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  initialStaffId?: string;
}

export default function PhoneBoothModal({
  visible,
  onDismiss,
  initialStaffId,
}: Props) {
  const { logPhoneDeposit, logPhoneRetrieval, phoneBoothAssignments } =
    useGateStore();

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Form Fields
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [slotNumber, setSlotNumber] = useState("");

  // Track active assignment if staff member has a phone in the booth
  const [activeAssignment, setActiveAssignment] =
    useState<PhoneBoothAssignment | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      if (initialStaffId) {
        setMode("manual");
        setScanned(true);
        setStaffId(initialStaffId);
      } else {
        setMode("scan");
        setScanned(false);
        setStaffId("");
        setStaffName("");
        setDepartment("");
        setSlotNumber("");
        setActiveAssignment(null);
      }
    }
  }, [visible, initialStaffId]);

  // Handle detecting deposit vs retrieval flow when staffId changes
  useEffect(() => {
    if (!staffId || staffId.trim().length === 0) {
      setActiveAssignment(null);
      return;
    }

    const match = phoneBoothAssignments.find(
      (a) =>
        a.staffId.trim().toLowerCase() === staffId.trim().toLowerCase() &&
        a.status === "assigned",
    );

    if (match) {
      setActiveAssignment(match);
      setStaffName(match.staffName || "");
      setDepartment(match.department || "");
      setSlotNumber(match.slotNumber.toString());
    } else {
      setActiveAssignment(null);

      // Auto-assign first free slot for deposit, only if not already filled or if it matches previous matching
      const firstFree = findFirstFreeSlot(phoneBoothAssignments);
      if (firstFree !== null) {
        setSlotNumber(firstFree.toString());
      } else {
        setSlotNumber("");
      }
    }
  }, [staffId, phoneBoothAssignments]);

  const findFirstFreeSlot = (list: PhoneBoothAssignment[]): number | null => {
    const occupied = new Set(
      list.filter((a) => a.status === "assigned").map((a) => a.slotNumber),
    );
    for (let slot = 41; slot <= 294; slot++) {
      if (!occupied.has(slot)) {
        return slot;
      }
    }
    return null;
  };

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    let scannedStaffId = "";
    let scannedName = "";
    let scannedDept = "";

    try {
      const payload = JSON.parse(data);
      if (payload.staffId) {
        scannedStaffId = payload.staffId;
        scannedName =
          `${payload.firstName || ""} ${payload.lastName || ""}`.trim();
        scannedDept = payload.department || "";
      } else {
        throw new Error("Invalid Staff QR Code");
      }
    } catch (_e) {
      console.log(_e);
      if (data && (data.startsWith("ST") || data.length > 3)) {
        scannedStaffId = data;
      }
    }

    if (scannedStaffId) {
      setStaffId(scannedStaffId);
      if (scannedName) setStaffName(scannedName);
      if (scannedDept) setDepartment(scannedDept);
      setMode("manual");
    } else {
      Alert.alert(
        "Invalid Barcode",
        "This barcode does not contain a valid Staff ID. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    }
  };

  const handleSave = () => {
    const cleanStaffId = staffId.trim();
    const cleanStaffName = staffName.trim();
    const cleanDept = department.trim();
    const slotVal = parseInt(slotNumber, 10);

    if (!cleanStaffId) {
      Alert.alert("Missing Fields", "Staff ID Code is required.");
      return;
    }

    if (activeAssignment) {
      // Retrieval Flow
      logPhoneRetrieval(cleanStaffId);
      Alert.alert(
        "Phone Retrieved",
        `Phone successfully retrieved from Slot ${activeAssignment.slotNumber} for ${cleanStaffName || cleanStaffId}.`,
      );
      onDismiss();
      return;
    }

    // Deposit Flow
    if (isNaN(slotVal) || slotVal < 41 || slotVal > 294) {
      Alert.alert(
        "Invalid Slot",
        "Available slot numbers range from 41 to 294.",
      );
      return;
    }

    // Verify slot occupancy
    const isOccupied = phoneBoothAssignments.some(
      (a) => a.status === "assigned" && a.slotNumber === slotVal,
    );

    if (isOccupied) {
      Alert.alert(
        "Slot Occupied",
        `Slot ${slotVal} is currently occupied. Please choose a free slot.`,
      );
      return;
    }

    logPhoneDeposit({
      staffId: cleanStaffId,
      staffName: cleanStaffName || undefined,
      department: cleanDept || undefined,
      slotNumber: slotVal,
    });

    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text variant="headlineSmall" style={styles.title}>
          {activeAssignment ? "Retrieve Phone" : "Deposit Phone"}
        </Text>

        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as "scan" | "manual")}
          buttons={[
            {
              value: "scan",
              label: "Scan ID",
              icon: "qrcode-scan",
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
            {hasPermission === null ? (
              <Text>Requesting camera permission...</Text>
            ) : hasPermission === false ? (
              <Text>No access to camera</Text>
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417", "code128"],
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
                Center the Staff Barcode or QR Code in the frame
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {activeAssignment ? (
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  variant="headlineLarge"
                  style={[
                    {
                      color: "#ffffff",
                      fontWeight: "bold",
                      backgroundColor: "#059669",
                      paddingVertical: 12,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      textAlign: "center",
                    },
                  ]}
                >
                  {activeAssignment.slotNumber}
                </Text>
              </View>
            ) : (
              <Text variant="bodyMedium" style={[styles.subtitle]}>
                Record phone submission into slot booth
              </Text>
            )}

            <View style={styles.form}>
              <ThemedTextInput
                label="Staff ID Code *"
                value={staffId}
                onChangeText={setStaffId}
                style={styles.input}
                autoCapitalize="characters"
              />

              {!activeAssignment && (
                <CashlessAutocompleteField
                  staffId={staffId}
                  onChangeDetails={(name, dept) => {
                    if (name) setStaffName(name);
                    if (dept) setDepartment(dept);
                  }}
                />
              )}

              <ThemedTextInput
                label={
                  activeAssignment ? "Staff Name" : "Staff Name (Optional)"
                }
                value={staffName}
                onChangeText={setStaffName}
                style={styles.input}
                disabled={!!activeAssignment}
              />

              <ThemedTextInput
                label={
                  activeAssignment ? "Department" : "Department (Optional)"
                }
                value={department}
                onChangeText={setDepartment}
                style={styles.input}
                disabled={!!activeAssignment}
              />

              {!activeAssignment && (
                <ThemedTextInput
                  label="Assigned Booth Slot (41-294) *"
                  value={slotNumber}
                  onChangeText={setSlotNumber}
                  keyboardType="number-pad"
                  style={styles.input}
                  disabled={!!activeAssignment}
                />
              )}
            </View>

            <View style={styles.actions}>
              <ThemedButton onPress={onDismiss} style={styles.button}>
                Cancel
              </ThemedButton>
              <ThemedButton
                mode="contained"
                onPress={handleSave}
                buttonColor={activeAssignment ? "#059669" : "#750670ff"}
                labelStyle={{ color: "white" }}
                style={styles.button}
              >
                {activeAssignment ? "Retrieve Phone" : "Save Deposit"}
              </ThemedButton>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

// Simple lookup component helper to autofill name/dept if they typed a staff ID that has been used in shifts/parking before
function CashlessAutocompleteField({
  staffId,
  onChangeDetails,
}: {
  staffId: string;
  onChangeDetails: (name: string, dept: string) => void;
}) {
  const { staffParkingMovements, staffShifts } = useGateStore();

  useEffect(() => {
    if (!staffId || staffId.trim().length < 3) return;

    // Search staff parking or shifts logs for staffId matching
    const matchingParking = staffParkingMovements.find(
      (m) => m.staffId.toLowerCase() === staffId.trim().toLowerCase(),
    );
    if (matchingParking) {
      onChangeDetails(matchingParking.staffName, matchingParking.department);
      return;
    }

    const matchingShift = staffShifts.find(
      (s) => s.staffId.toLowerCase() === staffId.trim().toLowerCase(),
    );
    if (matchingShift) {
      onChangeDetails(matchingShift.staffName, matchingShift.department);
    }
  }, [staffId, staffShifts, staffParkingMovements, onChangeDetails]);

  return null;
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
