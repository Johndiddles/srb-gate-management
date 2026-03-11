import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateDevice } from "../src/services/ApiService";
import { useGateStore } from "../src/store/useGateStore";

export default function ActivationScreen() {
  const router = useRouter();
  const { activateProvider } = useGateStore();
  const [deviceName, setDeviceName] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivation = async () => {
    if (!deviceName.trim() || !licenseKey.trim()) {
      setError("Both device name and license key are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await activateDevice(licenseKey, deviceName);

      // Store activation state
      activateProvider(
        licenseKey,
        deviceName,
        data.permissions || [],
        data.token,
      );

      // Navigate to main tabs
      router.replace("/(tabs)/" as any);
    } catch (err: any) {
      setError(err.message || "Failed to verify license.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <TextInput
            label="Device Name"
            value={deviceName}
            onChangeText={setDeviceName}
            mode="outlined"
            style={styles.input}
            textColor="black"
            autoCapitalize="words"
          />

          <TextInput
            label="License Key"
            value={licenseKey}
            onChangeText={setLicenseKey}
            mode="outlined"
            style={styles.input}
            textColor="black"
            autoCapitalize="none"
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={handleActivation}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
          >
            Verify & Activate
          </Button>
        </View>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748b",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "white",
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#059669",
  },
});
