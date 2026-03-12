import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Text } from "react-native-paper";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";
import AutocompleteInput from "./AutocompleteInput";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function VehicleMovementModal({ visible, onDismiss }: Props) {
  const { logVehicleIn, vehicularMovements } = useGateStore();

  const pastNames = Array.from(
    new Set(vehicularMovements.map((v) => v.name).filter(Boolean)),
  );
  const pastReasons = Array.from(
    new Set(vehicularMovements.map((v) => v.reason).filter(Boolean)),
  );
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [reason, setReason] = useState("");

  const handleSave = () => {
    // Basic validation
    if (!name.trim() || !plateNumber.trim() || !reason.trim()) {
      // In a real app we might show an error, but let's just abort here
      return;
    }

    logVehicleIn({
      name,
      plateNumber,
      reason,
    });

    // Reset and close
    setName("");
    setPlateNumber("");
    setReason("");
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
          Log Vehicle Entry
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Record a new non-guest vehicle entering the property.
        </Text>

        <View style={styles.form}>
          <AutocompleteInput
            label="Driver / Company Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            suggestions={pastNames}
          />

          <ThemedTextInput
            label="License Plate / Taxi Number"
            value={plateNumber}
            onChangeText={setPlateNumber}
            style={styles.input}
            autoCapitalize="characters"
          />

          <AutocompleteInput
            label="Reason for Entry"
            value={reason}
            onChangeText={setReason}
            mode="outlined"
            style={styles.input}
            suggestions={pastReasons}
          />

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.button}>
              Log Entry
            </Button>
          </View>
        </View>
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
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
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
