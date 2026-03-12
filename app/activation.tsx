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

      const perms = data.permissions || [];
      const canAccessGuests =
        perms.includes("view_guest_list") || perms.length === 0;
      const canAccessActivities =
        perms.includes("log_guest_movement") || perms.length === 0;
      const canAccessVehicles =
        perms.includes("log_vehicular_movement") || perms.length === 0;

      const initialRoute = canAccessGuests
        ? "/(tabs)/"
        : canAccessActivities
          ? "/(tabs)/activities"
          : canAccessVehicles
            ? "/(tabs)/vehicles"
            : "/(tabs)/";

      // Navigate to main tabs
      router.replace(initialRoute as any);
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
