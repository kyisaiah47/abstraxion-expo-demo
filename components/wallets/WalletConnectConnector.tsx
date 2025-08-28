import { createWeb3Modal, defaultConfig } from '@walletconnect/modal-react-native';
import { ethers } from 'ethers';
import { Wallet, WalletType, ChainType } from '../../types/wallet';
import { SUPPORTED_CHAINS, EVM_CHAINS } from '../../types/chains';
import { WalletConnector } from './WalletConnector';

export class WalletConnectConnector implements WalletConnector {
  public type: WalletType = WalletType.WALLETCONNECT;
  private web3Modal: any;
  private provider: any;
  private ethersProvider: ethers.BrowserProvider | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeModal();
  }

  private initializeModal(): void {
    if (this.isInitialized) return;

    const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID;
    if (!projectId) {
      throw new Error('WalletConnect Project ID not configured');
    }

    // Configure supported chains
    const chains = EVM_CHAINS.map(chain => ({
      chainId: chain.chainId as number,
      name: chain.name,
      currency: this.getNativeCurrency(chain.chainId as number),
      explorerUrl: this.getExplorerUrl(chain.chainId as number),
      rpcUrl: chain.rpcUrl,
    }));

    const config = defaultConfig({
      metadata: {
        name: 'ProofPay',
        description: 'Multi-chain P2P payments with proof verification',
        url: 'https://proofpay.app',
        icons: ['https://proofpay.app/icon.png'],
      },
      chains,
    });

    this.web3Modal = createWeb3Modal({
      projectId,
      config,
      chains,
      enableAnalytics: false,
    });

    this.setupEventListeners();
    this.isInitialized = true;
  }

  async connect(): Promise<Wallet> {
    try {
      if (!this.web3Modal) {
        throw new Error('WalletConnect not initialized');
      }

      await this.web3Modal.open();
      
      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 30000); // 30 second timeout

        const checkConnection = async () => {
          try {
            const provider = this.web3Modal.getWalletProvider();
            if (provider) {
              clearTimeout(timeout);
              
              this.provider = provider;
              this.ethersProvider = new ethers.BrowserProvider(provider);

              const accounts = await provider.request({
                method: 'eth_requestAccounts',
              });

              if (!accounts || accounts.length === 0) {
                throw new Error('No accounts available');
              }

              const chainId = await provider.request({
                method: 'eth_chainId',
              });

              const address = accounts[0];
              const numericChainId = parseInt(chainId, 16);

              resolve({
                type: WalletType.WALLETCONNECT,
                address,
                chainId: numericChainId,
                isConnected: true,
              });
            } else {
              setTimeout(checkConnection, 100);
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        checkConnection();
      });
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.web3Modal) {
        await this.web3Modal.disconnect();
      }
      this.provider = null;
      this.ethersProvider = null;
    } catch (error) {
      console.error('WalletConnect disconnect failed:', error);
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
        return accounts.some((acc: string) => acc.toLowerCase() === address.toLowerCase());
      }

      return accounts && accounts.length > 0;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) {
      throw new Error('WalletConnect not connected');
    }

    const accounts = await this.provider.request({
      method: 'eth_accounts',
    });

    return accounts || [];
  }

  async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error('WalletConnect not connected');
    }

    const chainId = await this.provider.request({
      method: 'eth_chainId',
    });

    return parseInt(chainId, 16);
  }

  async getBalance(address: string, chainId: string | number): Promise<string> {
    if (!this.ethersProvider) {
      throw new Error('WalletConnect not connected');
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
      throw new Error('WalletConnect not connected');
    }

    const hexChainId = '0x' + chainId.toString(16);

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Chain not added
      if (switchError.code === 4902) {
        const chainConfig = this.getChainConfig(chainId);
        if (chainConfig) {
          await this.addNetwork(chainConfig);
          // Try switching again after adding
          await this.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
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
      throw new Error('WalletConnect not connected');
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
      throw new Error('WalletConnect not connected');
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
    if (!this.web3Modal) return;

    this.web3Modal.subscribeProvider((provider: any) => {
      if (provider) {
        provider.on('accountsChanged', (accounts: string[]) => {
          this.onAccountsChangedCallback?.(accounts);
        });

        provider.on('chainChanged', (chainId: string) => {
          const numericChainId = parseInt(chainId, 16);
          this.onChainChangedCallback?.(numericChainId);
        });

        provider.on('disconnect', () => {
          this.onDisconnectCallback?.();
        });
      }
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

  private getNativeCurrency(chainId: number): string {
    const currencies: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      43114: 'AVAX',
    };

    return currencies[chainId] || 'ETH';
  }

  private getExplorerUrl(chainId: number): string {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      43114: 'https://snowtrace.io',
    };

    return explorers[chainId] || 'https://etherscan.io';
  }

  // Utility methods
  getSupportedChains(): number[] {
    return EVM_CHAINS.map(chain => chain.chainId as number);
  }

  // Get modal instance for direct UI control
  getModal() {
    return this.web3Modal;
  }
}