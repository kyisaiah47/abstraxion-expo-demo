import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import { Keplr } from '@keplr-wallet/types';
import { Wallet, WalletType, ChainType } from '../../types/wallet';
import { SUPPORTED_CHAINS, COSMOS_CHAINS } from '../../types/chains';
import { WalletConnector } from './WalletConnector';

declare global {
  interface Window {
    keplr: Keplr;
  }
}

export class KeplrConnector implements WalletConnector {
  public type: WalletType = WalletType.KEPLR;
  private keplr: Keplr | null = null;
  private client: SigningCosmWasmClient | null = null;
  private currentChainId: string = 'xion-testnet-1';

  constructor() {
    this.checkKeplrAvailability();
  }

  private checkKeplrAvailability(): void {
    if (typeof window !== 'undefined' && window.keplr) {
      this.keplr = window.keplr;
    }
  }

  async connect(): Promise<Wallet> {
    try {
      if (!this.keplr) {
        // Try to get Keplr again in case it loaded after constructor
        this.checkKeplrAvailability();
        
        if (!this.keplr) {
          throw new Error('Keplr wallet not installed');
        }
      }

      // Default to XION chain
      const chainId = this.currentChainId;
      
      // Add chain if not already added
      await this.addChainIfNeeded(chainId);

      // Enable the chain
      await this.keplr.enable(chainId);

      // Get the offline signer
      const offlineSigner = this.keplr.getOfflineSigner(chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const address = accounts[0].address;

      // Create signing client
      const chainConfig = COSMOS_CHAINS.find(c => c.chainId === chainId);
      if (!chainConfig) {
        throw new Error(`Chain config not found for ${chainId}`);
      }

      this.client = await SigningCosmWasmClient.connectWithSigner(
        chainConfig.rpcUrl,
        offlineSigner,
        {
          gasPrice: GasPrice.fromString('0.025uxion'), // Default gas price
        }
      );

      // Set up event listeners
      this.setupEventListeners();

      return {
        type: WalletType.KEPLR,
        address,
        chainId,
        isConnected: true,
      };
    } catch (error) {
      console.error('Keplr connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Keplr doesn't have a direct disconnect method
      // We'll just clear our client reference
      this.client = null;
    } catch (error) {
      console.error('Keplr disconnect failed:', error);
      throw error;
    }
  }

  async isConnected(address?: string): Promise<boolean> {
    try {
      if (!this.keplr) return false;

      const key = await this.keplr.getKey(this.currentChainId);
      
      if (address) {
        return key.bech32Address.toLowerCase() === address.toLowerCase();
      }

      return !!key.bech32Address;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this.keplr) {
      throw new Error('Keplr not connected');
    }

    try {
      const key = await this.keplr.getKey(this.currentChainId);
      return [key.bech32Address];
    } catch (error) {
      console.error('Failed to get Keplr accounts:', error);
      return [];
    }
  }

  async getChainId(): Promise<string> {
    return this.currentChainId;
  }

  async getBalance(address: string, chainId: string | number): Promise<string> {
    if (!this.client) {
      throw new Error('Keplr client not initialized');
    }

    // Switch chain if needed
    if (chainId !== this.currentChainId) {
      await this.switchNetwork(chainId as string);
    }

    try {
      const balance = await this.client.getBalance(address, this.getNativeDenom(chainId as string));
      return (parseInt(balance.amount) / 1000000).toString(); // Convert from micro units
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async getNativeBalance(address: string, chainId: string | number): Promise<string> {
    return this.getBalance(address, chainId);
  }

  async switchNetwork(chainId: string): Promise<void> {
    if (!this.keplr) {
      throw new Error('Keplr not connected');
    }

    try {
      // Add chain if needed
      await this.addChainIfNeeded(chainId);
      
      // Enable the new chain
      await this.keplr.enable(chainId);
      
      // Update current chain
      this.currentChainId = chainId;
      
      // Recreate client for new chain
      const offlineSigner = this.keplr.getOfflineSigner(chainId);
      const chainConfig = COSMOS_CHAINS.find(c => c.chainId === chainId);
      
      if (chainConfig) {
        this.client = await SigningCosmWasmClient.connectWithSigner(
          chainConfig.rpcUrl,
          offlineSigner,
          {
            gasPrice: GasPrice.fromString(`0.025${this.getNativeDenom(chainId)}`),
          }
        );
      }

      // Notify chain change
      this.onChainChangedCallback?.(chainId);
    } catch (error) {
      console.error('Failed to switch Keplr network:', error);
      throw error;
    }
  }

  private async addChainIfNeeded(chainId: string): Promise<void> {
    if (!this.keplr) return;

    try {
      // Try to get chain info - if it fails, we need to add it
      await this.keplr.getKey(chainId);
    } catch (error) {
      // Chain not added, let's add it
      const chainConfig = this.getChainConfig(chainId);
      if (chainConfig) {
        await this.keplr.experimentalSuggestChain(chainConfig);
      }
    }
  }

  private getChainConfig(chainId: string): any {
    const configs: Record<string, any> = {
      'xion-testnet-1': {
        chainId: 'xion-testnet-1',
        chainName: 'XION Testnet',
        rpc: 'https://rpc.xion-testnet-2.burnt.com:443',
        rest: 'https://api.xion-testnet-2.burnt.com:443',
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'xion',
          bech32PrefixAccPub: 'xionpub',
          bech32PrefixValAddr: 'xionvaloper',
          bech32PrefixValPub: 'xionvaloperpub',
          bech32PrefixConsAddr: 'xionvalcons',
          bech32PrefixConsPub: 'xionvalconspub',
        },
        currencies: [
          {
            coinDenom: 'XION',
            coinMinimalDenom: 'uxion',
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'XION',
            coinMinimalDenom: 'uxion',
            coinDecimals: 6,
            gasPriceStep: {
              low: 0.01,
              average: 0.025,
              high: 0.04,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'XION',
          coinMinimalDenom: 'uxion',
          coinDecimals: 6,
        },
      },
      'osmosis-1': {
        chainId: 'osmosis-1',
        chainName: 'Osmosis',
        rpc: 'https://rpc.osmosis.zone',
        rest: 'https://lcd.osmosis.zone',
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'osmo',
          bech32PrefixAccPub: 'osmopub',
          bech32PrefixValAddr: 'osmovaloper',
          bech32PrefixValPub: 'osmovaloperpub',
          bech32PrefixConsAddr: 'osmovalcons',
          bech32PrefixConsPub: 'osmovalconspub',
        },
        currencies: [
          {
            coinDenom: 'OSMO',
            coinMinimalDenom: 'uosmo',
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'OSMO',
            coinMinimalDenom: 'uosmo',
            coinDecimals: 6,
            gasPriceStep: {
              low: 0.0025,
              average: 0.025,
              high: 0.04,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'OSMO',
          coinMinimalDenom: 'uosmo',
          coinDecimals: 6,
        },
      },
      'neutron-1': {
        chainId: 'neutron-1',
        chainName: 'Neutron',
        rpc: 'https://rpc.neutron.org',
        rest: 'https://rest.neutron.org',
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'neutron',
          bech32PrefixAccPub: 'neutronpub',
          bech32PrefixValAddr: 'neutronvaloper',
          bech32PrefixValPub: 'neutronvaloperpub',
          bech32PrefixConsAddr: 'neutronvalcons',
          bech32PrefixConsPub: 'neutronvalconspub',
        },
        currencies: [
          {
            coinDenom: 'NTRN',
            coinMinimalDenom: 'untrn',
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'NTRN',
            coinMinimalDenom: 'untrn',
            coinDecimals: 6,
            gasPriceStep: {
              low: 0.0053,
              average: 0.0053,
              high: 0.0053,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'NTRN',
          coinMinimalDenom: 'untrn',
          coinDecimals: 6,
        },
      },
      'juno-1': {
        chainId: 'juno-1',
        chainName: 'Juno',
        rpc: 'https://rpc.juno.omniflix.co',
        rest: 'https://api.juno.omniflix.co',
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'juno',
          bech32PrefixAccPub: 'junopub',
          bech32PrefixValAddr: 'junovaloper',
          bech32PrefixValPub: 'junovaloperpub',
          bech32PrefixConsAddr: 'junovalcons',
          bech32PrefixConsPub: 'junovalconspub',
        },
        currencies: [
          {
            coinDenom: 'JUNO',
            coinMinimalDenom: 'ujuno',
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'JUNO',
            coinMinimalDenom: 'ujuno',
            coinDecimals: 6,
            gasPriceStep: {
              low: 0.001,
              average: 0.0025,
              high: 0.004,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'JUNO',
          coinMinimalDenom: 'ujuno',
          coinDecimals: 6,
        },
      },
    };

    return configs[chainId];
  }

  private getNativeDenom(chainId: string): string {
    const denoms: Record<string, string> = {
      'xion-testnet-1': 'uxion',
      'osmosis-1': 'uosmo',
      'neutron-1': 'untrn',
      'juno-1': 'ujuno',
    };

    return denoms[chainId] || 'uxion';
  }

  private setupEventListeners(): void {
    if (!this.keplr) return;

    // Keplr doesn't have direct event listeners like MetaMask
    // We can set up periodic checks or rely on the wallet UI to handle changes
    window.addEventListener('keplr_keystorechange', () => {
      this.onAccountsChangedCallback?.([]);
    });
  }

  private onAccountsChangedCallback?: (accounts: string[]) => void;
  private onChainChangedCallback?: (chainId: string) => void;
  private onDisconnectCallback?: () => void;

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    this.onAccountsChangedCallback = callback;
  }

  onChainChanged(callback: (chainId: string) => void): void {
    this.onChainChangedCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  // Cosmos-specific methods
  async executeContract(
    senderAddress: string,
    contractAddress: string,
    msg: any,
    fee: 'auto' | number = 'auto'
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Keplr client not initialized');
    }

    const result = await this.client.execute(
      senderAddress,
      contractAddress,
      msg,
      fee
    );

    return result.transactionHash;
  }

  async queryContract(contractAddress: string, query: any): Promise<any> {
    if (!this.client) {
      throw new Error('Keplr client not initialized');
    }

    return await this.client.queryContractSmart(contractAddress, query);
  }

  // Utility methods
  getSupportedChains(): string[] {
    return COSMOS_CHAINS.map(chain => chain.chainId);
  }

  getClient(): SigningCosmWasmClient | null {
    return this.client;
  }
}