import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";

interface ValueByUserFormProps {
  addressInput: string;
  setAddressInput: (value: string) => void;
  onGetValueByUser: (address: string) => void;
  loading: boolean;
  isOperationInProgress: boolean;
}

export default function ValueByUserForm({
  addressInput,
  setAddressInput,
  onGetValueByUser,
  loading,
  isOperationInProgress,
}: ValueByUserFormProps) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>Enter User Address:</Text>
      <TextInput
        style={styles.input}
        value={addressInput}
        onChangeText={setAddressInput}
        placeholder="xion1..."
        placeholderTextColor="#666666"
      />
      <TouchableOpacity
        onPress={() => onGetValueByUser(addressInput)}
        style={[
          styles.menuButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Get Value</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  formSection: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#111111",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#333333",
    color: "#ffffff",
  },
  menuButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    alignItems: "center" as const,
    flex: 1,
    minWidth: 120,
    maxWidth: "48%" as any,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500" as const,
  },
  disabledButton: {
    backgroundColor: "#333333",
    opacity: 0.6,
  },
};
