import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useWallet } from './wallets/WalletManager';
import { chainService } from '../services/blockchain/ChainService';
import { Chain, ChainType } from '../packages/shared/types';
import { SUPPORTED_CHAINS, EVM_CHAINS, COSMOS_CHAINS } from '../packages/shared/chains';

interface ChainSwitcherProps {
  onChainSwitch?: (chain: Chain) => void;
}

export const ChainSwitcher: React.FC<ChainSwitcherProps> = ({ onChainSwitch }) => {
  const { activeWallet, connectedWallets, switchActiveWallet } = useWallet();

  const handleChainSwitch = async (targetChain: Chain) => {
    if (!activeWallet) {
      Alert.alert('No Wallet', 'Please connect a wallet first');
      return;
    }

    try {
      // Check if we have a wallet connected for this chain type
      const compatibleWallet = connectedWallets.find(wallet => {
        if (targetChain.type === ChainType.EVM) {
          return wallet.type === 'metamask' || wallet.type === 'walletconnect';
        } else {
          return wallet.type === 'keplr' || wallet.type === 'abstraxion';
        }
      });

      if (!compatibleWallet) {
        Alert.alert(
          'Incompatible Wallet',
          `Your current wallet doesn't support ${targetChain.name}. Please connect a compatible wallet.`
        );
        return;
      }

      // Switch to compatible wallet if needed
      if (activeWallet.type !== compatibleWallet.type) {
        switchActiveWallet(compatibleWallet);
      }

      // Switch chain in the service
      await chainService.switchChain(targetChain.chainId);
      
      onChainSwitch?.(targetChain);
      
      Alert.alert('Success', `Switched to ${targetChain.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch chain';
      Alert.alert('Switch Failed', errorMessage);
    }
  };

  const isChainActive = (chain: Chain) => {
    if (!activeWallet) return false;
    return activeWallet.chainId === chain.chainId;
  };

  const isChainSupported = (chain: Chain) => {
    if (!activeWallet) return true;
    
    if (chain.type === ChainType.EVM) {
      return activeWallet.type === 'metamask' || activeWallet.type === 'walletconnect';
    } else {
      return activeWallet.type === 'keplr' || activeWallet.type === 'abstraxion';
    }
  };

  const renderChainGroup = (title: string, chains: Chain[]) => (
    <View style={styles.chainGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainScroll}>
        {chains.map((chain) => (
          <TouchableOpacity
            key={chain.chainId}
            style={[
              styles.chainButton,
              isChainActive(chain) && styles.activeChain,
              !isChainSupported(chain) && styles.unsupportedChain,
            ]}
            onPress={() => handleChainSwitch(chain)}
            disabled={!isChainSupported(chain)}
          >
            <View style={styles.chainInfo}>
              <Text style={[
                styles.chainName,
                isChainActive(chain) && styles.activeChainText,
                !isChainSupported(chain) && styles.unsupportedChainText,
              ]}>
                {chain.name}
              </Text>
              <Text style={[
                styles.chainType,
                isChainActive(chain) && styles.activeChainText,
                !isChainSupported(chain) && styles.unsupportedChainText,
              ]}>
                {chain.type.toUpperCase()}
              </Text>
              {isChainActive(chain) && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeIndicatorText}>●</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Chain</Text>
      
      {activeWallet && (
        <View style={styles.currentWallet}>
          <Text style={styles.currentWalletText}>
            Active: {activeWallet.type} - {chainService.formatAddress(activeWallet.address)}
          </Text>
        </View>
      )}

      {renderChainGroup('EVM Chains', EVM_CHAINS)}
      {renderChainGroup('Cosmos Chains', COSMOS_CHAINS)}

      {!activeWallet && (
        <View style={styles.noWalletMessage}>
          <Text style={styles.noWalletText}>
            Connect a wallet to switch between chains
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
    color: '#333',
  },
  currentWallet: {
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  currentWalletText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chainGroup: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 20,
    color: '#555',
  },
  chainScroll: {
    paddingLeft: 20,
  },
  chainButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeChain: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  unsupportedChain: {
    backgroundColor: '#fafafa',
    borderColor: '#e0e0e0',
  },
  chainInfo: {
    alignItems: 'center',
    position: 'relative',
  },
  chainName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  chainType: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeChainText: {
    color: '#1976d2',
  },
  unsupportedChainText: {
    color: '#bbb',
  },
  activeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  activeIndicatorText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noWalletMessage: {
    padding: 20,
    alignItems: 'center',
  },
  noWalletText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ChainSwitcher;