import { Chain, ChainType } from './types';

export const SUPPORTED_CHAINS: Record<string, Chain> = {
  // EVM Chains
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL || '',
    ccipChainSelector: '5009297550715157269',
    deploymentAddress: process.env.EXPO_PUBLIC_ETHEREUM_PROOFPAY_ADDRESS || '',
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_POLYGON_RPC_URL || '',
    ccipChainSelector: '4051577828743386545',
    deploymentAddress: process.env.EXPO_PUBLIC_POLYGON_PROOFPAY_ADDRESS || '',
  },
  BSC: {
    chainId: 56,
    name: 'BSC',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_BSC_RPC_URL || '',
    ccipChainSelector: '11344663589394136015',
    deploymentAddress: process.env.EXPO_PUBLIC_BSC_PROOFPAY_ADDRESS || '',
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'Arbitrum',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_ARBITRUM_RPC_URL || '',
    ccipChainSelector: '4949039107694359620',
    deploymentAddress: process.env.EXPO_PUBLIC_ARBITRUM_PROOFPAY_ADDRESS || '',
  },
  AVALANCHE: {
    chainId: 43114,
    name: 'Avalanche',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_AVALANCHE_RPC_URL || '',
    ccipChainSelector: '6433500567565415381',
    deploymentAddress: process.env.EXPO_PUBLIC_AVALANCHE_PROOFPAY_ADDRESS || '',
  },
  
  // Cosmos Chains
  XION: {
    chainId: 'xion-testnet-1',
    name: 'XION',
    type: ChainType.COSMOS,
    rpcUrl: process.env.EXPO_PUBLIC_XION_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443',
    addressPrefix: 'xion',
    deploymentAddress: process.env.EXPO_PUBLIC_XION_PROOFPAY_ADDRESS || '',
  },
  OSMOSIS: {
    chainId: 'osmosis-1',
    name: 'Osmosis',
    type: ChainType.COSMOS,
    rpcUrl: process.env.EXPO_PUBLIC_OSMOSIS_RPC_URL || 'https://rpc.osmosis.zone:443',
    addressPrefix: 'osmo',
    deploymentAddress: process.env.EXPO_PUBLIC_OSMOSIS_PROOFPAY_ADDRESS || '',
  },
  NEUTRON: {
    chainId: 'neutron-1',
    name: 'Neutron',
    type: ChainType.COSMOS,
    rpcUrl: process.env.EXPO_PUBLIC_NEUTRON_RPC_URL || 'https://rpc.neutron.org:443',
    addressPrefix: 'neutron',
    deploymentAddress: process.env.EXPO_PUBLIC_NEUTRON_PROOFPAY_ADDRESS || '',
  },
  JUNO: {
    chainId: 'juno-1', 
    name: 'Juno',
    type: ChainType.COSMOS,
    rpcUrl: process.env.EXPO_PUBLIC_JUNO_RPC_URL || 'https://rpc.juno.omniflix.co:443',
    addressPrefix: 'juno',
    deploymentAddress: process.env.EXPO_PUBLIC_JUNO_PROOFPAY_ADDRESS || '',
  },
} as const;

export const EVM_CHAINS = Object.values(SUPPORTED_CHAINS).filter(
  chain => chain.type === ChainType.EVM
);

export const COSMOS_CHAINS = Object.values(SUPPORTED_CHAINS).filter(
  chain => chain.type === ChainType.COSMOS
);

export const getChainById = (chainId: string | number): Chain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === chainId);
};

export const getChainByName = (name: string): Chain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(
    chain => chain.name.toLowerCase() === name.toLowerCase()
  );
};

export const isEVMChain = (chainId: string | number): boolean => {
  const chain = getChainById(chainId);
  return chain?.type === ChainType.EVM;
};

export const isCosmosChain = (chainId: string | number): boolean => {
  const chain = getChainById(chainId);
  return chain?.type === ChainType.COSMOS;
};

export const CCIP_ROUTER_ADDRESSES: Record<number, string> = {
  1: process.env.EXPO_PUBLIC_CCIP_ROUTER_ETHEREUM || '',
  137: process.env.EXPO_PUBLIC_CCIP_ROUTER_POLYGON || '',
  56: process.env.EXPO_PUBLIC_CCIP_ROUTER_BSC || '',
  42161: process.env.EXPO_PUBLIC_CCIP_ROUTER_ARBITRUM || '',
  43114: process.env.EXPO_PUBLIC_CCIP_ROUTER_AVALANCHE || '',
};

// Testnet configurations
export const TESTNET_CHAINS: Record<string, Chain> = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || '',
    ccipChainSelector: '16015286601757825753',
    deploymentAddress: '',
  },
  POLYGON_MUMBAI: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    type: ChainType.EVM,
    rpcUrl: process.env.EXPO_PUBLIC_POLYGON_MUMBAI_RPC_URL || '',
    ccipChainSelector: '12532609583862916517',
    deploymentAddress: '',
  },
  XION_TESTNET: {
    chainId: 'xion-testnet-1',
    name: 'XION Testnet',
    type: ChainType.COSMOS,
    rpcUrl: 'https://rpc.xion-testnet-2.burnt.com:443',
    addressPrefix: 'xion',
    deploymentAddress: '',
  },
};

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.XION; // Start with XION as default

export const CHAIN_EXPLORERS: Record<string | number, string> = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  56: 'https://bscscan.com',
  42161: 'https://arbiscan.io',
  43114: 'https://snowtrace.io',
  'xion-testnet-1': 'https://explorer.burnt.com/xion-testnet-1',
  'osmosis-1': 'https://www.mintscan.io/osmosis',
  'neutron-1': 'https://www.mintscan.io/neutron',
  'juno-1': 'https://www.mintscan.io/juno',
};

export const getExplorerUrl = (chainId: string | number, hash: string): string => {
  const baseUrl = CHAIN_EXPLORERS[chainId];
  if (!baseUrl) return '';
  
  const chain = getChainById(chainId);
  if (chain?.type === ChainType.COSMOS) {
    return `${baseUrl}/txs/${hash}`;
  } else {
    return `${baseUrl}/tx/${hash}`;
  }
};