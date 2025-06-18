import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

interface QueryResult {
  users?: string[];
  value?: string;
  map?: Array<[string, string]>;
}

interface QueryResultsProps {
  activeView: string;
  queryResult: QueryResult;
  selectedAddress: string;
  executeResult?: ExecuteResult;
  onGetValueByUser: (address: string) => void;
  onSetActiveView: (view: string) => void;
}

export default function QueryResults({
  activeView,
  queryResult,
  selectedAddress,
  executeResult,
  onGetValueByUser,
  onSetActiveView,
}: QueryResultsProps) {
  return (
    <>
      {/* Query Results */}
      {activeView === "users" && queryResult.users && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Users:</Text>
          {queryResult.users.map((user, index) => (
            <View key={index} style={styles.userRow}>
              <Text style={styles.userAddress}>{user}</Text>
              <TouchableOpacity
                onPress={() => {
                  onGetValueByUser(user);
                  onSetActiveView("value");
                }}
                style={styles.smallButton}
              >
                <Text style={styles.buttonText}>View Value</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {activeView === "value" && queryResult.value && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Value for {selectedAddress}:</Text>
          <Text style={styles.resultText}>{queryResult.value}</Text>
        </View>
      )}

      {activeView === "map" && queryResult.map && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Map Contents:</Text>
          {queryResult.map.map(([address, value], index) => (
            <View key={index} style={styles.mapItem}>
              <Text style={styles.mapAddress}>Address: {address}</Text>
              <Text style={styles.mapValue}>Value: {value}</Text>
            </View>
          ))}
        </View>
      )}

      {executeResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Transaction Details:</Text>
          <Text style={styles.resultText}>
            Transaction Hash: {executeResult.transactionHash}
          </Text>
          <Text style={styles.resultText}>
            Block Height: {executeResult.height}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                `https://www.mintscan.io/xion-testnet/tx/${executeResult.transactionHash}?height=${executeResult.height}`
              );
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>View on Mintscan</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = {
  resultCard: {
    backgroundColor: "#111111",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 10,
    color: "#ffffff",
  },
  resultText: {
    fontSize: 14,
    color: "#cccccc",
    marginBottom: 5,
  },
  userRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 10,
  },
  userAddress: {
    flex: 1,
    fontSize: 14,
    color: "#cccccc",
  },
  smallButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    marginLeft: 10,
  },
  mapItem: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  mapAddress: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: "#ffffff",
    marginBottom: 5,
  },
  mapValue: {
    fontSize: 14,
    color: "#cccccc",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500" as const,
  },
  linkButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    alignItems: "center" as const,
  },
  linkText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500" as const,
  },
};
