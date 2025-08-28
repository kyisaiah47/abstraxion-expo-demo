// Shared types for multi-chain ProofPay system
export enum WalletType {
  ABSTRAXION = 'abstraxion',
  METAMASK = 'metamask', 
  WALLETCONNECT = 'walletconnect',
  KEPLR = 'keplr'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export enum ProofType {
  NONE = 'none',
  TEXT = 'text',
  PHOTO = 'photo', 
  ZKTLS = 'zktls',
  HYBRID = 'hybrid'
}

export enum ChainType {
  EVM = 'evm',
  COSMOS = 'cosmos'
}

export interface Chain {
  chainId: string | number;
  name: string;
  type: ChainType;
  rpcUrl: string;
  addressPrefix?: string;
  ccipChainSelector?: string;
  deploymentAddress?: string;
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  addresses: Record<string, string>; // chainId -> address
  createdAt: Date;
}

export interface Payment {
  id: string;
  sender: string;
  recipient: string;
  senderUsername?: string;
  recipientUsername?: string;
  amount: string;
  token: string;
  tokenSymbol?: string;
  chainId: string | number;
  status: PaymentStatus;
  proofType?: ProofType;
  proofData?: any;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CrossChainPayment {
  id: string;
  sourcePaymentId: string;
  destinationPaymentId?: string;
  bridgeProvider: string;
  bridgeTxHash?: string;
  sourceChainId: string | number;
  destinationChainId: string | number;
  bridgeFee?: string;
  status: PaymentStatus;
  createdAt: Date;
  completedAt?: Date;
}

export interface Wallet {
  type: WalletType;
  address: string;
  chainId: string | number;
  isConnected: boolean;
}

export interface ConnectedWallet extends Wallet {
  balance?: string;
  nativeBalance?: string;
}

export interface PaymentParams {
  recipient: string;
  amount: string;
  token: string;
  description?: string;
  proofType?: ProofType;
  proofData?: any;
}

export interface CrossChainParams extends PaymentParams {
  destinationChainId: string | number;
  bridgeProvider: string;
  estimatedFee?: string;
}

export interface MultiChainBalance {
  chainId: string | number;
  nativeBalance: string;
  nativeSymbol: string;
  tokenBalances: TokenBalance[];
  totalUsdValue?: string;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: string;
}

export interface ProofVerification {
  paymentId: string;
  proofType: ProofType;
  proofHash?: string;
  verificationResult: any;
  verifiedAt: Date;
  verifierAddress?: string;
}

export interface Friend {
  userId: string;
  friendId: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  addresses: Record<string, string>;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event types for WebSocket
export interface PaymentEvent {
  type: 'payment:created' | 'payment:completed' | 'payment:disputed';
  paymentId: string;
  chainId: string | number;
  data: Partial<Payment>;
}

export interface BalanceEvent {
  type: 'balance:updated';
  address: string;
  chainId: string | number;
  balance: MultiChainBalance;
}

export interface CrossChainEvent {
  type: 'bridge:initiated' | 'bridge:completed' | 'bridge:failed';
  crossChainPaymentId: string;
  sourceChainId: string | number;
  destinationChainId: string | number;
  data: Partial<CrossChainPayment>;
}

export type WebSocketEvent = PaymentEvent | BalanceEvent | CrossChainEvent;