import { MetaMaskSDK, SDKProvider } from '@metamask/sdk-react-native';
import { ethers } from 'ethers';
import { Wallet, WalletType, ChainType } from '../../types/wallet';
import { SUPPORTED_CHAINS, isEVMChain } from '../../types/chains';
import { WalletConnector } from './WalletConnector';

export class MetaMaskConnector implements WalletConnector {
  public type: WalletType = WalletType.METAMASK;
  private sdk: MetaMaskSDK;
  private provider: SDKProvider | null = null;
  private ethersProvider: ethers.BrowserProvider | null = null;

  constructor() {
    this.sdk = new MetaMaskSDK({
      dappMetadata: {
        name: 'ProofPay',
        description: 'Multi-chain P2P payments with proof verification',
        url: 'https://proofpay.app',
        iconUrl: 'https://proofpay.app/icon.png',
      },
      enableAnalytics: false,
    });
  }

  async connect(): Promise<Wallet> {
    try {
      await this.sdk.connect();
      this.provider = this.sdk.getProvider();
      
      if (!this.provider) {
        throw new Error('MetaMask provider not available');
      }

      this.ethersProvider = new ethers.BrowserProvider(this.provider);
      
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const chainId = await this.provider.request({
        method: 'eth_chainId',
      });

      const address = accounts[0];
      const numericChainId = parseInt(chainId, 16);

      // Verify this is an EVM chain we support
      if (!isEVMChain(numericChainId)) {
        throw new Error(`Unsupported chain: ${numericChainId}`);
      }

      // Set up event listeners
      this.setupEventListeners();

      return {
        type: WalletType.METAMASK,
        address,
        chainId: numericChainId,
        isConnected: true,
      };
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.sdk.disconnect();
      this.provider = null;
      this.ethersProvider = null;
    } catch (error) {
      console.error('MetaMask disconnect failed:', error);
      throw error;
    }
  }

  async isConnected(address?: string): Promise<boolean> {
    try {
      if (!this.provider) return false;
      
      const accounts = await this.provider.request({
        method: 'eth_accounts',
      });

      if (address) {
        return accounts.includes(address.toLowerCase());
      }

      return accounts && accounts.length > 0;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) {
      throw new Error('MetaMask not connected');
    }

    const accounts = await this.provider.request({
      method: 'eth_accounts',
    });

    return accounts || [];
  }

  async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error('MetaMask not connected');
    }

    const chainId = await this.provider.request({
      method: 'eth_chainId',
    });

    return parseInt(chainId, 16);
  }

  async getBalance(address: string, chainId: string | number): Promise<string> {
    if (!this.ethersProvider) {
      throw new Error('MetaMask not connected');
    }

    // Ensure we're on the right chain
    const currentChainId = await this.getChainId();
    if (currentChainId !== chainId) {
      await this.switchNetwork(chainId as number);
    }

    const balance = await this.ethersProvider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getNativeBalance(address: string, chainId: string | number): Promise<string> {
    return this.getBalance(address, chainId);
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('MetaMask not connected');
    }

    const hexChainId = '0x' + chainId.toString(16);

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        const chainConfig = this.getChainConfig(chainId);
        if (chainConfig) {
          await this.addNetwork(chainConfig);
        } else {
          throw new Error(`Unsupported chain: ${chainId}`);
        }
      } else {
        throw switchError;
      }
    }
  }

  async addNetwork(chainConfig: any): Promise<void> {
    if (!this.provider) {
      throw new Error('MetaMask not connected');
    }

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig],
    });
  }

  async sendTransaction(params: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
  }): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask not connected');
    }

    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts available');
    }

    const txParams: any = {
      from: accounts[0],
      to: params.to,
    };

    if (params.value) {
      txParams.value = '0x' + BigInt(params.value).toString(16);
    }

    if (params.data) {
      txParams.data = params.data;
    }

    if (params.gasLimit) {
      txParams.gas = '0x' + BigInt(params.gasLimit).toString(16);
    }

    const txHash = await this.provider.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });

    return txHash;
  }

  private setupEventListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: string[]) => {
      this.onAccountsChangedCallback?.(accounts);
    });

    this.provider.on('chainChanged', (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      this.onChainChangedCallback?.(numericChainId);
    });

    this.provider.on('disconnect', () => {
      this.onDisconnectCallback?.();
    });
  }

  private onAccountsChangedCallback?: (accounts: string[]) => void;
  private onChainChangedCallback?: (chainId: number) => void;
  private onDisconnectCallback?: () => void;

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    this.onAccountsChangedCallback = callback;
  }

  onChainChanged(callback: (chainId: number) => void): void {
    this.onChainChangedCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  private getChainConfig(chainId: number): any {
    const chainConfigs: Record<number, any> = {
      137: {
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      56: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        },
        rpcUrls: ['https://bsc-dataseed.binance.org'],
        blockExplorerUrls: ['https://bscscan.com'],
      },
      42161: {
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io'],
      },
      43114: {
        chainId: '0xa86a',
        chainName: 'Avalanche',
        nativeCurrency: {
          name: 'AVAX',
          symbol: 'AVAX',
          decimals: 18,
        },
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
        blockExplorerUrls: ['https://snowtrace.io'],
      },
    };

    return chainConfigs[chainId];
  }

  // Utility method to get supported EVM chains
  getSupportedChains(): number[] {
    return Object.values(SUPPORTED_CHAINS)
      .filter(chain => chain.type === ChainType.EVM)
      .map(chain => chain.chainId as number);
  }
}