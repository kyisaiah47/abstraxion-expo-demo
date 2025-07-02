import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import FlowSelector from "@/components/FlowSelector";

export default function ZKtls() {
  const { isConnected } = useAbstraxionAccount();

  if (!isConnected) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>ZKtls / Reclaim</Text>
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to access ZKtls functionality.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>ZKtls / Reclaim</Text>
        <Text style={styles.descriptionText}>
          Zero-knowledge proof functionality using Reclaim Protocol. Choose between the default flow 
          with a pre-configured contract or create your own custom implementation.
        </Text>
      </View>
      <FlowSelector />
    </View>
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
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
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
  descriptionText: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
