// Base interface for all wallet connectors
import { Wallet, WalletType } from '../../types/wallet';

export interface WalletConnector {
  type: WalletType;
  
  // Connection management
  connect(): Promise<Wallet>;
  disconnect(): Promise<void>;
  isConnected(address?: string): Promise<boolean>;
  
  // Account information
  getAccounts(): Promise<string[]>;
  getChainId(): Promise<string | number>;
  
  // Balance queries
  getBalance(address: string, chainId: string | number): Promise<string>;
  getNativeBalance(address: string, chainId: string | number): Promise<string>;
  
  // Network operations
  switchNetwork?(chainId: string | number): Promise<void>;
  addNetwork?(chainConfig: any): Promise<void>;
  
  // Transaction operations
  sendTransaction?(params: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
  }): Promise<string>;
  
  // Event handlers
  onAccountsChanged?(callback: (accounts: string[]) => void): void;
  onChainChanged?(callback: (chainId: string | number) => void): void;
  onDisconnect?(callback: () => void): void;
}