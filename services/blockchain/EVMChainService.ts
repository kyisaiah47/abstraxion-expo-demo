import { ethers } from 'ethers';
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { mainnet, polygon, bsc, arbitrum, avalanche } from 'viem/chains';
import { MultiChainBalance, TokenBalance } from '../../types/wallet';
import { EVM_CHAINS, CCIP_ROUTER_ADDRESSES } from '../../types/chains';

interface EVMTransaction {
  from: string;
  to: string;
  amount: string;
  token?: string;
  chainId: number;
  data?: string;
}

interface CrossChainTransaction {
  sourceChainId: string | number;
  destinationChainId: string | number;
  from: string;
  to: string;
  amount: string;
  token?: string;
  data?: string;
}

export class EVMChainService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private publicClients: Map<number, any> = new Map();
  private activeChainId: number = 1; // Default to Ethereum

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const chainConfigs = {
      1: { rpc: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL, chain: mainnet },
      137: { rpc: process.env.EXPO_PUBLIC_POLYGON_RPC_URL, chain: polygon },
      56: { rpc: process.env.EXPO_PUBLIC_BSC_RPC_URL, chain: bsc },
      42161: { rpc: process.env.EXPO_PUBLIC_ARBITRUM_RPC_URL, chain: arbitrum },
      43114: { rpc: process.env.EXPO_PUBLIC_AVALANCHE_RPC_URL, chain: avalanche },
    };

    for (const [chainId, config] of Object.entries(chainConfigs)) {
      const numericChainId = Number(chainId);
      
      if (config.rpc) {
        // Initialize ethers provider
        const provider = new ethers.JsonRpcProvider(config.rpc);
        this.providers.set(numericChainId, provider);

        // Initialize viem public client
        const publicClient = createPublicClient({
          chain: config.chain,
          transport: http(config.rpc),
        });
        this.publicClients.set(numericChainId, publicClient);
      }
    }
  }

  async switchChain(chainId: number): Promise<void> {
    const supportedChains = EVM_CHAINS.map(chain => chain.chainId as number);
    if (!supportedChains.includes(chainId)) {
      throw new Error(`Unsupported EVM chain: ${chainId}`);
    }

    this.activeChainId = chainId;
  }

  async getBalance(address: string, chainId: number): Promise<MultiChainBalance> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    try {
      // Get native balance
      const nativeBalance = await provider.getBalance(address);
      const formattedNativeBalance = formatEther(BigInt(nativeBalance.toString()));

      // Get token balances (placeholder - implement based on your token list)
      const tokenBalances = await this.getTokenBalances(address, chainId);

      // Calculate total USD value (placeholder - integrate with price feeds)
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

  private async getTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
    // Implement token balance fetching
    // This would typically query common tokens like USDC, USDT, etc.
    const tokenBalances: TokenBalance[] = [];

    const commonTokens = this.getCommonTokens(chainId);
    const provider = this.providers.get(chainId);
    
    if (!provider) {
      return tokenBalances;
    }

    for (const token of commonTokens) {
      try {
        const contract = new ethers.Contract(token.address, [
          'function balanceOf(address) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
        ], provider);

        const [balance, decimals, symbol] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.symbol(),
        ]);

        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        if (parseFloat(formattedBalance) > 0) {
          tokenBalances.push({
            token: token.address,
            symbol,
            balance: formattedBalance,
            decimals,
            usdValue: await this.getTokenUSDValue(token.address, formattedBalance),
          });
        }
      } catch (error) {
        console.warn(`Failed to get balance for token ${token.address}:`, error);
      }
    }

    return tokenBalances;
  }

  private getCommonTokens(chainId: number): Array<{ address: string; symbol: string }> {
    const tokens: Record<number, Array<{ address: string; symbol: string }>> = {
      1: [ // Ethereum
        { address: '0xA0b86a33E6417c0b2fdD64a5C6D6B8E49C01f8F6', symbol: 'USDC' },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
        { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
      ],
      137: [ // Polygon
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC' },
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT' },
        { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI' },
      ],
      56: [ // BSC
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC' },
        { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT' },
        { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI' },
      ],
      42161: [ // Arbitrum
        { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC' },
        { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT' },
        { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI' },
      ],
      43114: [ // Avalanche
        { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC' },
        { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT' },
        { address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', symbol: 'DAI' },
      ],
    };

    return tokens[chainId] || [];
  }

  private async getTokenUSDValue(tokenAddress: string, balance: string): Promise<string> {
    // Placeholder for price feed integration
    // This would typically use Chainlink price feeds or CoinGecko API
    return '0.00';
  }

  private async calculateUSDValue(
    nativeBalance: string,
    tokenBalances: TokenBalance[],
    chainId: number
  ): Promise<string> {
    // Placeholder for USD value calculation
    // This would integrate with price feeds to get current USD values
    const nativeUsdValue = parseFloat(nativeBalance) * await this.getNativeTokenPrice(chainId);
    const tokenUsdValue = tokenBalances.reduce((total, token) => {
      return total + parseFloat(token.usdValue || '0');
    }, 0);

    return (nativeUsdValue + tokenUsdValue).toFixed(2);
  }

  private async getNativeTokenPrice(chainId: number): Promise<number> {
    // Placeholder - integrate with price feeds
    const mockPrices: Record<number, number> = {
      1: 2000, // ETH
      137: 0.8, // MATIC
      56: 300, // BNB
      42161: 2000, // ETH on Arbitrum
      43114: 25, // AVAX
    };

    return mockPrices[chainId] || 0;
  }

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      43114: 'AVAX',
    };

    return symbols[chainId] || 'ETH';
  }

  async sendTransaction(params: EVMTransaction): Promise<string> {
    const provider = this.providers.get(params.chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${params.chainId}`);
    }

    try {
      // This is a simplified version - in practice you'd need a signer
      const tx = {
        to: params.to,
        value: parseEther(params.amount),
        data: params.data || '0x',
      };

      // Note: This requires a signer which would come from the wallet
      // const signer = provider.getSigner();
      // const result = await signer.sendTransaction(tx);
      
      throw new Error('Transaction sending requires wallet integration');
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async getTransactionStatus(txHash: string, chainId: number): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
    blockNumber?: number;
  }> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: 'pending' };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'failed' };
    }
  }

  // CCIP Integration for cross-chain payments
  async estimateCCIPFee(
    sourceChainId: number,
    destinationChainId: number,
    amount: string,
    token?: string
  ): Promise<string> {
    const routerAddress = CCIP_ROUTER_ADDRESSES[sourceChainId];
    if (!routerAddress) {
      throw new Error(`CCIP router not available for chain ${sourceChainId}`);
    }

    const provider = this.providers.get(sourceChainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${sourceChainId}`);
    }

    try {
      // CCIP Router ABI (simplified)
      const routerABI = [
        'function getFee(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external view returns (uint256 fee)',
      ];

      const router = new ethers.Contract(routerAddress, routerABI, provider);

      // Get destination chain selector
      const destChain = EVM_CHAINS.find(chain => chain.chainId === destinationChainId);
      if (!destChain?.ccipChainSelector) {
        throw new Error(`No CCIP selector found for chain ${destinationChainId}`);
      }

      // Build CCIP message
      const message = {
        receiver: ethers.ZeroAddress, // Placeholder
        data: '0x',
        tokenAmounts: token ? [{
          token: token,
          amount: parseEther(amount),
        }] : [],
        feeToken: ethers.ZeroAddress, // Use native token for fees
        extraArgs: '0x',
      };

      const fee = await router.getFee(destChain.ccipChainSelector, message);
      return formatEther(fee);
    } catch (error) {
      console.error('Failed to estimate CCIP fee:', error);
      throw error;
    }
  }

  async sendCCIPTransaction(params: CrossChainTransaction): Promise<string> {
    const sourceRouterAddress = CCIP_ROUTER_ADDRESSES[params.sourceChainId as number];
    if (!sourceRouterAddress) {
      throw new Error(`CCIP router not available for chain ${params.sourceChainId}`);
    }

    const provider = this.providers.get(params.sourceChainId as number);
    if (!provider) {
      throw new Error(`No provider available for chain ${params.sourceChainId}`);
    }

    try {
      // This would integrate with the ProofPay CCIP contract
      // For now, return a placeholder
      throw new Error('CCIP transaction sending requires contract integration');
    } catch (error) {
      console.error('Failed to send CCIP transaction:', error);
      throw error;
    }
  }

  async callContract(
    contractAddress: string,
    method: string,
    args: any[],
    chainId: number
  ): Promise<any> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    try {
      // This would require the contract ABI
      // Placeholder implementation
      throw new Error('Contract calling requires ABI integration');
    } catch (error) {
      console.error('Failed to call contract:', error);
      throw error;
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async getGasPrice(chainId: number): Promise<string> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    try {
      const gasPrice = await provider.getFeeData();
      return formatEther(gasPrice.gasPrice || BigInt(0));
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0';
    }
  }

  async estimateGas(
    to: string,
    data: string,
    value: string,
    chainId: number
  ): Promise<string> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    try {
      const gasEstimate = await provider.estimateGas({
        to,
        data,
        value: parseEther(value),
      });

      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Get available providers
  getAvailableChains(): number[] {
    return Array.from(this.providers.keys());
  }

  getProvider(chainId: number): ethers.JsonRpcProvider | undefined {
    return this.providers.get(chainId);
  }

  getPublicClient(chainId: number): any {
    return this.publicClients.get(chainId);
  }
}