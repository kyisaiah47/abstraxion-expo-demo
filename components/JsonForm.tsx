import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  DimensionValue,
} from "react-native";

interface JsonFormProps {
  jsonInput: string;
  setJsonInput: (value: string) => void;
  jsonError: string;
  onUpdateValue: () => void;
  onFormatJson: () => void;
  loading: boolean;
  isOperationInProgress: boolean;
  isTransactionPending: boolean;
}

export default function JsonForm({
  jsonInput,
  setJsonInput,
  jsonError,
  onUpdateValue,
  onFormatJson,
  loading,
  isOperationInProgress,
  isTransactionPending,
}: JsonFormProps) {
  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleJsonChange = (text: string) => {
    setJsonInput(text);
    validateJson(text);
  };

  return (
    <View style={styles.formSection}>
      <TextInput
        style={[styles.jsonInput, jsonError ? styles.errorInput : null]}
        value={jsonInput}
        onChangeText={handleJsonChange}
        placeholder="Enter JSON data..."
        placeholderTextColor="#666666"
        multiline
      />
      {jsonError ? <Text style={styles.errorText}>{jsonError}</Text> : null}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onUpdateValue}
          style={[
            styles.menuButton,
            (loading ||
              isOperationInProgress ||
              !!jsonError ||
              isTransactionPending) &&
              styles.disabledButton,
          ]}
          disabled={
            loading ||
            isOperationInProgress ||
            !!jsonError ||
            isTransactionPending
          }
        >
          <Text style={styles.buttonText}>Submit JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onFormatJson}
          style={[
            styles.menuButton,
            (loading || isOperationInProgress) && styles.disabledButton,
          ]}
          disabled={loading || isOperationInProgress}
        >
          <Text style={styles.buttonText}>Format JSON</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  formSection: {
    gap: 10,
  },
  jsonInput: {
    backgroundColor: "#111111",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#333333",
    color: "#ffffff",
    minHeight: 200,
    textAlignVertical: "top" as const,
  },
  errorInput: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  menuButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    alignItems: "center" as const,
    flex: 1,
    minWidth: 120,
    maxWidth: "48%" as DimensionValue,
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
