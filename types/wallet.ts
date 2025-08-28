// Wallet types for local use
export enum WalletType {
  KEPLR = 'keplr',
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect',
  ABSTRAXION = 'abstraxion',
}

export interface Wallet {
  type: WalletType;
  address: string;
  name?: string;
  chainId?: string;
  balance?: string;
}

export interface ConnectedWallet {
  type: WalletType;
  address: string;
  name?: string;
  chainId?: string;
  isActive?: boolean;
}

export interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: {
    coinType: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }>;
  feeCurrencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    gasPriceStep?: {
      low: number;
      average: number;
      high: number;
    };
  }>;
  stakeCurrency: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  };
}

export interface PaymentRequest {
  id: string;
  amount: string;
  currency: string;
  recipient: string;
  chainId: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export enum ChainType {
  COSMOS = 'cosmos',
  EVM = 'ethereum',
}

export interface Chain {
  id: string;
  name: string;
  type: ChainType;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export interface TokenBalance {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
  usdValue?: number;
}

export interface MultiChainBalance {
  [chainId: string]: {
    native: TokenBalance;
    tokens: TokenBalance[];
    totalUsdValue: number;
  };
}