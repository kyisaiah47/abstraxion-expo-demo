import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { WalletType, ConnectedWallet } from '../../packages/shared/types';

interface WalletContextType {
  connectedWallets: ConnectedWallet[];
  activeWallet: ConnectedWallet | null;
  isConnecting: boolean;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: (type: WalletType) => Promise<void>;
  switchActiveWallet: (wallet: ConnectedWallet) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface SimpleWalletManagerProps {
  children: React.ReactNode;
}

export const SimpleWalletManager: React.FC<SimpleWalletManagerProps> = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async (type: WalletType): Promise<void> => {
    setIsConnecting(true);
    try {
      // Show informational alert for now
      Alert.alert(
        'Wallet Connection',
        `${type} wallet connection will be available in the next update. The multi-chain infrastructure is ready!`,
        [{ text: 'OK' }]
      );
      
      // For demo purposes, create a mock connected wallet
      const mockWallet: ConnectedWallet = {
        type,
        address: `mock-${type.toLowerCase()}-address-123`,
        chainId: type === WalletType.KEPLR || type === WalletType.ABSTRAXION ? 'xion-testnet-2' : '1',
        balance: '1000000',
        nativeBalance: '1.5',
      };

      setConnectedWallets(prev => {
        const filtered = prev.filter(w => w.type !== type);
        return [...filtered, mockWallet];
      });

      setActiveWallet(mockWallet);
      
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', `Failed to connect ${type} wallet`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async (type: WalletType): Promise<void> => {
    try {
      setConnectedWallets(prev => prev.filter(w => w.type !== type));
      
      if (activeWallet && activeWallet.type === type) {
        const remainingWallets = connectedWallets.filter(w => w.type !== type);
        setActiveWallet(remainingWallets.length > 0 ? remainingWallets[0] : null);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const switchActiveWallet = (wallet: ConnectedWallet) => {
    setActiveWallet(wallet);
  };

  const contextValue: WalletContextType = {
    connectedWallets,
    activeWallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchActiveWallet,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a SimpleWalletManager');
  }
  return context;
};

export default SimpleWalletManager;