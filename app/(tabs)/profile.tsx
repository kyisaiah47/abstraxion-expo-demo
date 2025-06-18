import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import AccountInfo from "@/components/AccountInfo";

export default function Profile() {
  const { logout, isConnected } = useAbstraxionAccount();

  const handleLogout = () => {
    logout();
  };

  if (!isConnected) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Profile</Text>
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to view your profile.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Profile</Text>

      {/* Account Information */}
      <AccountInfo
        onLogout={handleLogout}
        loading={false}
        isOperationInProgress={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#ffffff",
    textAlign: "center",
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  notConnectedText: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
  },
});
