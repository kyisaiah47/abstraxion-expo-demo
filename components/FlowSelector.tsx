import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import ReclaimComponent from "./ReclaimComponent";
import CustomRumInstantiator from "./CustomRumInstantiator";

type FlowType = "default" | "custom";

interface CustomContract {
  address: string;
  claimKey: string;
}

export default function FlowSelector() {
  const [selectedFlow, setSelectedFlow] = useState<FlowType>("default");
  const [customContract, setCustomContract] = useState<CustomContract | null>(null);
  const [showInstantiator, setShowInstantiator] = useState(false);

  const handleContractInstantiated = (contractAddress: string, claimKey: string) => {
    setCustomContract({ address: contractAddress, claimKey });
    setShowInstantiator(false);
  };

  const resetCustomFlow = () => {
    setCustomContract(null);
    setShowInstantiator(false);
  };

  const renderFlowSelector = () => (
    <View style={styles.flowSelectorContainer}>
      <Text style={styles.selectorTitle}>Choose Your Flow</Text>
      
      <View style={styles.flowButtons}>
        <TouchableOpacity
          style={[
            styles.flowButton,
            selectedFlow === "default" && styles.selectedFlowButton
          ]}
          onPress={() => {
            setSelectedFlow("default");
            resetCustomFlow();
          }}
        >
          <Text style={[
            styles.flowButtonText,
            selectedFlow === "default" && styles.selectedFlowButtonText
          ]}>
            Default Flow
          </Text>
          <Text style={styles.flowButtonDescription}>
            Use the pre-configured RUM contract with hardcoded "followers_count" claim key
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.flowButton,
            selectedFlow === "custom" && styles.selectedFlowButton
          ]}
          onPress={() => setSelectedFlow("custom")}
        >
          <Text style={[
            styles.flowButtonText,
            selectedFlow === "custom" && styles.selectedFlowButtonText
          ]}>
            Custom Flow
          </Text>
          <Text style={styles.flowButtonDescription}>
            Deploy your own RUM contract with a custom claim key
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCustomFlowControls = () => (
    <View style={styles.customControlsContainer}>
      {!customContract ? (
        <View style={styles.noContractContainer}>
          <Text style={styles.noContractText}>
            No custom contract selected. Deploy a new one or select an existing one.
          </Text>
          <TouchableOpacity
            style={styles.deployButton}
            onPress={() => setShowInstantiator(!showInstantiator)}
          >
            <Text style={styles.deployButtonText}>
              {showInstantiator ? "Hide Deployer" : "Deploy New Contract"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contractSelectedContainer}>
          <Text style={styles.contractSelectedTitle}>Selected Contract:</Text>
          <Text style={styles.contractSelectedAddress}>
            Address: {customContract.address}
          </Text>
          <Text style={styles.contractSelectedClaimKey}>
            Claim Key: {customContract.claimKey}
          </Text>
          <TouchableOpacity
            style={styles.changeContractButton}
            onPress={resetCustomFlow}
          >
            <Text style={styles.changeContractButtonText}>Change Contract</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (selectedFlow === "default") {
      return <ReclaimComponent isCustomFlow={false} />;
    }

    if (selectedFlow === "custom") {
      if (showInstantiator) {
        return (
          <CustomRumInstantiator onContractInstantiated={handleContractInstantiated} />
        );
      }

      if (customContract) {
        return (
          <ReclaimComponent
            isCustomFlow={true}
            customClaimKey={customContract.claimKey}
            customRumContractAddress={customContract.address}
          />
        );
      }

      return null; // Custom flow controls will be shown instead
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {renderFlowSelector()}
      
      {selectedFlow === "custom" && !showInstantiator && renderCustomFlowControls()}
      
      <View style={styles.contentSection}>
        {renderContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  flowSelectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
    textAlign: "center",
  },
  flowButtons: {
    gap: 10,
  },
  flowButton: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#444444",
  },
  selectedFlowButton: {
    borderColor: "#4caf50",
    backgroundColor: "#0a2a0a",
  },
  flowButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#cccccc",
    marginBottom: 5,
  },
  selectedFlowButtonText: {
    color: "#4caf50",
  },
  flowButtonDescription: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 16,
  },
  customControlsContainer: {
    marginBottom: 20,
  },
  noContractContainer: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444444",
    alignItems: "center",
  },
  noContractText: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 20,
  },
  deployButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deployButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  contractSelectedContainer: {
    backgroundColor: "#0a2a0a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  contractSelectedTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4caf50",
    marginBottom: 8,
  },
  contractSelectedAddress: {
    fontSize: 12,
    color: "#cccccc",
    marginBottom: 4,
  },
  contractSelectedClaimKey: {
    fontSize: 12,
    color: "#cccccc",
    marginBottom: 10,
  },
  changeContractButton: {
    backgroundColor: "#333333",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  changeContractButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  contentSection: {
    backgroundColor: "#111111",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333333",
  },
}); 