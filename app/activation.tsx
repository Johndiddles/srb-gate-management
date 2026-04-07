import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";
import ThemedButton from "../src/components/ThemedButton";
import Text from "../src/components/ThemedText";
import ThemedTextInput from "../src/components/ThemedTextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateDevice } from "../src/services/ApiService";
import { useGateStore } from "../src/store/useGateStore";
import { Colors } from "../constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActivationScreen() {
  const router = useRouter();
  const { activateProvider } = useGateStore();
  const [deviceName, setDeviceName] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleActivation = async (dName?: string, lKey?: string) => {
    const finalDeviceName = typeof dName === "string" ? dName : deviceName;
    const finalLicenseKey = typeof lKey === "string" ? lKey : licenseKey;

    if (!finalDeviceName.trim() || !finalLicenseKey.trim()) {
      setError("Both device name and license key are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await activateDevice(finalLicenseKey, finalDeviceName);

      // Store activation state
      activateProvider(
        finalLicenseKey,
        finalDeviceName,
        data.permissions || [],
        data.token,
      );

      // Navigate natively explicitly into the generic structural dashboard dropping fallback paths explicitly since Grid handles permissions natively.
      const initialRoute = "/";

      // Navigate to main tabs
      router.replace(initialRoute as any);
    } catch (err: any) {
      setError(err.message || "Failed to verify license.");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      if (parsed.deviceName && parsed.licenseKey) {
        setDeviceName(parsed.deviceName);
        setLicenseKey(parsed.licenseKey);
        setIsScanning(false);
        handleActivation(parsed.deviceName, parsed.licenseKey);
      } else {
        throw new Error("Invalid QR format");
      }
    } catch {
      setError("Unrecognized activation code format.");
      setIsScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isScanning ? (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <SafeAreaView style={styles.scannerOverlay}>
            <ThemedButton
              mode="contained"
              onPress={() => setIsScanning(false)}
              style={styles.cancelScanButton}
              labelStyle={{ color: "black", fontWeight: "bold" }}
            >
              Cancel Scanning
            </ThemedButton>
          </SafeAreaView>
        </View>
      ) : (
      <Surface style={styles.card} elevation={2}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            App Activation
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter your provisioned credentials to access this device.
          </Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <ThemedTextInput
            label="Device Name"
            value={deviceName}
            onChangeText={setDeviceName}
            style={styles.input}
            autoCapitalize="words"
          />

          <ThemedTextInput
            label="License Key"
            value={licenseKey}
            onChangeText={setLicenseKey}
            style={styles.input}
            autoCapitalize="none"
            // secureTextEntry
          />

          <ThemedButton
            mode="contained"
            onPress={handleActivation}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{
              color: "white",
              fontSize: 18,
              fontWeight: "semibold",
            }}
          >
            Verify & Activate
          </ThemedButton>

          <ThemedButton
            mode="outlined"
            onPress={async () => {
              if (!permission?.granted) {
                const result = await requestPermission();
                if (!result.granted) {
                  setError("Camera permission is required to scan codes.");
                  return;
                }
              }
              setScanned(false);
              setIsScanning(true);
            }}
            icon={() => <MaterialCommunityIcons name="qrcode-scan" size={20} color={Colors.light.tint} />}
            style={styles.scanButton}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ color: Colors.light.tint, fontSize: 16, fontWeight: "600" }}
          >
            Scan QR Code
          </ThemedButton>
        </View>
      </Surface>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.light.icon,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: Colors.light.error,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.light.error,
    textAlign: "center",
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.light.background,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  scanButton: {
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderColor: Colors.light.tint,
    borderWidth: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  cancelScanButton: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
