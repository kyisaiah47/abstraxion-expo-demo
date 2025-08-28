import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// GraphQL endpoint configurations
const GRAPHQL_ENDPOINTS = {
  // The Graph endpoints for EVM chains
  ethereum: process.env.EXPO_PUBLIC_ETHEREUM_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/proofpay/ethereum',
  polygon: process.env.EXPO_PUBLIC_POLYGON_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/proofpay/polygon',
  bsc: process.env.EXPO_PUBLIC_BSC_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/proofpay/bsc',
  arbitrum: process.env.EXPO_PUBLIC_ARBITRUM_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/proofpay/arbitrum',
  avalanche: process.env.EXPO_PUBLIC_AVALANCHE_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/proofpay/avalanche',
  
  // SubQuery endpoints for Cosmos chains
  xion: process.env.EXPO_PUBLIC_XION_SUBQUERY_URL || 'https://api.subquery.network/sq/proofpay/xion-testnet',
  osmosis: process.env.EXPO_PUBLIC_OSMOSIS_SUBQUERY_URL || 'https://api.subquery.network/sq/proofpay/osmosis',
  neutron: process.env.EXPO_PUBLIC_NEUTRON_SUBQUERY_URL || 'https://api.subquery.network/sq/proofpay/neutron',
  juno: process.env.EXPO_PUBLIC_JUNO_SUBQUERY_URL || 'https://api.subquery.network/sq/proofpay/juno',
};

// Create authentication link for The Graph API key
const authLink = setContext((_, { headers }) => {
  const apiKey = process.env.THE_GRAPH_API_KEY;
  return {
    headers: {
      ...headers,
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    }
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    // Log additional network error details
    if ('statusCode' in networkError) {
      console.error(`Status Code: ${networkError.statusCode}`);
    }
    if ('result' in networkError) {
      console.error(`Result: ${JSON.stringify(networkError.result)}`);
    }
  }
});

// Retry link for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error && !error.message.includes('401')
  }
});

// Function to create Apollo Client for specific chain
export function createChainClient(chainName: string) {
  const endpoint = GRAPHQL_ENDPOINTS[chainName as keyof typeof GRAPHQL_ENDPOINTS];
  
  if (!endpoint) {
    throw new Error(`No GraphQL endpoint configured for chain: ${chainName}`);
  }

  const httpLink = createHttpLink({
    uri: endpoint,
  });

  return new ApolloClient({
    link: from([
      errorLink,
      retryLink,
      authLink,
      httpLink,
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            payments: {
              keyArgs: false,
              merge(existing = [], incoming) {
                return [...existing, ...incoming];
              },
            },
            users: {
              keyArgs: false,
              merge(existing = [], incoming) {
                return [...existing, ...incoming];
              },
            },
          },
        },
        Payment: {
          fields: {
            proofSubmissions: {
              merge(existing = [], incoming) {
                return [...existing, ...incoming];
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
    },
  });
}

// Multi-chain client manager
export class MultiChainGraphQLClient {
  private clients: Map<string, any> = new Map();
  
  constructor() {
    // Initialize clients for all supported chains
    Object.keys(GRAPHQL_ENDPOINTS).forEach(chain => {
      try {
        this.clients.set(chain, createChainClient(chain));
      } catch (error) {
        console.warn(`Failed to initialize GraphQL client for ${chain}:`, error);
      }
    });
  }

  getClient(chainName: string) {
    const client = this.clients.get(chainName);
    if (!client) {
      throw new Error(`GraphQL client not initialized for chain: ${chainName}`);
    }
    return client;
  }

  async queryMultipleChains<T>(
    chainNames: string[],
    query: any,
    variables?: any
  ): Promise<Array<{ chain: string; data: T; error?: Error }>> {
    const promises = chainNames.map(async (chain) => {
      try {
        const client = this.getClient(chain);
        const result = await client.query({
          query,
          variables,
        });
        return {
          chain,
          data: result.data as T,
        };
      } catch (error) {
        return {
          chain,
          data: {} as T,
          error: error as Error,
        };
      }
    });

    return Promise.all(promises);
  }

  // Helper method to get all available chain names
  getAvailableChains(): string[] {
    return Array.from(this.clients.keys());
  }

  // Helper method to get EVM chains
  getEVMChains(): string[] {
    return ['ethereum', 'polygon', 'bsc', 'arbitrum', 'avalanche'];
  }

  // Helper method to get Cosmos chains
  getCosmosChains(): string[] {
    return ['xion', 'osmosis', 'neutron', 'juno'];
  }
}

// Export singleton instance
export const multiChainClient = new MultiChainGraphQLClient();

// Export individual clients for direct use
export const ethereumClient = createChainClient('ethereum');
export const polygonClient = createChainClient('polygon');
export const bscClient = createChainClient('bsc');
export const arbitrumClient = createChainClient('arbitrum');
export const avalancheClient = createChainClient('avalanche');
export const xionClient = createChainClient('xion');
export const osmosisClient = createChainClient('osmosis');
export const neutronClient = createChainClient('neutron');
export const junoClient = createChainClient('juno');

// Helper function to determine which client to use based on chain ID
export function getClientForChain(chainId: string) {
  const chainClientMap: { [key: string]: string } = {
    // EVM chains
    '1': 'ethereum',
    '137': 'polygon',
    '56': 'bsc',
    '42161': 'arbitrum',
    '43114': 'avalanche',
    
    // Cosmos chains
    'xion-testnet-2': 'xion',
    'osmosis-1': 'osmosis',
    'neutron-1': 'neutron',
    'juno-1': 'juno',
  };

  const clientName = chainClientMap[chainId];
  if (!clientName) {
    throw new Error(`No GraphQL client available for chain ID: ${chainId}`);
  }

  return multiChainClient.getClient(clientName);
}

export default multiChainClient;