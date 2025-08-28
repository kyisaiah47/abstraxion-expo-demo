import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice, StargateClient } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/amino';
import { MultiChainBalance, TokenBalance } from '../../types/wallet';
import { COSMOS_CHAINS } from '../../types/chains';

interface CosmosTransaction {
  from: string;
  to: string;
  amount: string;
  token?: string;
  chainId: string;
  data?: string;
}

interface IBCTransaction {
  sourceChainId: string | number;
  destinationChainId: string | number;
  from: string;
  to: string;
  amount: string;
  token?: string;
  data?: string;
}

export class CosmosChainService {
  private clients: Map<string, StargateClient> = new Map();
  private signingClients: Map<string, SigningCosmWasmClient> = new Map();
  private activeChainId: string = 'xion-testnet-1';

  constructor() {
    this.initializeClients();
  }

  private async initializeClients(): Promise<void> {
    const chainConfigs = {
      'xion-testnet-1': {
        rpc: process.env.EXPO_PUBLIC_XION_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443',
        gasPrice: '0.025uxion',
      },
      'osmosis-1': {
        rpc: process.env.EXPO_PUBLIC_OSMOSIS_RPC_URL || 'https://rpc.osmosis.zone:443',
        gasPrice: '0.025uosmo',
      },
      'neutron-1': {
        rpc: process.env.EXPO_PUBLIC_NEUTRON_RPC_URL || 'https://rpc.neutron.org:443',
        gasPrice: '0.0053untrn',
      },
      'juno-1': {
        rpc: process.env.EXPO_PUBLIC_JUNO_RPC_URL || 'https://rpc.juno.omniflix.co:443',
        gasPrice: '0.0025ujuno',
      },
    };

    for (const [chainId, config] of Object.entries(chainConfigs)) {
      try {
        // Initialize read-only client
        const client = await StargateClient.connect(config.rpc);
        this.clients.set(chainId, client);

      } catch (error) {
        console.warn(`Failed to connect to ${chainId}:`, error);
      }
    }
  }

  async switchChain(chainId: string): Promise<void> {
    const supportedChains = COSMOS_CHAINS.map(chain => chain.chainId);
    if (!supportedChains.includes(chainId)) {
      throw new Error(`Unsupported Cosmos chain: ${chainId}`);
    }

    this.activeChainId = chainId;
  }

  async getBalance(address: string, chainId: string): Promise<MultiChainBalance> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      // Get all balances
      const balances = await client.getAllBalances(address);
      
      const nativeDenom = this.getNativeDenom(chainId);
      const nativeBalance = balances.find(b => b.denom === nativeDenom);
      const formattedNativeBalance = nativeBalance 
        ? (parseInt(nativeBalance.amount) / 1000000).toString() 
        : '0';

      // Convert other balances to token format
      const tokenBalances: TokenBalance[] = balances
        .filter(balance => balance.denom !== nativeDenom)
        .map(balance => ({
          token: balance.denom,
          symbol: this.formatDenom(balance.denom),
          balance: this.formatBalance(balance.amount, balance.denom),
          decimals: this.getDecimals(balance.denom),
          usdValue: '0.00', // Placeholder for price feed integration
        }));

      // Calculate total USD value
      const totalUsdValue = await this.calculateUSDValue(
        formattedNativeBalance,
        tokenBalances,
        chainId
      );

