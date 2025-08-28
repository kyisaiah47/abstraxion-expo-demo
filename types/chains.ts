import { ChainInfo, Chain, ChainType } from './wallet';

export const XION_CHAIN_INFO: ChainInfo = {
  chainId: 'xion-testnet-1',
  chainName: 'XION Testnet',
  rpc: 'https://testnet-rpc.xion.burnt.com:443',
  rest: 'https://testnet-api.xion.burnt.com:443',
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
        low: 0.1,
        average: 0.25,
        high: 0.4,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'XION',
    coinMinimalDenom: 'uxion',
    coinDecimals: 6,
  },
};

export const SUPPORTED_CHAINS: ChainInfo[] = [
  XION_CHAIN_INFO,
];

export const getChainInfo = (chainId: string): ChainInfo | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
};

export const getChainById = (chainId: string): Chain | undefined => {
  // Map ChainInfo to Chain format
  const chainInfo = getChainInfo(chainId);
  if (!chainInfo) return undefined;
  
  return {
    id: chainInfo.chainId,
    name: chainInfo.chainName,
    type: ChainType.COSMOS,
    nativeCurrency: {
      name: chainInfo.stakeCurrency.coinDenom,
      symbol: chainInfo.stakeCurrency.coinDenom,
      decimals: chainInfo.stakeCurrency.coinDecimals,
    },
    rpcUrls: [chainInfo.rpc],
    blockExplorerUrls: [],
  };
};

export const isEVMChain = (chainId: string): boolean => {
  const chain = getChainById(chainId);
  return chain?.type === ChainType.EVM;
};

export const isCosmosChain = (chainId: string): boolean => {
  const chain = getChainById(chainId);
  return chain?.type === ChainType.COSMOS;
};