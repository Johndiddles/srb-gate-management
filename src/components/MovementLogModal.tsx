import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, SegmentedButtons } from "react-native-paper";
import Text from "./ThemedText";
import ThemedButton from "./ThemedButton";
import ThemedTextInput from "./ThemedTextInput";
import { useGateStore } from "../store/useGateStore";
import { Guest, TransportMode } from "../types";
import AutocompleteInput from "./AutocompleteInput";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  guest: Guest | null;
}

export default function MovementLogModal({ visible, onDismiss, guest }: Props) {
  const { logMovement, logs } = useGateStore();
  const pastDestinations = Array.from(
    new Set(logs.map((l) => l.destination).filter(Boolean)),
  );
  const [destination, setDestination] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [mode, setMode] = useState<TransportMode>("personal");

  const handleSave = () => {
    if (!guest) return;

    logMovement({
      guestId: guest._id,
      guestName: `${guest.lastName}, ${guest.firstName}`,
      roomNumber: guest.roomNumber,
      destination,
      mode,
      plateNumber,
    });

    // Reset and close
    setDestination("");
    setPlateNumber("");
    setMode("personal");
    onDismiss();
  };

  if (!guest) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Log Movement
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {guest.firstName} {guest.lastName} - Room {guest.roomNumber}
        </Text>

        <View style={styles.form}>
          <Text variant="labelMedium" style={styles.label}>
            Transport Mode
          </Text>
          <SegmentedButtons
            value={mode}
            onValueChange={setMode}
            buttons={[
              { value: "personal", label: "Car" },
              { value: "taxi", label: "Taxi" },
              { value: "walk", label: "Walk" },
              { value: "bus", label: "Bus" },
            ]}
            style={styles.segmentedButton}
          />

          <AutocompleteInput
            label="Destination"
            value={destination}
            onChangeText={setDestination}
            mode="outlined"
            style={styles.input}
            suggestions={pastDestinations}
          />

          {mode !== "walk" && (
            <ThemedTextInput
              label="License Plate / Taxi Number"
              value={plateNumber}
              onChangeText={setPlateNumber}
              style={styles.input}
              autoCapitalize="characters"
            />
          )}

          <View style={styles.actions}>
            <ThemedButton onPress={onDismiss} style={styles.button}>
              Cancel
            </ThemedButton>
            <ThemedButton
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              Log Exit
            </ThemedButton>
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
  label: {
    marginBottom: 4,
  },
  segmentedButton: {
    marginBottom: 8,
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
