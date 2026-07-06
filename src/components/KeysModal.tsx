import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { Modal, Portal, SegmentedButtons } from "react-native-paper";
import { CameraView, Camera } from "expo-camera";
import Text from "./ThemedText";
import ThemedButton from "./ThemedButton";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";
import { KeyCollection } from "../types";
import { Colors } from "../../constants/theme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

type ScanStep = "staff" | "staff_details" | "key" | "confirm";

export default function KeysModal({ visible, onDismiss }: Props) {
  const { logKeyCollection, logKeyReturn, keyCollections } = useGateStore();

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [step, setStep] = useState<ScanStep>("staff");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Form Fields
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [keyTag, setKeyTag] = useState("");

  // Auto-detected Flow State
  const [detectedFlow, setDetectedFlow] = useState<"collect" | "return">(
    "collect",
  );
  const [activeCollection, setActiveCollection] =
    useState<KeyCollection | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setMode("scan");
      setStep("staff");
      setScanned(false);
      setStaffId("");
      setStaffName("");
      setDepartment("");
      setKeyTag("");
      setActiveCollection(null);
      setDetectedFlow("collect");
    }
  }, [visible]);

  // Detect flow type when keyTag changes or when advancing to confirm step
  useEffect(() => {
    if (!keyTag || keyTag.trim().length === 0) {
      setActiveCollection(null);
      return;
    }

    const match = keyCollections.find(
      (k) =>
        k.keyTag.trim().toLowerCase() === keyTag.trim().toLowerCase() &&
        k.status === "collected",
    );

    if (match) {
      setActiveCollection(match);
      setDetectedFlow("return");
    } else {
      setActiveCollection(null);
      setDetectedFlow("collect");
    }
  }, [keyTag, keyCollections]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    if (step === "staff") {
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

        // Vibrate/beep feedback could go here
        // Move to staff details view first
        setStep("staff_details");
        setScanned(false);
      } else {
        Alert.alert(
          "Invalid Barcode",
          "This barcode does not contain a valid Staff ID. Please try again.",
          [{ text: "OK", onPress: () => setScanned(false) }],
        );
      }
    } else if (step === "key") {
      // Key Tag Scanned
      if (data && data.trim().length > 0) {
        setKeyTag(data.trim());
        setStep("confirm");
        setScanned(false);
      } else {
        Alert.alert(
          "Invalid Barcode",
          "Failed to scan key tag barcode. Please try again.",
          [{ text: "OK", onPress: () => setScanned(false) }],
        );
      }
    }
  };

  const handleSave = () => {
    const cleanStaffId = staffId.trim();
    const cleanStaffName = staffName.trim();
    const cleanDept = department.trim();
    const cleanKeyTag = keyTag.trim();

    if (!cleanStaffId) {
      Alert.alert("Missing Fields", "Staff ID Code is required.");
      return;
    }
    if (!cleanKeyTag) {
      Alert.alert("Missing Fields", "Key Tag Barcode is required.");
      return;
    }

    if (detectedFlow === "return") {
      logKeyReturn({
        keyTag: cleanKeyTag,
        staffId: cleanStaffId,
        staffName: cleanStaffName || undefined,
        department: cleanDept || undefined,
      });
      Alert.alert(
        "Key Returned",
        `Key tag ${cleanKeyTag} successfully signed back in by ${cleanStaffName || cleanStaffId}.`,
      );
    } else {
      logKeyCollection({
        keyTag: cleanKeyTag,
        staffId: cleanStaffId,
        staffName: cleanStaffName || undefined,
        department: cleanDept || undefined,
      });
      Alert.alert(
        "Key Checked Out",
        `Key tag ${cleanKeyTag} successfully signed out to ${cleanStaffName || cleanStaffId}.`,
      );
    }

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
          {step === "staff"
            ? "Step 1: Scan Staff ID"
            : step === "staff_details"
              ? "Staff Details"
              : step === "key"
                ? "Step 2: Scan Key Tag"
                : detectedFlow === "return"
                  ? "Confirm Return"
                  : "Confirm Checkout"}
        </Text>

        {step !== "confirm" && step !== "staff_details" && (
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as "scan" | "manual")}
            buttons={[
              {
                value: "scan",
                label: `Scan ${step === "staff" ? "ID" : "Key"}`,
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
        )}

        {mode === "scan" && step !== "confirm" && step !== "staff_details" ? (
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
                    barcodeTypes: [
                      "qr",
                      "pdf417",
                      "code128",
                      "code39",
                      "ean13",
                    ],
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
                Center the{" "}
                {step === "staff" ? "Staff ID Barcode" : "Key Tag Barcode"} in
                the frame
              </Text>
            </View>
            {step === "key" && (
              <TouchableOpacity
                onPress={() => setStep("staff_details")}
                style={styles.scannerBackBtn}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  ← Back to Staff Details
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            {step === "staff" && (
              <View style={styles.form}>
                <ThemedTextInput
                  label="Staff ID Code *"
                  value={staffId}
                  onChangeText={setStaffId}
                  style={styles.input}
                  autoCapitalize="characters"
                />

                <CashlessAutocompleteField
                  staffId={staffId}
                  onChangeDetails={(name, dept) => {
                    if (name) setStaffName(name);
                    if (dept) setDepartment(dept);
                  }}
                />

                <ThemedTextInput
                  label="Staff Name (Optional)"
                  value={staffName}
                  onChangeText={setStaffName}
                  style={styles.input}
                />

                <ThemedTextInput
                  label="Department (Optional)"
                  value={department}
                  onChangeText={setDepartment}
                  style={styles.input}
                />

                <View style={styles.actions}>
                  <ThemedButton onPress={onDismiss} style={styles.button}>
                    Cancel
                  </ThemedButton>
                  <ThemedButton
                    mode="contained"
                    onPress={() => {
                      if (!staffId.trim()) {
                        Alert.alert(
                          "Missing ID",
                          "Please scan or enter a Staff ID.",
                        );
                        return;
                      }
                      setStep("staff_details");
                    }}
                    buttonColor="#059669"
                    labelStyle={{ color: "white" }}
                    style={styles.button}
                  >
                    Next
                  </ThemedButton>
                </View>
              </View>
            )}

            {step === "staff_details" && (
              <View style={styles.form}>
                <View style={styles.infoBox}>
                  <Text
                    variant="titleMedium"
                    style={{ fontWeight: "bold", color: Colors.light.text }}
                  >
                    Staff Member Details
                  </Text>
                  <View style={{ marginTop: 8, gap: 4 }}>
                    <Text variant="bodyMedium" style={{ color: "#475569" }}>
                      ID: <Text style={{ fontWeight: "bold" }}>{staffId}</Text>
                    </Text>
                    <Text variant="bodyMedium" style={{ color: "#475569" }}>
                      Name:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {staffName || "—"}
                      </Text>
                    </Text>
                    <Text variant="bodyMedium" style={{ color: "#475569" }}>
                      Department:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {department || "—"}
                      </Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsVertical}>
                  <ThemedButton
                    mode="contained"
                    onPress={() => {
                      setMode("scan");
                      setScanned(false);
                      setStep("key");
                    }}
                    buttonColor="#059669"
                    labelStyle={{ color: "white" }}
                    style={styles.actionBtnLarge}
                  >
                    Scan Key Tag
                  </ThemedButton>

                  <ThemedButton
                    mode="outlined"
                    onPress={() => {
                      setMode("manual");
                      setStep("key");
                    }}
                    style={styles.actionBtnLarge}
                  >
                    Enter Key Tag Manually
                  </ThemedButton>
                </View>

                <View style={styles.actions}>
                  <ThemedButton
                    onPress={() => setStep("staff")}
                    style={styles.button}
                  >
                    Back to Step 1
                  </ThemedButton>
                </View>
              </View>
            )}

            {step === "key" && (
              <View style={styles.form}>
                <View style={styles.infoBox}>
                  <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                    Staff Member Recorded:
                  </Text>
                  <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                    ID: {staffId} {staffName ? `| ${staffName}` : ""}
                  </Text>
                </View>

                {mode === "manual" ? (
                  <ThemedTextInput
                    label="Key Tag Barcode *"
                    value={keyTag}
                    onChangeText={setKeyTag}
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                ) : (
                  <View style={{ paddingVertical: 12, alignItems: "center" }}>
                    <Text
                      variant="bodyMedium"
                      style={{ fontStyle: "italic", color: "#64748b" }}
                    >
                      Key Tag Barcode Scanner is open.
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: "#94a3b8", marginTop: 4 }}
                    >
                      (Please scan the barcode or switch to manual)
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <ThemedButton
                    onPress={() => setStep("staff_details")}
                    style={styles.button}
                  >
                    Back
                  </ThemedButton>
                  {mode === "manual" && (
                    <ThemedButton
                      mode="contained"
                      onPress={() => {
                        if (!keyTag.trim()) {
                          Alert.alert(
                            "Missing Tag",
                            "Please scan or enter a Key Tag barcode.",
                          );
                          return;
                        }
                        setStep("confirm");
                      }}
                      buttonColor="#059669"
                      labelStyle={{ color: "white" }}
                      style={styles.button}
                    >
                      Next
                    </ThemedButton>
                  )}
                </View>
              </View>
            )}

            {step === "confirm" && (
              <View style={styles.form}>
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor:
                        detectedFlow === "return" ? "#e8f5e9" : "#eff6ff",
                    },
                  ]}
                >
                  <Text
                    variant="titleMedium"
                    style={{
                      fontWeight: "bold",
                      color: detectedFlow === "return" ? "#2e7d32" : "#1d4ed8",
                    }}
                  >
                    {detectedFlow === "return"
                      ? "🔄 Key Return Detected"
                      : "🔑 Key Checkout Detected"}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ marginTop: 6, color: "#475569" }}
                  >
                    Key Tag:{" "}
                    <Text style={{ fontWeight: "bold" }}>{keyTag}</Text>
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ marginTop: 2, color: "#475569" }}
                  >
                    Staff Member:{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {staffName || staffId}
                    </Text>{" "}
                    (ID: {staffId})
                  </Text>
                  {detectedFlow === "return" && activeCollection && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: "#d97706",
                        marginTop: 8,
                        fontStyle: "italic",
                      }}
                    >
                      Originally check out by{" "}
                      {activeCollection.collectingStaffName ||
                        activeCollection.collectingStaffId}{" "}
                      on{" "}
                      {new Date(
                        activeCollection.collectedAt,
                      ).toLocaleDateString()}
                      .
                    </Text>
                  )}
                </View>

                <View style={styles.actions}>
                  <ValuesResetButton
                    onPress={() => {
                      setStep("key");
                      setKeyTag("");
                    }}
                    style={styles.button}
                  >
                    Back
                  </ValuesResetButton>
                  <ThemedButton
                    mode="contained"
                    onPress={handleSave}
                    buttonColor={
                      detectedFlow === "return" ? "#2e7d32" : "#0f172a"
                    }
                    labelStyle={{ color: "white" }}
                    style={styles.button}
                  >
                    {detectedFlow === "return"
                      ? "Confirm Return"
                      : "Confirm Checkout"}
                  </ThemedButton>
                </View>
              </View>
            )}
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
  }, [staffId, staffParkingMovements, staffShifts, onChangeDetails]);

  return null;
}

// Wrapper to prevent TS errors on button style typing
function ValuesResetButton({ children, onPress, style }: any) {
  return (
    <ThemedButton onPress={onPress} style={style}>
      {children}
    </ThemedButton>
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
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.light.background,
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
  scannerBackBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionsVertical: {
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  actionBtnLarge: {
    width: "100%",
    paddingVertical: 4,
  },
});