      return {
        chainId,
        nativeBalance: formattedNativeBalance,
        nativeSymbol: this.getNativeSymbol(chainId),
        tokenBalances,
        totalUsdValue,
      };
    } catch (error) {
      console.error(`Failed to get balance for chain ${chainId}:`, error);
      throw error;
    }
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

  private getNativeSymbol(chainId: string): string {
    const symbols: Record<string, string> = {
      'xion-testnet-1': 'XION',
      'osmosis-1': 'OSMO',
      'neutron-1': 'NTRN',
      'juno-1': 'JUNO',
    };

    return symbols[chainId] || 'UNKNOWN';
  }

  private formatDenom(denom: string): string {
    // Convert denom to readable format
    if (denom.startsWith('ibc/')) {
      return 'IBC';
    }
    
    if (denom.startsWith('factory/')) {
      return 'FACTORY';
    }

    // Remove 'u' prefix for micro-denominations
    if (denom.startsWith('u')) {
      return denom.substring(1).toUpperCase();
    }

    return denom.toUpperCase();
  }

  private formatBalance(amount: string, denom: string): string {
    const decimals = this.getDecimals(denom);
    const balance = parseInt(amount) / Math.pow(10, decimals);
    return balance.toString();
  }

  private getDecimals(denom: string): number {
    // Most Cosmos tokens use 6 decimals
    if (denom.startsWith('u')) return 6;
    if (denom.startsWith('n')) return 9;
    if (denom.startsWith('p')) return 12;
    return 6; // Default
  }

  private async calculateUSDValue(
    nativeBalance: string,
    tokenBalances: TokenBalance[],
    chainId: string
  ): Promise<string> {
    // Placeholder for USD value calculation
    const nativeUsdValue = parseFloat(nativeBalance) * await this.getNativeTokenPrice(chainId);
    const tokenUsdValue = tokenBalances.reduce((total, token) => {
      return total + parseFloat(token.usdValue || '0');
    }, 0);

    return (nativeUsdValue + tokenUsdValue).toFixed(2);
  }

  private async getNativeTokenPrice(chainId: string): Promise<number> {
    // Placeholder - integrate with price feeds
    const mockPrices: Record<string, number> = {
      'xion-testnet-1': 0.5, // XION
      'osmosis-1': 0.8,      // OSMO
      'neutron-1': 0.4,      // NTRN
      'juno-1': 0.6,         // JUNO
    };

    return mockPrices[chainId] || 0;
  }

  async sendTransaction(params: CosmosTransaction): Promise<string> {
    const signingClient = this.signingClients.get(params.chainId);
    if (!signingClient) {
      throw new Error(`No signing client available for chain ${params.chainId}`);
    }

    try {
      const amount: Coin = {
        denom: params.token || this.getNativeDenom(params.chainId),
        amount: this.convertToMicroUnits(params.amount, params.token || this.getNativeDenom(params.chainId)),
      };

      const result = await signingClient.sendTokens(
        params.from,
        params.to,
        [amount],
        'auto',
        'ProofPay transaction'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Failed to send Cosmos transaction:', error);
      throw error;
    }
  }

  private convertToMicroUnits(amount: string, denom: string): string {
    const decimals = this.getDecimals(denom);
    const microAmount = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(microAmount).toString();
  }

  async getTransactionStatus(txHash: string, chainId: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
    blockNumber?: number;
  }> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      const tx = await client.getTx(txHash);
      
      if (!tx) {
        return { status: 'pending' };
      }

      const currentHeight = await client.getHeight();
      const confirmations = currentHeight - tx.height;

      return {
        status: tx.code === 0 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: tx.height,
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'failed' };
    }
  }

  // IBC Integration for cross-chain payments
  async estimateIBCFee(
    sourceChainId: string,
    destinationChainId: string,
    amount: string,
    token?: string
  ): Promise<string> {
    try {
      // IBC transfers typically have low fixed fees
      const baseFee = 0.01; // Base IBC fee in native token
      const gasPrice = this.getGasPrice(sourceChainId);
      
      return (baseFee * gasPrice).toFixed(6);
    } catch (error) {
      console.error('Failed to estimate IBC fee:', error);
      throw error;
    }
  }

  private getGasPrice(chainId: string): number {
    const gasPrices: Record<string, number> = {
      'xion-testnet-1': 0.025,
      'osmosis-1': 0.025,
      'neutron-1': 0.0053,
      'juno-1': 0.0025,
    };

    return gasPrices[chainId] || 0.025;
  }

  async sendIBCTransaction(params: IBCTransaction): Promise<string> {
    const signingClient = this.signingClients.get(params.sourceChainId as string);
    if (!signingClient) {
      throw new Error(`No signing client available for chain ${params.sourceChainId}`);
    }

    try {
      // Get IBC channel info
      const channelInfo = this.getIBCChannel(
        params.sourceChainId as string,
        params.destinationChainId as string
      );

      if (!channelInfo) {
        throw new Error(`No IBC channel found between ${params.sourceChainId} and ${params.destinationChainId}`);
      }

      const amount: Coin = {
        denom: params.token || this.getNativeDenom(params.sourceChainId as string),
        amount: this.convertToMicroUnits(
          params.amount,
          params.token || this.getNativeDenom(params.sourceChainId as string)
        ),
      };

      // Calculate timeout (1 hour from now)
      const timeoutTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const result = await signingClient.sendIbcTokens(
        params.from,
        params.to,
        amount,
        'transfer', // IBC port
        channelInfo.channel,
        undefined, // timeout height
        timeoutTimestamp * 1000000000, // timeout timestamp in nanoseconds
        'auto',
        'ProofPay IBC transfer'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Failed to send IBC transaction:', error);
      throw error;
    }
  }

  private getIBCChannel(sourceChainId: string, destChainId: string): { channel: string; port: string } | null {
    // IBC channel mapping - these would be the actual channels between chains
    const channels: Record<string, Record<string, { channel: string; port: string }>> = {
      'xion-testnet-1': {
        'osmosis-1': { channel: 'channel-0', port: 'transfer' },
        'neutron-1': { channel: 'channel-1', port: 'transfer' },
        'juno-1': { channel: 'channel-2', port: 'transfer' },
      },
      'osmosis-1': {
        'xion-testnet-1': { channel: 'channel-100', port: 'transfer' },
        'neutron-1': { channel: 'channel-101', port: 'transfer' },
        'juno-1': { channel: 'channel-102', port: 'transfer' },
      },
      'neutron-1': {
        'xion-testnet-1': { channel: 'channel-200', port: 'transfer' },
        'osmosis-1': { channel: 'channel-201', port: 'transfer' },
        'juno-1': { channel: 'channel-202', port: 'transfer' },
      },
      'juno-1': {
        'xion-testnet-1': { channel: 'channel-300', port: 'transfer' },
        'osmosis-1': { channel: 'channel-301', port: 'transfer' },
        'neutron-1': { channel: 'channel-302', port: 'transfer' },
      },
    };

    return channels[sourceChainId]?.[destChainId] || null;
  }

  async callContract(
    contractAddress: string,
    method: string,
    args: any[],
    chainId: string
  ): Promise<any> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      // For CosmWasm contracts, we query with smart queries
      if (typeof args[0] === 'object') {
        // Smart query
        const queryMsg = args[0];
        const result = await (client as any).queryContractSmart(contractAddress, queryMsg);
        return result;
      } else {
        // Raw query
        throw new Error('Raw contract queries not implemented');
      }
    } catch (error) {
      console.error('Failed to call contract:', error);
      throw error;
    }
  }

  // CosmWasm specific methods
  async executeContract(
    senderAddress: string,
    contractAddress: string,
    msg: any,
    chainId: string,
    fee: 'auto' | number = 'auto',
    memo?: string,
    funds?: readonly Coin[]
  ): Promise<string> {
    const signingClient = this.signingClients.get(chainId);
    if (!signingClient) {
      throw new Error(`No signing client available for chain ${chainId}`);
    }

    try {
      const result = await signingClient.execute(
        senderAddress,
        contractAddress,
        msg,
        fee,
        memo,
        funds
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Failed to execute contract:', error);
      throw error;
    }
  }

  async queryContract(contractAddress: string, query: any, chainId: string): Promise<any> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      const result = await (client as any).queryContractSmart(contractAddress, query);
      return result;
    } catch (error) {
      console.error('Failed to query contract:', error);
      throw error;
    }
  }

  // Utility methods
  isValidAddress(address: string, prefix?: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic bech32 validation
    if (prefix) {
      return address.startsWith(prefix) && address.length > prefix.length + 10;
    }

    // General Cosmos address validation
    return /^[a-z]+1[a-z0-9]{38,}$/.test(address);
  }

  async getGasPrices(chainId: string): Promise<GasPrice> {
    const gasPriceConfigs: Record<string, string> = {
      'xion-testnet-1': '0.025uxion',
      'osmosis-1': '0.025uosmo',
      'neutron-1': '0.0053untrn',
      'juno-1': '0.0025ujuno',
    };

    const gasPriceString = gasPriceConfigs[chainId] || '0.025uxion';
    return GasPrice.fromString(gasPriceString);
  }

  async estimateGas(
    senderAddress: string,
    contractAddress: string,
    msg: any,
    chainId: string,
    funds?: readonly Coin[]
  ): Promise<number> {
    const signingClient = this.signingClients.get(chainId);
    if (!signingClient) {
      throw new Error(`No signing client available for chain ${chainId}`);
    }

    try {
      const gasEstimation = await signingClient.simulate(
        senderAddress,
        [
          {
            typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
            value: {
              sender: senderAddress,
              contract: contractAddress,
              msg: new TextEncoder().encode(JSON.stringify(msg)),
              funds: funds || [],
            },
          },
        ],
        'Gas estimation'
      );

      return Math.ceil(gasEstimation * 1.3); // Add 30% buffer
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return a reasonable default
      return 200000;
    }
  }

  // Signing client management
  setSigningClient(chainId: string, signingClient: SigningCosmWasmClient): void {
    this.signingClients.set(chainId, signingClient);
  }

  removeSigningClient(chainId: string): void {
    this.signingClients.delete(chainId);
  }

  hasSigningClient(chainId: string): boolean {
    return this.signingClients.has(chainId);
  }

  getSigningClient(chainId: string): SigningCosmWasmClient | undefined {
    return this.signingClients.get(chainId);
  }

  // Get available chains
  getAvailableChains(): string[] {
    return Array.from(this.clients.keys());
  }

  getClient(chainId: string): StargateClient | undefined {
    return this.clients.get(chainId);
  }

  // Validator and staking methods
  async getValidators(chainId: string): Promise<any[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      const validators = await (client as any).staking.validators('BOND_STATUS_BONDED');
      return validators.validators || [];
    } catch (error) {
      console.warn('Failed to get validators:', error);
      return [];
    }
  }

  async getDelegations(delegatorAddress: string, chainId: string): Promise<any[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      const delegations = await (client as any).staking.delegatorDelegations(delegatorAddress);
      return delegations.delegationResponses || [];
    } catch (error) {
      console.warn('Failed to get delegations:', error);
      return [];
    }
  }

  // Governance methods
  async getProposals(chainId: string): Promise<any[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No client available for chain ${chainId}`);
    }

    try {
      const proposals = await (client as any).gov.proposals('PROPOSAL_STATUS_VOTING_PERIOD');
      return proposals.proposals || [];
    } catch (error) {
      console.warn('Failed to get proposals:', error);
      return [];
    }
  }
}