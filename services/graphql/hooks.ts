import { useQuery, useLazyQuery, QueryHookOptions, LazyQueryHookOptions } from '@apollo/client';
import { useState, useEffect, useMemo } from 'react';
import { multiChainClient } from './client';
import {
  GET_USER,
  GET_USER_PAYMENTS,
  GET_PAYMENT,
  GET_PAYMENTS,
  GET_RECENT_PAYMENTS,
  GET_PROTOCOL_STATS,
  GET_DAILY_STATS,
  GET_TOKEN_STATS,
  GET_CROSS_CHAIN_PAYMENTS,
  GET_COSMOS_USER,
  GET_COSMOS_PAYMENTS,
  GET_COSMOS_CHAIN_STATS,
  GET_IBC_TRANSFERS,
  SEARCH_PAYMENTS,
  GET_DISPUTED_PAYMENTS,
  GET_PROOF_SUBMISSIONS
} from './queries';

// Types for better type safety
interface User {
  id: string;
  address: string;
  username?: string;
  metadata?: string;
  totalPaymentsSent: string;
  totalPaymentsReceived: string;
  totalAmountSent: string;
  totalAmountReceived: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  paymentId: string;
  sender: User;
  recipient: User;
  amount: string;
  token?: string;
  denom?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED';
  proofType: string;
  createdAt: string;
  completedAt?: string;
  transactionHash: string;
}

interface MultiChainQueryResult<T> {
  data: Array<{ chain: string; data: T; error?: Error }>;
  loading: boolean;
  error?: Error;
}

// Hook for querying a single chain
export function useChainQuery<T = any>(
  chainName: string,
  query: any,
  options?: QueryHookOptions
) {
  const [client, setClient] = useState<any>(null);
  const [clientError, setClientError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const chainClient = multiChainClient.getClient(chainName);
      setClient(chainClient);
      setClientError(null);
    } catch (error) {
      setClientError(error as Error);
      console.error(`Failed to get client for chain ${chainName}:`, error);
    }
  }, [chainName]);

  const queryResult = useQuery<T>(query, {
    ...options,
    client,
    skip: !client || options?.skip,
  });

  return {
    ...queryResult,
    error: clientError || queryResult.error,
  };
}

// Hook for multi-chain queries
export function useMultiChainQuery<T = any>(
  chainNames: string[],
  query: any,
  variables?: any
): MultiChainQueryResult<T> {
  const [data, setData] = useState<Array<{ chain: string; data: T; error?: Error }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await multiChainClient.queryMultipleChains<T>(
          chainNames,
          query,
          variables
        );
        
        if (mounted) {
          setData(results);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [chainNames, query, variables]);

  return { data, loading, error };
}

// User-related hooks
export function useUser(address: string, chainName: string) {
  return useChainQuery<{ user: User }>(
    chainName,
    multiChainClient.getCosmosChains().includes(chainName) ? GET_COSMOS_USER : GET_USER,
    {
      variables: { address, chain: chainName },
      skip: !address,
    }
  );
}

export function useUserPayments(
  address: string,
  chainName: string,
  options?: {
    first?: number;
    skip?: number;
    orderBy?: string;
    orderDirection?: string;
  }
) {
  return useChainQuery<{
    paymentsCreated: Payment[];
    paymentsReceived: Payment[];
  }>(
    chainName,
    multiChainClient.getCosmosChains().includes(chainName) ? 
      GET_COSMOS_PAYMENTS : GET_USER_PAYMENTS,
    {
      variables: {
        address,
        ...options,
      },
      skip: !address,
    }
  );
}

// Multi-chain user data
export function useMultiChainUser(address: string) {
  const chainNames = multiChainClient.getAvailableChains();
  
  return useMultiChainQuery<{ user: User }>(
    chainNames,
    GET_USER,
    { address }
  );
}

// Payment-related hooks
export function usePayment(paymentId: string, chainName: string) {
  return useChainQuery<{ payment: Payment }>(
    chainName,
    GET_PAYMENT,
    {
      variables: { paymentId },
      skip: !paymentId,
    }
  );
}

export function usePayments(
  chainName: string,
  options?: {
    first?: number;
    skip?: number;
    orderBy?: string;
    orderDirection?: string;
    where?: any;
  }
) {
  return useChainQuery<{ payments: Payment[] }>(
    chainName,
    multiChainClient.getCosmosChains().includes(chainName) ? 
      GET_COSMOS_PAYMENTS : GET_PAYMENTS,
    {
      variables: options,
    }
  );
}

export function useRecentPayments(chainName: string, first: number = 20) {
  return useChainQuery<{ payments: Payment[] }>(
    chainName,
    GET_RECENT_PAYMENTS,
    {
      variables: { first },
      pollInterval: 30000, // Poll every 30 seconds for recent payments
    }
  );
}

export function useMultiChainRecentPayments(first: number = 20) {
  const chainNames = multiChainClient.getAvailableChains();
  
  return useMultiChainQuery<{ payments: Payment[] }>(
    chainNames,
    GET_RECENT_PAYMENTS,
    { first }
  );
}

