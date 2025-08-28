import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useWallet } from './wallets/WalletManager';
import { chainService } from '../services/blockchain/ChainService';
import { WalletType, PaymentParams, CrossChainParams } from '../packages/shared/types';
import { SUPPORTED_CHAINS, getChainById } from '../packages/shared/chains';

interface MultiChainPaymentFormProps {
  onPaymentComplete?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export const MultiChainPaymentForm: React.FC<MultiChainPaymentFormProps> = ({
  onPaymentComplete,
  onError,
}) => {
  const { connectedWallets, activeWallet, connectWallet } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS.XION);
  const [isProcessing, setIsProcessing] = useState(false);
  const [crossChainFee, setCrossChainFee] = useState<string>('');

  // Example component showing how to use the multi-chain system
  const handleWalletConnection = async (walletType: WalletType) => {
    try {
      await connectWallet(walletType);
    } catch (error) {
      Alert.alert('Connection Failed', `Failed to connect ${walletType} wallet`);
    }
  };

  const estimateCrossChainFee = async () => {
    if (!activeWallet || !recipient || !amount) return;

    try {
      const currentChain = getChainById(activeWallet.chainId);
      if (!currentChain || currentChain.chainId === selectedChain.chainId) {
        setCrossChainFee('');
        return;
      }

      const fee = await chainService.estimateCrossChainFee(
        activeWallet.chainId,
        selectedChain.chainId,
        amount
      );

      setCrossChainFee(fee);
    } catch (error) {
      console.warn('Failed to estimate cross-chain fee:', error);
    }
  };

  useEffect(() => {
    estimateCrossChainFee();
  }, [activeWallet, selectedChain, amount, recipient]);

  const handlePayment = async () => {
    if (!activeWallet || !recipient || !amount) {
      Alert.alert('Error', 'Please fill all fields and connect a wallet');
      return;
    }

    setIsProcessing(true);

    try {
      const currentChain = getChainById(activeWallet.chainId);
      const isCrossChain = currentChain?.chainId !== selectedChain.chainId;

      let txHash: string;

      if (isCrossChain) {
        // Cross-chain payment
        const crossChainParams: CrossChainParams = {
          recipient,
          amount,
          token: undefined, // Native token
          destinationChainId: selectedChain.chainId,
          bridgeProvider: 'ccip', // or 'ibc' for Cosmos chains
        };

        txHash = await chainService.sendCrossChainTransaction({
          sourceChainId: activeWallet.chainId,
          destinationChainId: selectedChain.chainId,
          from: activeWallet.address,
          to: recipient,
          amount,
        });
      } else {
        // Same-chain payment
        txHash = await chainService.sendTransaction({
          from: activeWallet.address,
          to: recipient,
          amount,
          chainId: activeWallet.chainId,
        });
      }

      onPaymentComplete?.(txHash);
      Alert.alert('Success', `Payment sent! Transaction: ${txHash.slice(0, 10)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError?.(errorMessage);
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Chain Payment</Text>

      {/* Wallet Status */}
      <View style={styles.walletStatus}>
        {activeWallet ? (
          <Text style={styles.connectedWallet}>
            Connected: {activeWallet.type} ({chainService.formatAddress(activeWallet.address)})
          </Text>
        ) : (
          <View style={styles.walletButtons}>
            <Text>Connect a wallet:</Text>
            {Object.values(WalletType).map((walletType) => (
              <button
                key={walletType}
                onPress={() => handleWalletConnection(walletType)}
                style={styles.walletButton}
              >
                <Text>{walletType}</Text>
              </button>
            ))}
          </View>
        )}
      </View>

      {/* Payment Form */}
      {activeWallet && (
        <>
          {/* Recipient Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Address</Text>
            <input
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Enter recipient address or username"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <input
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              keyboardType="numeric"
            />
          </View>

          {/* Chain Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination Chain</Text>
            <picker
              selectedValue={selectedChain.chainId}
              onValueChange={(chainId) => {
                const chain = getChainById(chainId);
                if (chain) setSelectedChain(chain);
              }}
            >
              {Object.values(SUPPORTED_CHAINS).map((chain) => (
                <Picker.Item
                  key={chain.chainId}
                  label={chain.name}
                  value={chain.chainId}
                />
              ))}
            </picker>
          </View>

          {/* Cross-Chain Fee Display */}
          {crossChainFee && (
            <View style={styles.feeDisplay}>
              <Text style={styles.feeText}>
                Cross-chain fee: ~{crossChainFee} {chainService.getNativeSymbol(getChainById(activeWallet.chainId)!)}
              </Text>
            </View>
          )}

          {/* Send Button */}
          <button
            onPress={handlePayment}
            disabled={isProcessing || !recipient || !amount}
            style={[
              styles.sendButton,
              (isProcessing || !recipient || !amount) && styles.disabledButton,
            ]}
          >
            <Text style={styles.sendButtonText}>
              {isProcessing
                ? 'Processing...'
                : crossChainFee
                ? `Send Cross-Chain Payment`
                : 'Send Payment'}
            </Text>
          </button>

          {/* Balance Display */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>
              Balance: {activeWallet.balance || '0'}{' '}
              {chainService.getNativeSymbol(getChainById(activeWallet.chainId)!)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  walletStatus: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  connectedWallet: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  walletButtons: {
    gap: 10,
  },
  walletButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  feeDisplay: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  feeText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
  },
});

export default MultiChainPaymentForm;