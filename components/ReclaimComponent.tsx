import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ReclaimVerification } from "@reclaimprotocol/inapp-rn-sdk";

const reclaimVerification = new ReclaimVerification();

// Constants
const CODE_ID = Number(process.env.EXPO_PUBLIC_CODE_ID);
const VERIFICATION_CONTRACT_ADDRESS =
  process.env.EXPO_PUBLIC_VERIFICATION_CONTRACT_ADDRESS ?? "";
const RUM_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_RUM_CONTRACT_ADDRESS ?? "";

const reclaimConfig = {
  appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID ?? "",
  appSecret: process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET ?? "",
  providerId: process.env.EXPO_PUBLIC_RECLAIM_PROVIDER_ID ?? "",
};

type Status =
  | "idle"
  | "verifying"
  | "verification_complete"
  | "executing"
  | "complete"
  | "error";

interface ReclaimComponentProps {
  isCustomFlow?: boolean;
  customClaimKey?: string;
  customRumContractAddress?: string;
}

export default function ReclaimComponent({ 
  isCustomFlow = false, 
  customClaimKey,
  customRumContractAddress 
}: ReclaimComponentProps) {
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();

  const [proof, setProof] = useState<ReclaimVerification.Response | undefined>(
    undefined
  );
  const [queryResult, setQueryResult] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);

  // Determine which contract address and claim key to use
  const contractAddress = isCustomFlow && customRumContractAddress 
    ? customRumContractAddress 
    : RUM_CONTRACT_ADDRESS;
  
  const claimKey = isCustomFlow && customClaimKey 
    ? customClaimKey 
    : "followers_count"; // Default hardcoded claim key

  const queryRUMContract = async () => {
    if (!client || !contractAddress) {
      console.log("Client or contract address not available for query");
      return;
    }

    try {
      const queryMsg = {
        get_value_by_user: {
          address: account?.bech32Address,
        },
      };

      const result: string = await client.queryContractSmart(
        contractAddress,
        queryMsg
      );

      // Parse the string result to number, handling quoted strings
      const cleanResult = result.replace(/"/g, ""); // Remove quotes
      const parsedResult = parseInt(cleanResult, 10);
      setQueryResult(isNaN(parsedResult) ? undefined : parsedResult);
    } catch (error) {
      console.log("Error querying RUM contract:", error);
      // Don't show alert for initial query, just log the error
    }
  };

  // Query on mount when client is available and we have a contract address
  useEffect(() => {
    if (client && contractAddress) {
      queryRUMContract();
    }
  }, [client, contractAddress]);

  const startVerificationFlow = async () => {
    if (!account?.bech32Address) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!client) {
      Alert.alert("Error", "Client not found");
      return;
    }

    if (!contractAddress) {
      Alert.alert("Error", "No RUM contract address available. Please deploy a contract first.");
      return;
    }

    // Clear previous state if retrying after error
    if (status === "error") {
      setProof(undefined);
      setQueryResult(undefined);
    }

    setLoading(true);
    setStatus("verifying");

    try {
      // Step 1: Verify with Reclaim
      const verificationResult = await reclaimVerification.startVerification({
        appId: reclaimConfig.appId,
        secret: reclaimConfig.appSecret,
        providerId: reclaimConfig.providerId,
      });

      console.log("Verification result:", verificationResult);
      setProof(verificationResult);
      setStatus("verification_complete");

      // Step 2: Execute RUM contract
      setStatus("executing");
      const claimInfo = {
        provider: verificationResult.proofs[0].claimData.provider,
        parameters: verificationResult.proofs[0].claimData.parameters,
        context: verificationResult.proofs[0].claimData.context,
      };

      const signedClaim = {
        claim: {
          identifier: verificationResult.proofs[0].claimData.identifier,
          owner: verificationResult.proofs[0].claimData.owner,
          epoch: verificationResult.proofs[0].claimData.epoch,
          timestampS: verificationResult.proofs[0].claimData.timestampS,
        },
        signatures: verificationResult.proofs[0].signatures,
      };

      const executeMsg = {
        update: {
          value: {
            proof: {
              claimInfo: claimInfo,
              signedClaim: signedClaim,
            },
          },
        },
      };

      const executeResult = await client.execute(
        account?.bech32Address,
        contractAddress,
        executeMsg,
        "auto"
      );

      console.log("RUM contract executed:", executeResult);

      setStatus("complete");

      // Step 3: Query the contract to show updated results
      await queryRUMContract();

      Alert.alert(
        "Success",
        "Complete verification flow finished successfully!"
      );
    } catch (error) {
      console.log("Error in verification flow:", error);
      setStatus("error");

      if (error instanceof ReclaimVerification.ReclaimVerificationException) {
        switch (error.type) {
          case ReclaimVerification.ExceptionType.Cancelled:
            Alert.alert("Cancelled", "Verification was cancelled");
            break;
          case ReclaimVerification.ExceptionType.Dismissed:
            Alert.alert("Dismissed", "Verification was dismissed");
            break;
          case ReclaimVerification.ExceptionType.SessionExpired:
            Alert.alert("Expired", "Verification session expired");
            break;
          case ReclaimVerification.ExceptionType.Failed:
          default:
            Alert.alert("Failed", "Verification failed");
        }
      } else {
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An unknown error occurred during the verification flow"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Ready to start verification";
      case "verifying":
        return "Verifying with Reclaim Protocol...";
      case "verification_complete":
        return "✓ Verification completed";
      case "executing":
        return "Executing RUM contract...";
      case "complete":
        return "✓ Complete verification flow finished!";
      case "error":
        return "❌ Error occurred";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "#cccccc";
      case "verifying":
      case "executing":
        return "#ffaa00";
      case "verification_complete":
      case "complete":
        return "#4caf50";
      case "error":
        return "#ff4444";
      default:
        return "#cccccc";
    }
  };

  const isButtonDisabled = () => {
    return loading || status === "complete" || !contractAddress;
  };

  const getButtonText = () => {
    if (!contractAddress) {
      return "No Contract Available";
    }
    if (loading) {
      return "Processing...";
    }
    if (status === "complete") {
      return "Verification Complete";
    }
    if (status === "error") {
      return "Retry Verification";
    }
    return "Start Verification Flow";
  };

  return (
    <View style={styles.container}>
      {/* Flow type indicator */}
      <View style={styles.flowIndicatorContainer}>
        <Text style={styles.flowIndicatorText}>
          {isCustomFlow ? "Custom Flow" : "Default Flow"}
        </Text>
        {isCustomFlow && customClaimKey && (
          <Text style={styles.claimKeyText}>
            Claim Key: {customClaimKey}
          </Text>
        )}
        <Text style={styles.contractAddressText}>
          Contract: {contractAddress ? `${contractAddress.slice(0, 20)}...` : "Not set"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isButtonDisabled() && styles.disabledButton]}
        onPress={startVerificationFlow}
        disabled={isButtonDisabled()}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {queryResult !== undefined && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            Verified {isCustomFlow ? (customClaimKey || "Value") : "Followers"}:
          </Text>
          <Text style={styles.infoText}>{queryResult}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
  flowIndicatorContainer: {
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444444",
  },
  flowIndicatorText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  claimKeyText: {
    fontSize: 12,
    color: "#cccccc",
    marginBottom: 2,
  },
  contractAddressText: {
    fontSize: 10,
    color: "#888888",
  },
  button: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#333333",
    opacity: 0.6,
  },
  statusContainer: {
    backgroundColor: "#111111",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoContainer: {
    backgroundColor: "#111111",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#cccccc",
  },
});