// Statistics hooks
export function useProtocolStats(chainName: string) {
  return useChainQuery(
    chainName,
    multiChainClient.getCosmosChains().includes(chainName) ? 
      GET_COSMOS_CHAIN_STATS : GET_PROTOCOL_STATS,
    {
      variables: multiChainClient.getCosmosChains().includes(chainName) ? 
        { chain: chainName } : undefined,
      pollInterval: 60000, // Poll every minute
    }
  );
}

export function useDailyStats(chainName: string, first: number = 30) {
  return useChainQuery(
    chainName,
    GET_DAILY_STATS,
    {
      variables: { first },
      pollInterval: 300000, // Poll every 5 minutes
    }
  );
}

export function useTokenStats(chainName: string, first: number = 10) {
  // Only available for EVM chains via The Graph
  const isEVMChain = multiChainClient.getEVMChains().includes(chainName);
  
  return useChainQuery(
    chainName,
    GET_TOKEN_STATS,
    {
      variables: { first },
      skip: !isEVMChain,
      pollInterval: 300000, // Poll every 5 minutes
    }
  );
}

// Cross-chain hooks
export function useCrossChainPayments(chainName: string, first: number = 10) {
  return useChainQuery(
    chainName,
    GET_CROSS_CHAIN_PAYMENTS,
    {
      variables: { first },
    }
  );
}

export function useIBCTransfers(chainName: string, first: number = 10) {
  // Only available for Cosmos chains
  const isCosmosChain = multiChainClient.getCosmosChains().includes(chainName);
  
  return useChainQuery(
    chainName,
    GET_IBC_TRANSFERS,
    {
      variables: { first },
      skip: !isCosmosChain,
    }
  );
}

// Search hooks
export function useSearchPayments(searchTerm: string, chainNames?: string[]) {
  const [searchPayments, { data, loading, error }] = useLazyQuery(SEARCH_PAYMENTS);
  const [results, setResults] = useState<Array<{ chain: string; payments: Payment[] }>>([]);
  
  const chains = chainNames || multiChainClient.getAvailableChains();

  const search = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    try {
      const searchResults = await multiChainClient.queryMultipleChains(
        chains,
        SEARCH_PAYMENTS,
        { searchTerm: term }
      );

      const formattedResults = searchResults
        .filter(result => !result.error && result.data.payments?.length > 0)
        .map(result => ({
          chain: result.chain,
          payments: result.data.payments,
        }));

      setResults(formattedResults);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  return {
    search,
    results,
    loading,
    error,
  };
}

// Dispute-related hooks
export function useDisputedPayments(chainName: string, first: number = 10) {
  return useChainQuery<{ payments: Payment[] }>(
    chainName,
    GET_DISPUTED_PAYMENTS,
    {
      variables: { first },
    }
  );
}

// Proof submission hooks
export function useProofSubmissions(paymentId?: string, chainName?: string) {
  return useChainQuery(
    chainName || 'ethereum',
    GET_PROOF_SUBMISSIONS,
    {
      variables: { paymentId },
      skip: !paymentId || !chainName,
    }
  );
}

// Aggregated data hooks
export function useAggregatedStats() {
  const evmChains = multiChainClient.getEVMChains();
  const cosmosChains = multiChainClient.getCosmosChains();
  
  const evmStats = useMultiChainQuery(evmChains, GET_PROTOCOL_STATS);
  const cosmosStats = useMultiChainQuery(
    cosmosChains,
    GET_COSMOS_CHAIN_STATS,
    { chain: cosmosChains[0] } // This would need to be more sophisticated
  );

  const aggregatedData = useMemo(() => {
    const allStats = [...evmStats.data, ...cosmosStats.data];
    
    let totalPayments = 0n;
    let totalVolume = 0n;
    let totalUsers = 0n;
    let totalCrossChainPayments = 0n;
    
    allStats.forEach(({ data, error }) => {
      if (!error && data) {
        const stats = data.protocolStats || data.chainStats;
        if (stats) {
          totalPayments += BigInt(stats.totalPayments || 0);
          totalVolume += BigInt(stats.totalVolume || 0);
          totalUsers += BigInt(stats.totalUsers || 0);
          totalCrossChainPayments += BigInt(stats.totalCrossChainPayments || stats.totalIBCTransfers || 0);
        }
      }
    });

    return {
      totalPayments: totalPayments.toString(),
      totalVolume: totalVolume.toString(),
      totalUsers: totalUsers.toString(),
      totalCrossChainPayments: totalCrossChainPayments.toString(),
      chainBreakdown: allStats.map(({ chain, data, error }) => ({
        chain,
        data: data?.protocolStats || data?.chainStats,
        error,
      })),
    };
  }, [evmStats.data, cosmosStats.data]);

  return {
    data: aggregatedData,
    loading: evmStats.loading || cosmosStats.loading,
    error: evmStats.error || cosmosStats.error,
  };
}