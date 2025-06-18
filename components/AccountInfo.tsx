import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Clipboard,
  DimensionValue,
} from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

interface AccountInfoProps {
  onLogout: () => void;
  loading: boolean;
  isOperationInProgress: boolean;
}

export default function AccountInfo({
  onLogout,
  loading,
  isOperationInProgress,
}: AccountInfoProps) {
  const { data: account } = useAbstraxionAccount();

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("Success", "Address copied to clipboard!");
    } catch (error) {
      Alert.alert("Error", "Failed to copy address");
    }
  };

  return (
    <View style={styles.accountInfoContainer}>
      <Text style={styles.accountLabel}>Connected Account:</Text>
      <View style={styles.addressContainer}>
        <Text
          style={styles.addressText}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {account?.bech32Address}
        </Text>
        <TouchableOpacity
          onPress={() =>
            account?.bech32Address && copyToClipboard(account.bech32Address)
          }
          style={styles.copyButton}
        >
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={onLogout}
        style={[
          styles.menuButton,
          styles.logoutButton,
          styles.fullWidthButton,
          (loading || isOperationInProgress) && styles.disabledButton,
        ]}
        disabled={loading || isOperationInProgress}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  accountInfoContainer: {
    backgroundColor: "#111111",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#ffffff",
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#222222",
    padding: 10,
    borderRadius: 5,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#cccccc",
    marginRight: 10,
  },
  copyButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "500" as const,
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
  fullWidthButton: {
    width: "100%" as DimensionValue,
    maxWidth: "100%" as DimensionValue,
  },
  logoutButton: {
    marginTop: 15,
    backgroundColor: "#ff4444",
    width: "100%" as DimensionValue,
    maxWidth: "100%" as DimensionValue,
  },
  disabledButton: {
    opacity: 0.6,
  },
};
