import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MenuButtons from "@/components/MenuButtons";
import JsonForm from "@/components/JsonForm";
import ValueByUserForm from "@/components/ValueByUserForm";
import QueryResults from "@/components/QueryResults";
import { useUserMap } from "@/hooks/useUserMap";

export default function Index() {
  const {
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
  } = useUserMap();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>User Map Dapp</Text>
      {!isConnected ? (
        <View style={styles.connectButtonContainer}>
          <TouchableOpacity
            onPress={login}
            style={[
              styles.menuButton,
              styles.fullWidthButton,
              isConnecting && styles.disabledButton,
            ]}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          {/* Menu Buttons */}
          <MenuButtons
            onGetUsers={getUsers}
            onGetMap={getMap}
            onGetValueByUser={handleShowValueByUserForm}
            onUpdateJson={handleShowUpdateJsonForm}
            loading={loading}
            isOperationInProgress={isOperationInProgress}
          />

          {/* Results */}
          <View style={styles.resultsContainer}>
            {showValueByUserForm && (
              <ValueByUserForm
                addressInput={addressInput}
                setAddressInput={setAddressInput}
                onGetValueByUser={getValueByUser}
                loading={loading}
                isOperationInProgress={isOperationInProgress}
              />
            )}

            {showUpdateJsonForm && account?.bech32Address && (
              <JsonForm
                jsonInput={jsonInput}
                setJsonInput={setJsonInput}
                jsonError={jsonError}
                onUpdateValue={updateValue}
                onFormatJson={handleFormatJson}
                loading={loading}
                isOperationInProgress={isOperationInProgress}
                isTransactionPending={isTransactionPending}
              />
            )}

            <QueryResults
              activeView={activeView}
              queryResult={queryResult}
              selectedAddress={selectedAddress}
              executeResult={executeResult}
              onGetValueByUser={getValueByUser}
              onSetActiveView={setActiveView}
            />
          </View>
        </View>
      )}
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
  mainContainer: {
    flex: 1,
    gap: 20,
  },
  resultsContainer: {
    flex: 1,
    gap: 20,
    marginBottom: 20,
  },
  connectButtonContainer: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  fullWidthButton: {
    width: "100%",
    maxWidth: "100%",
  },
  menuButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    alignItems: "center",
    flex: 1,
    minWidth: 120,
    maxWidth: "48%",
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
});
