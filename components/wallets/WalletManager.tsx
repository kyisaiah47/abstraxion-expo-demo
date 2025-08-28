import React, { createContext, useContext, useEffect, useState } from 'react';
import { WalletType, Wallet, ConnectedWallet } from '../../packages/shared/types';
import { AbstraxionConnector } from './AbstraxionConnector';
import { MetaMaskConnector } from './MetaMaskConnector';  
import { WalletConnectConnector } from './WalletConnectConnector';
import { KeplrConnector } from './KeplrConnector';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletContextType {
  connectedWallets: ConnectedWallet[];
  activeWallet: ConnectedWallet | null;
  isConnecting: boolean;
  connectWallet: (type: WalletType) => Promise<ConnectedWallet>;
  disconnectWallet: (type: WalletType) => Promise<void>;
  switchActiveWallet: (wallet: ConnectedWallet) => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletManagerProps {
  children: React.ReactNode;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Wallet connectors
  const abstraxionConnector = new AbstraxionConnector();
  const metaMaskConnector = new MetaMaskConnector();
  const walletConnectConnector = new WalletConnectConnector();
  const keplrConnector = new KeplrConnector();

  const getConnector = (type: WalletType) => {
    switch (type) {
      case WalletType.ABSTRAXION:
        return abstraxionConnector;
      case WalletType.METAMASK:
        return metaMaskConnector;
      case WalletType.WALLETCONNECT:
        return walletConnectConnector;
      case WalletType.KEPLR:
        return keplrConnector;
      default:
        throw new Error(`Unknown wallet type: ${type}`);
    }
  };

  const connectWallet = async (type: WalletType): Promise<ConnectedWallet> => {
    setIsConnecting(true);
    try {
      const connector = getConnector(type);
      const wallet = await connector.connect();
      
      const connectedWallet: ConnectedWallet = {
        ...wallet,
        balance: await connector.getBalance(wallet.address, wallet.chainId),
        nativeBalance: await connector.getNativeBalance(wallet.address, wallet.chainId),
      };

      // Update connected wallets list
      setConnectedWallets(prev => {
        const filtered = prev.filter(w => w.type !== type);
        return [...filtered, connectedWallet];
      });

      // Set as active if no active wallet
      if (!activeWallet) {
        setActiveWallet(connectedWallet);
      }

      // Persist connection
      await persistWalletConnection(connectedWallet);

      return connectedWallet;
    } catch (error) {
      console.error(`Failed to connect ${type} wallet:`, error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async (type: WalletType): Promise<void> => {
    try {
      const connector = getConnector(type);
      await connector.disconnect();

      // Remove from connected wallets
      setConnectedWallets(prev => prev.filter(w => w.type !== type));

      // If this was the active wallet, set a new one or null
      if (activeWallet?.type === type) {
        const remainingWallets = connectedWallets.filter(w => w.type !== type);
        setActiveWallet(remainingWallets[0] || null);
      }

      // Remove persisted connection
      await removeWalletConnection(type);
    } catch (error) {
      console.error(`Failed to disconnect ${type} wallet:`, error);
      throw error;
    }
  };

  const switchActiveWallet = (wallet: ConnectedWallet) => {
    setActiveWallet(wallet);
    persistActiveWallet(wallet);
  };

  const refreshBalances = async (): Promise<void> => {
    const updatedWallets = await Promise.all(
      connectedWallets.map(async (wallet) => {
        try {
          const connector = getConnector(wallet.type);
          const balance = await connector.getBalance(wallet.address, wallet.chainId);
          const nativeBalance = await connector.getNativeBalance(wallet.address, wallet.chainId);
          
          return {
            ...wallet,
            balance,
            nativeBalance,
          };
        } catch (error) {
          console.error(`Failed to refresh balance for ${wallet.type}:`, error);
          return wallet;
        }
      })
    );

    setConnectedWallets(updatedWallets);

    // Update active wallet if it's in the list
    if (activeWallet) {
      const updatedActiveWallet = updatedWallets.find(w => w.type === activeWallet.type);
      if (updatedActiveWallet) {
        setActiveWallet(updatedActiveWallet);
      }
    }
  };

  // Persistence helpers
  const persistWalletConnection = async (wallet: ConnectedWallet) => {
    try {
      const key = `wallet_connection_${wallet.type}`;
      await AsyncStorage.setItem(key, JSON.stringify(wallet));
    } catch (error) {
      console.error('Failed to persist wallet connection:', error);
    }
  };

  const removeWalletConnection = async (type: WalletType) => {
    try {
      const key = `wallet_connection_${type}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove wallet connection:', error);
    }
  };

  const persistActiveWallet = async (wallet: ConnectedWallet) => {
    try {
      await AsyncStorage.setItem('active_wallet', JSON.stringify(wallet));
    } catch (error) {
      console.error('Failed to persist active wallet:', error);
    }
  };

  const loadPersistedConnections = async () => {
    try {
      const walletTypes = [WalletType.ABSTRAXION, WalletType.METAMASK, WalletType.WALLETCONNECT, WalletType.KEPLR];
      const persistedWallets: ConnectedWallet[] = [];

      for (const type of walletTypes) {
        try {
          const key = `wallet_connection_${type}`;
          const storedWallet = await AsyncStorage.getItem(key);
          
          if (storedWallet) {
            const wallet: ConnectedWallet = JSON.parse(storedWallet);
            
            // Verify wallet is still connected
            const connector = getConnector(type);
            const isStillConnected = await connector.isConnected(wallet.address);
            
            if (isStillConnected) {
              // Refresh balance
              const balance = await connector.getBalance(wallet.address, wallet.chainId);
              const nativeBalance = await connector.getNativeBalance(wallet.address, wallet.chainId);
              
              persistedWallets.push({
                ...wallet,
                balance,
                nativeBalance,
              });
            } else {
              // Remove stale connection
              await removeWalletConnection(type);
            }
          }
        } catch (error) {
          console.error(`Failed to load persisted ${type} wallet:`, error);
          await removeWalletConnection(type);
        }
      }

      setConnectedWallets(persistedWallets);

      // Load active wallet
      try {
        const activeWalletData = await AsyncStorage.getItem('active_wallet');
        if (activeWalletData) {
          const activeWalletInfo = JSON.parse(activeWalletData);
          const activeWallet = persistedWallets.find(w => w.type === activeWalletInfo.type);
          if (activeWallet) {
            setActiveWallet(activeWallet);
          } else {
            await AsyncStorage.removeItem('active_wallet');
          }
        } else if (persistedWallets.length > 0) {
          // Default to first wallet if none is set as active
          setActiveWallet(persistedWallets[0]);
        }
      } catch (error) {
        console.error('Failed to load active wallet:', error);
      }
    } catch (error) {
      console.error('Failed to load persisted wallet connections:', error);
    }
  };

  // Load persisted connections on mount
  useEffect(() => {
    loadPersistedConnections();
  }, []);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    if (connectedWallets.length > 0) {
      const interval = setInterval(refreshBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [connectedWallets.length]);

  const contextValue: WalletContextType = {
    connectedWallets,
    activeWallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchActiveWallet,
    refreshBalances,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletManager');
  }
  return context;
};

export default WalletManager;