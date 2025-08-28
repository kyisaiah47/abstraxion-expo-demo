import { Chain, ChainType, MultiChainBalance, TokenBalance } from '../../packages/shared/types';
import { SUPPORTED_CHAINS, getChainById, isEVMChain, isCosmosChain } from '../../packages/shared/chains';
import { EVMChainService } from './EVMChainService';
import { CosmosChainService } from './CosmosChainService';

export class ChainService {
  private evmService: EVMChainService;
  private cosmosService: CosmosChainService;
  private activeChain: Chain;

  constructor() {
    this.evmService = new EVMChainService();
    this.cosmosService = new CosmosChainService();
    this.activeChain = SUPPORTED_CHAINS.XION; // Default to XION
  }

  // Chain Management
  public getSupportedChains(): Chain[] {
    return Object.values(SUPPORTED_CHAINS);
  }

  public getActiveChain(): Chain {
    return this.activeChain;
  }

  public async switchChain(chainId: string | number): Promise<void> {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    this.activeChain = chain;

    // Notify appropriate service about chain switch
    if (isEVMChain(chainId)) {
      await this.evmService.switchChain(chainId as number);
    } else if (isCosmosChain(chainId)) {
      await this.cosmosService.switchChain(chainId as string);
    }
  }

  // Balance Operations
  public async getBalance(address: string, chainId?: string | number): Promise<MultiChainBalance> {
    const targetChain = chainId ? getChainById(chainId) : this.activeChain;
    
    if (!targetChain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    if (targetChain.type === ChainType.EVM) {
      return await this.evmService.getBalance(address, targetChain.chainId as number);
    } else {
      return await this.cosmosService.getBalance(address, targetChain.chainId as string);
    }
  }

  public async getMultiChainBalance(address: string): Promise<MultiChainBalance[]> {
    const chains = this.getSupportedChains();
    const balancePromises = chains.map(async (chain) => {
      try {
        return await this.getBalance(address, chain.chainId);
      } catch (error) {
        console.warn(`Failed to get balance for chain ${chain.name}:`, error);
        // Return empty balance on error
        return {
          chainId: chain.chainId,
          nativeBalance: '0',
          nativeSymbol: this.getNativeSymbol(chain),
          tokenBalances: [],
          totalUsdValue: '0',
        };
      }
    });

    return await Promise.all(balancePromises);
  }

  public async getTotalUSDBalance(address: string): Promise<string> {
    const balances = await this.getMultiChainBalance(address);
    const total = balances.reduce((sum, balance) => {
      const usdValue = parseFloat(balance.totalUsdValue || '0');
      return sum + usdValue;
    }, 0);

    return total.toFixed(2);
  }

  // Transaction Operations
  public async sendTransaction(params: {
    from: string;
    to: string;
    amount: string;
    token?: string;
    chainId?: string | number;
    data?: string;
  }): Promise<string> {
    const targetChain = params.chainId ? getChainById(params.chainId) : this.activeChain;
    
    if (!targetChain) {
      throw new Error(`Chain not found: ${params.chainId}`);
    }

    if (targetChain.type === ChainType.EVM) {
      return await this.evmService.sendTransaction({
        ...params,
        chainId: targetChain.chainId as number,
      });
    } else {
      return await this.cosmosService.sendTransaction({
        ...params,
        chainId: targetChain.chainId as string,
      });
    }
  }

  public async getTransactionStatus(txHash: string, chainId?: string | number): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
    blockNumber?: number;
  }> {
    const targetChain = chainId ? getChainById(chainId) : this.activeChain;
    
    if (!targetChain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    if (targetChain.type === ChainType.EVM) {
      return await this.evmService.getTransactionStatus(txHash, targetChain.chainId as number);
    } else {
      return await this.cosmosService.getTransactionStatus(txHash, targetChain.chainId as string);
    }
  }

  // Cross-Chain Operations
  public async estimateCrossChainFee(
    sourceChainId: string | number,
    destinationChainId: string | number,
    amount: string,
    token?: string
  ): Promise<string> {
    const sourceChain = getChainById(sourceChainId);
    const destChain = getChainById(destinationChainId);

    if (!sourceChain || !destChain) {
      throw new Error('Invalid chain IDs');
    }

    // Both EVM chains - use CCIP
    if (sourceChain.type === ChainType.EVM && destChain.type === ChainType.EVM) {
      return await this.evmService.estimateCCIPFee(
        sourceChainId as number,
        destinationChainId as number,
        amount,
        token
      );
    }

    // Both Cosmos chains - use IBC
    if (sourceChain.type === ChainType.COSMOS && destChain.type === ChainType.COSMOS) {
      return await this.cosmosService.estimateIBCFee(
        sourceChainId as string,
        destinationChainId as string,
        amount,
        token
      );
    }

    // Cross-ecosystem (EVM <-> Cosmos) - not yet supported
    throw new Error('Cross-ecosystem transfers not yet supported');
  }

  public async sendCrossChainTransaction(params: {
    sourceChainId: string | number;
    destinationChainId: string | number;
    from: string;
    to: string;
    amount: string;
    token?: string;
    data?: string;
  }): Promise<string> {
    const sourceChain = getChainById(params.sourceChainId);
    const destChain = getChainById(params.destinationChainId);

    if (!sourceChain || !destChain) {
      throw new Error('Invalid chain IDs');
    }

    // Both EVM chains - use CCIP
    if (sourceChain.type === ChainType.EVM && destChain.type === ChainType.EVM) {
      return await this.evmService.sendCCIPTransaction(params);
    }

    // Both Cosmos chains - use IBC  
    if (sourceChain.type === ChainType.COSMOS && destChain.type === ChainType.COSMOS) {
      return await this.cosmosService.sendIBCTransaction(params);
    }

    // Cross-ecosystem - not yet supported
    throw new Error('Cross-ecosystem transfers not yet supported');
  }

  // Contract Interactions
  public async callContract(
    contractAddress: string,
    method: string,
    args: any[],
    chainId?: string | number
  ): Promise<any> {
    const targetChain = chainId ? getChainById(chainId) : this.activeChain;
    
    if (!targetChain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    if (targetChain.type === ChainType.EVM) {
      return await this.evmService.callContract(
        contractAddress,
        method,
        args,
        targetChain.chainId as number
      );
    } else {
      return await this.cosmosService.callContract(
        contractAddress,
        method,
        args,
        targetChain.chainId as string
      );
    }
  }

  // Utility Methods
  public getNativeSymbol(chain: Chain): string {
    const nativeSymbols: Record<string, string> = {
      '1': 'ETH',
      '137': 'MATIC',
      '56': 'BNB',
      '42161': 'ETH',
      '43114': 'AVAX',
      'xion-testnet-1': 'XION',
      'osmosis-1': 'OSMO',
      'neutron-1': 'NTRN',
      'juno-1': 'JUNO',
    };

    return nativeSymbols[chain.chainId.toString()] || 'UNKNOWN';
  }

  public isValidAddress(address: string, chainId?: string | number): boolean {
    const targetChain = chainId ? getChainById(chainId) : this.activeChain;
    
    if (!targetChain) {
      return false;
    }

    if (targetChain.type === ChainType.EVM) {
      return this.evmService.isValidAddress(address);
    } else {
      return this.cosmosService.isValidAddress(address, targetChain.addressPrefix);
    }
  }

  public formatAddress(address: string, length = 8): string {
    if (address.length <= length) {
      return address;
    }
    
    const start = address.substring(0, length / 2);
    const end = address.substring(address.length - length / 2);
    return `${start}...${end}`;
  }

  public getExplorerUrl(chainId: string | number, txHash: string): string {
    const chain = getChainById(chainId);
    if (!chain) {
      return '';
    }

    const explorers: Record<string, string> = {
      '1': 'https://etherscan.io',
      '137': 'https://polygonscan.com',
      '56': 'https://bscscan.com',
      '42161': 'https://arbiscan.io',
      '43114': 'https://snowtrace.io',
      'xion-testnet-1': 'https://explorer.burnt.com/xion-testnet-1',
      'osmosis-1': 'https://www.mintscan.io/osmosis',
      'neutron-1': 'https://www.mintscan.io/neutron',
      'juno-1': 'https://www.mintscan.io/juno',
    };

    const baseUrl = explorers[chainId.toString()];
    if (!baseUrl) {
      return '';
    }

    if (chain.type === ChainType.COSMOS) {
      return `${baseUrl}/txs/${txHash}`;
    } else {
      return `${baseUrl}/tx/${txHash}`;
    }
  }

  // Event Listeners
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  public addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

export const chainService = new ChainService();