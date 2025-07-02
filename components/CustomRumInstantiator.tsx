import { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput,
  ScrollView
} from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";

// Constants
const CODE_ID = Number(process.env.EXPO_PUBLIC_CODE_ID);
const VERIFICATION_CONTRACT_ADDRESS =
  process.env.EXPO_PUBLIC_VERIFICATION_CONTRACT_ADDRESS ?? "";

interface CustomRumInstantiatorProps {
  onContractInstantiated: (contractAddress: string, claimKey: string) => void;
}

export default function CustomRumInstantiator({ onContractInstantiated }: CustomRumInstantiatorProps) {
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();

  const [claimKey, setClaimKey] = useState("");
  const [isInstantiating, setIsInstantiating] = useState(false);
  const [instantiatedContracts, setInstantiatedContracts] = useState<Array<{
    address: string;
    claimKey: string;
    label: string;
  }>>([]);

  const instantiateRUMContract = async () => {
    if (!account?.bech32Address || !client) {
      Alert.alert("Error", "Account or client not found");
      return;
    }

    if (!claimKey.trim()) {
      Alert.alert("Error", "Please enter a claim key");
      return;
    }

    if (!VERIFICATION_CONTRACT_ADDRESS) {
      Alert.alert("Error", "Verification contract address not configured");
      return;
    }

    if (!CODE_ID) {
      Alert.alert("Error", "CODE_ID not configured");
      return;
    }

    setIsInstantiating(true);

    try {
      const instantiateMsg = {
        verification_addr: VERIFICATION_CONTRACT_ADDRESS,
        claim_key: claimKey.trim(),
      };

      const label = `rum-${claimKey.trim()}-${Date.now()}`;

      const instantiateResult = await client.instantiate(
        account?.bech32Address,
        CODE_ID,
        instantiateMsg,
        label,
        "auto"
      );

      console.log("RUM contract instantiated:", instantiateResult);
      
      const newContract = {
        address: instantiateResult.contractAddress,
        claimKey: claimKey.trim(),
        label: label,
      };

      setInstantiatedContracts(prev => [...prev, newContract]);
      onContractInstantiated(instantiateResult.contractAddress, claimKey.trim());
      
      Alert.alert(
        "Success", 
        `RUM contract instantiated!\nAddress: ${instantiateResult.contractAddress}\nClaim Key: ${claimKey.trim()}`
      );
      
      setClaimKey(""); // Clear the input
      
    } catch (error) {
      console.log("Error instantiating RUM contract:", error);
      Alert.alert(
        "Error", 
        `Failed to instantiate RUM contract: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsInstantiating(false);
    }
  };

  const selectContract = (contract: { address: string; claimKey: string; label: string }) => {
    onContractInstantiated(contract.address, contract.claimKey);
    Alert.alert("Selected", `Using contract with claim key: ${contract.claimKey}`);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Deploy Custom RUM Contract</Text>
        <Text style={styles.description}>
          Create your own RUM contract with a custom claim key to store specific verified data from Reclaim Protocol.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Claim Key</Text>
          <TextInput
            style={styles.textInput}
            value={claimKey}
            onChangeText={setClaimKey}
            placeholder="e.g., followers_count, account_age, etc."
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            This should match a key in your Reclaim proof's context data
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.instantiateButton, isInstantiating && styles.disabledButton]}
          onPress={instantiateRUMContract}
          disabled={isInstantiating || !claimKey.trim()}
        >
          <Text style={styles.buttonText}>
            {isInstantiating ? "Deploying..." : "Deploy RUM Contract"}
          </Text>
        </TouchableOpacity>

        <View style={styles.configInfo}>
          <Text style={styles.configTitle}>Configuration:</Text>
          <Text style={styles.configText}>Verification Contract: {VERIFICATION_CONTRACT_ADDRESS}</Text>
          <Text style={styles.configText}>Code ID: {CODE_ID}</Text>
        </View>
      </View>

      {instantiatedContracts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Your Deployed Contracts</Text>
          {instantiatedContracts.map((contract, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contractItem}
              onPress={() => selectContract(contract)}
            >
              <View style={styles.contractInfo}>
                <Text style={styles.contractClaimKey}>{contract.claimKey}</Text>
                <Text style={styles.contractAddress}>{formatAddress(contract.address)}</Text>
              </View>
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "#222222",
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: "#888888",
    marginTop: 5,
  },
  instantiateButton: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: "#333333",
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  configInfo: {
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444444",
  },
  configTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  configText: {
    fontSize: 10,
    color: "#888888",
    marginBottom: 2,
  },
  contractItem: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444444",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contractInfo: {
    flex: 1,
  },
  contractClaimKey: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  contractAddress: {
    fontSize: 12,
    color: "#888888",
  },
  selectText: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
  },
}); 