import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface MenuButtonsProps {
  onGetUsers: () => void;
  onGetMap: () => void;
  onGetValueByUser: () => void;
  onUpdateJson: () => void;
  loading: boolean;
  isOperationInProgress: boolean;
}

export default function MenuButtons({
  onGetUsers,
  onGetMap,
  onGetValueByUser,
  onUpdateJson,
  loading,
  isOperationInProgress,
}: MenuButtonsProps) {
  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity
        onPress={onGetUsers}
        style={[
          styles.menuButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Get Users</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGetMap}
        style={[
          styles.menuButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Get Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGetValueByUser}
        style={[
          styles.menuButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Get Value by User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onUpdateJson}
        style={[
          styles.menuButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Update JSON</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  menuContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    paddingVertical: 10,
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
