import { useState, useEffect } from "react";
import { Alert } from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion-react-native";
import { retryOperation } from "../utils/retryUtils";
import type { ExecuteResultOrUndefined, QueryResult } from "../types";

if (!process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS) {
  throw new Error(
    "EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS is not set in your environment file"
  );
}

export function useUserMap() {
  // Abstraxion hooks
  const {
    data: account,
    logout,
    login,
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [loading, setLoading] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [executeResult, setExecuteResult] =
    useState<ExecuteResultOrUndefined>(undefined);
  const [queryResult, setQueryResult] = useState<QueryResult>({});
  const [jsonInput, setJsonInput] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");
  const [showValueByUserForm, setShowValueByUserForm] =
    useState<boolean>(false);
  const [showUpdateJsonForm, setShowUpdateJsonForm] = useState<boolean>(true);
  const [addressInput, setAddressInput] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("updateJson");

  const clearResults = () => {
    setQueryResult({});
    setExecuteResult(undefined);
  };

  // Effect to handle account changes
  useEffect(() => {
    if (account?.bech32Address) {
      setShowUpdateJsonForm(true);
      setActiveView("updateJson");
      clearResults();
    }
  }, [account?.bech32Address]);

  // Query functions
  const getUsers = async () => {
    setIsOperationInProgress(true);
    setLoading(true);
    clearResults();
    setActiveView("users");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(
        process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS ?? "",
        { get_users: {} }
      );
      setQueryResult({ users: response });
    } catch (error) {
      Alert.alert("Error", "Error querying users");
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const getMap = async () => {
    setIsOperationInProgress(true);
    setLoading(true);
    clearResults();
    setActiveView("map");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(
        process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS ?? "",
        { get_map: {} }
      );
      setQueryResult({ map: response });
    } catch (error) {
      Alert.alert("Error", "Error querying map");
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const getValueByUser = async (address: string) => {
    setIsOperationInProgress(true);
    setLoading(true);
    clearResults();
    setActiveView("value");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(
        process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS ?? "",
        {
          get_value_by_user: { address },
        }
      );
      setQueryResult({ value: response });
      setSelectedAddress(address);
    } catch (error) {
      Alert.alert("Error", "Error querying value");
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const handleFormatJson = () => {
    if (validateJson(jsonInput)) {
      setJsonInput(formatJson(jsonInput));
    }
  };

  // Update JSON value with retry logic
  const updateValue = async () => {
    if (!validateJson(jsonInput)) {
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setIsTransactionPending(true);
    try {
      if (!client || !account) throw new Error("Client or account not defined");

      // Check balance before proceeding
      const currentBalance = await queryClient?.getBalance(
        account.bech32Address,
        "uxion"
      );
      if (!currentBalance || Number(currentBalance.amount) < 184) {
        Alert.alert(
          "Insufficient Funds",
          `You need at least 0.000184 XION to execute this transaction.\nYour current balance: ${
            Number(currentBalance?.amount || 0) / 1000000
          } XION`
        );
        return;
      }

      const msg = {
        update: {
          value: jsonInput,
        },
      };

      // Execute with retry
      const res = await retryOperation(async () => {
        return await client.execute(
          account.bech32Address,
          process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS ?? "",
          msg,
          "auto"
        );
      });

      setExecuteResult(res);
      console.log("Transaction successful:", res);

      // Show success confirmation
      Alert.alert(
        "Success",
        "Your JSON data has been successfully updated on the blockchain.",
        [{ text: "OK" }]
      );

      // Refresh data with retry
      const updatedData = await retryOperation(async () => {
        if (!queryClient) throw new Error("Query client not available");
        return await queryClient.queryContractSmart(
          process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS ?? "",
          {
            get_value_by_user: {
              address: account.bech32Address,
            },
          }
        );
      });

      if (updatedData && typeof updatedData === "string") {
        setJsonInput(updatedData);
      }
    } catch (error) {
      console.error("Error executing transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Handle specific error cases
      if (errorMessage.includes("insufficient funds")) {
        Alert.alert(
          "Insufficient Funds",
          "You don't have enough XION to cover the transaction fees. Please ensure you have at least 0.000184 XION in your account."
        );
      } else {
        Alert.alert(
          "Error",
          `Failed to update JSON data: ${errorMessage}. Please check your network connection and try again.`
        );
      }
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
      setIsTransactionPending(false);
    }
  };

  const handleShowValueByUserForm = () => {
    setShowValueByUserForm(true);
    setShowUpdateJsonForm(false);
    clearResults();
    setActiveView("valueForm");
  };

  const handleShowUpdateJsonForm = () => {
    setShowUpdateJsonForm(true);
    setShowValueByUserForm(false);
    clearResults();
    setActiveView("updateJson");
  };

  return {
    // State
    loading,
    isOperationInProgress,
    isTransactionPending,
    executeResult,
    queryResult,
    jsonInput,
    setJsonInput,
    selectedAddress,
    jsonError,
    showValueByUserForm,
    showUpdateJsonForm,
    addressInput,
    setAddressInput,
    activeView,
    setActiveView,
    isConnected,
    isConnecting,
    account,

    // Actions
    login,
    getUsers,
    getMap,
    getValueByUser,
    updateValue,
    handleFormatJson,
    handleShowValueByUserForm,
    handleShowUpdateJsonForm,
    clearResults,
  };
}
