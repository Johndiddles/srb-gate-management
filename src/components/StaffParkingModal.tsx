import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Modal, Portal, SegmentedButtons } from "react-native-paper";
import { CameraView, Camera } from "expo-camera";
import Text from "./ThemedText";
import ThemedButton from "./ThemedButton";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function StaffParkingModal({ visible, onDismiss }: Props) {
  const { logStaffVehicleIn } = useGateStore();

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Form Fields
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

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
      setScanned(false);
      setStaffId("");
      setStaffName("");
      setDepartment("");
      setPlateNumber("");
    }
  }, [visible]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    try {
      const payload = JSON.parse(data);
      if (payload.staffId && payload.firstName) {
        setStaffId(payload.staffId);
        setStaffName(`${payload.firstName} ${payload.lastName}`.trim());
        setDepartment(payload.department || "Unknown");
        setMode("manual");
      } else {
        throw new Error("Invalid Staff QR Code");
      }
    } catch (_e) {
      console.log({ _e });
      Alert.alert(
        "Invalid QR Code",
        "This QR code does not contain valid Staff Information. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    }
  };

  const handleSave = () => {
    if (!staffName.trim() || !department.trim()) {
      Alert.alert("Missing Fields", "Staff Name and Department are required.");
      return;
    }

    logStaffVehicleIn({
      staffId,
      staffName,
      department,
      plateNumber,
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
          Log Staff Entry
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
                Center the Staff QR Code in the frame
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Record Staff vehicle or pedestrian entry.
            </Text>

            <View style={styles.form}>
              <ThemedTextInput
                label="Staff Name *"
                value={staffName}
                onChangeText={setStaffName}
                style={styles.input}
              />

              <ThemedTextInput
                label="Staff ID Code"
                value={staffId}
                onChangeText={setStaffId}
                style={styles.input}
                autoCapitalize="characters"
              />

              <ThemedTextInput
                label="Department *"
                value={department}
                onChangeText={setDepartment}
                style={styles.input}
              />

              <ThemedTextInput
                label="License Plate Number"
                placeholder="(Leave blank if walking in)"
                value={plateNumber}
                onChangeText={setPlateNumber}
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.actions}>
              <ThemedButton onPress={onDismiss} style={styles.button}>
                Cancel
              </ThemedButton>
              <ThemedButton
                mode="contained"
                onPress={handleSave}
                labelStyle={{ color: "white" }}
                style={styles.button}
              >
                Log Entry
              </ThemedButton>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
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
    borderColor: "#10b981",
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
    color: "#666",
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "white",
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
