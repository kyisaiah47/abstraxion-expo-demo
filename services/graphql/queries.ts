import { gql } from '@apollo/client';

// User-related queries
export const GET_USER = gql`
  query GetUser($address: String!, $chain: String) {
    user(id: $address) {
      id
      address
      username
      metadata
      totalPaymentsSent
      totalPaymentsReceived
      totalAmountSent
      totalAmountReceived
      createdAt
      updatedAt
      paymentsCreated {
        id
        paymentId
        recipient {
          id
          address
          username
        }
        amount
        status
        createdAt
      }
      paymentsReceived {
        id
        paymentId
        sender {
          id
          address
          username
        }
        amount
        status
        createdAt
      }
    }
  }
`;

export const GET_USER_PAYMENTS = gql`
  query GetUserPayments(
    $address: String!
    $first: Int = 10
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
  ) {
    paymentsCreated: payments(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { sender: $address }
    ) {
      id
      paymentId
      recipient {
        id
        address
        username
      }
      amount
      status
      proofType
      createdAt
      completedAt
      transactionHash
    }
    
    paymentsReceived: payments(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { recipient: $address }
    ) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      amount
      status
      proofType
      createdAt
      completedAt
      transactionHash
    }
  }
`;

// Payment-related queries
export const GET_PAYMENT = gql`
  query GetPayment($paymentId: String!) {
    payment(id: $paymentId) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      recipient {
        id
        address
        username
      }
      amount
      token
      status
      proofType
      proofData
      createdAt
      completedAt
      cancelledAt
      disputedAt
      transactionHash
      blockNumber
      proofSubmissions {
        id
        submitter {
          id
          address
          username
        }
        proofType
        proofData
        submittedAt
        transactionHash
      }
      disputes {
        id
        disputant {
          id
          address
          username
        }
        reason
        resolved
        resolution
        resolvedBy
        createdAt
        resolvedAt
        transactionHash
      }
      crossChainDestination
      crossChainRecipient
    }
  }
`;

export const GET_PAYMENTS = gql`
  query GetPayments(
    $first: Int = 10
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
    $where: PaymentFilter
  ) {
    payments(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      recipient {
        id
        address
        username
      }
      amount
      token
      status
      proofType
      createdAt
      completedAt
      transactionHash
    }
  }
`;

export const GET_RECENT_PAYMENTS = gql`
  query GetRecentPayments($first: Int = 20) {
    payments(
      first: $first
      orderBy: "createdAt"
      orderDirection: "desc"
    ) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      recipient {
        id
        address
        username
      }
      amount
      status
      createdAt
      transactionHash
    }
  }
`;

// Statistics queries
export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "protocol-stats") {
      id
      totalPayments
      totalVolume
      totalUsers
      totalProofSubmissions
      totalDisputes
      totalCrossChainPayments
      lastUpdated
    }
  }
`;

export const GET_DAILY_STATS = gql`
  query GetDailyStats(
    $first: Int = 30
    $orderBy: String = "date"
    $orderDirection: String = "desc"
  ) {
    dailyStats(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      date
      totalPayments
      totalVolume
      totalUsers
      averagePaymentSize
      completedPayments
      disputedPayments
      crossChainPayments
    }
  }
`;

export const GET_TOKEN_STATS = gql`
  query GetTokenStats($first: Int = 10) {
    tokenStats(
      first: $first
      orderBy: "totalVolume"
      orderDirection: "desc"
    ) {
      id
      token
      symbol
      decimals
      totalVolume
      totalPayments
      lastUpdated
    }
  }
`;

// Cross-chain queries
export const GET_CROSS_CHAIN_PAYMENTS = gql`
  query GetCrossChainPayments(
    $first: Int = 10
    $skip: Int = 0
    $orderBy: String = "initiatedAt"
    $orderDirection: String = "desc"
  ) {
    crossChainPayments(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      payment {
        id
        paymentId
        sender {
          id
          address
          username
        }
        amount
        status
      }
      destinationChainSelector
      destinationRecipient
      ccipMessageId
      status
      initiatedAt
      confirmedAt
      transactionHash
    }
  }
`;

// Cosmos-specific queries (for SubQuery)
export const GET_COSMOS_USER = gql`
  query GetCosmosUser($address: String!, $chain: String!) {
    user(id: $chain) {
      id
      address
      username
      metadata
      chain
      totalPaymentsSent
      totalPaymentsReceived
      totalAmountSent
      totalAmountReceived
      createdAt
      updatedAt
    }
  }
`;

export const GET_COSMOS_PAYMENTS = gql`
  query GetCosmosPayments(
    $first: Int = 10
    $offset: Int = 0
    $orderBy: [PaymentsOrderBy!] = [CREATED_AT_DESC]
    $filter: PaymentFilter
  ) {
    payments(
      first: $first
      offset: $offset
      orderBy: $orderBy
      filter: $filter
    ) {
      nodes {
        id
        paymentId
        sender {
          id
          address
          username
        }
        recipient {
          id
          address
          username
        }
        amount
        denom
        status
        proofType
        chain
        createdAt
        completedAt
        transactionHash
        blockHeight
      }
      totalCount
    }
  }
`;

export const GET_COSMOS_CHAIN_STATS = gql`
  query GetCosmosChainStats($chain: String!) {
    chainStats(id: $chain) {
      id
      chain
      totalPayments
      totalVolume
      totalUsers
      totalProofSubmissions
      totalDisputes
      totalIBCTransfers
      contractAddress
      lastUpdated
    }
  }
`;

export const GET_IBC_TRANSFERS = gql`
  query GetIBCTransfers(
    $first: Int = 10
    $offset: Int = 0
    $orderBy: [IbcTransfersOrderBy!] = [CREATED_AT_DESC]
  ) {
    ibcTransfers(
      first: $first
      offset: $offset
      orderBy: $orderBy
    ) {
      nodes {
        id
        payment {
          id
          paymentId
          amount
          denom
        }
        sourceChain
        destinationChain
        sourceChannel
        destinationChannel
        sender
        receiver
        amount
        denom
        packetSequence
        status
        createdAt
        acknowledgedAt
        transactionHash
        acknowledgmentTxHash
      }
    }
  }
`;

// Search and filter helpers
export const SEARCH_PAYMENTS = gql`
  query SearchPayments(
    $searchTerm: String!
    $first: Int = 10
    $skip: Int = 0
  ) {
    payments(
      first: $first
      skip: $skip
      where: {
        or: [
          { paymentId_contains: $searchTerm }
          { sender_: { username_contains: $searchTerm } }
          { recipient_: { username_contains: $searchTerm } }
          { sender_: { address_contains: $searchTerm } }
          { recipient_: { address_contains: $searchTerm } }
          { transactionHash_contains: $searchTerm }
        ]
      }
      orderBy: "createdAt"
      orderDirection: "desc"
    ) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      recipient {
        id
        address
        username
      }
      amount
      status
      createdAt
      transactionHash
    }
  }
`;

export const GET_DISPUTED_PAYMENTS = gql`
  query GetDisputedPayments($first: Int = 10, $skip: Int = 0) {
    payments(
      first: $first
      skip: $skip
      where: { status: "DISPUTED" }
      orderBy: "disputedAt"
      orderDirection: "desc"
    ) {
      id
      paymentId
      sender {
        id
        address
        username
      }
      recipient {
        id
        address
        username
      }
      amount
      status
      disputedAt
      disputes {
        id
        disputant {
          id
          address
          username
        }
        reason
        resolved
        createdAt
      }
    }
  }
`;

// Proof submission queries
export const GET_PROOF_SUBMISSIONS = gql`
  query GetProofSubmissions(
    $paymentId: String
    $first: Int = 10
    $skip: Int = 0
  ) {
    proofSubmissions(
      first: $first
      skip: $skip
      where: { payment: $paymentId }
      orderBy: "submittedAt"
      orderDirection: "desc"
    ) {
      id
      payment {
        id
        paymentId
        status
      }
      submitter {
        id
        address
        username
      }
      proofType
      proofData
      submittedAt
      transactionHash
      blockNumber
    }
  }
`;

// Export all queries as a collection
export const QUERIES = {
  // User queries
  GET_USER,
  GET_USER_PAYMENTS,
  GET_COSMOS_USER,

  // Payment queries
  GET_PAYMENT,
  GET_PAYMENTS,
  GET_RECENT_PAYMENTS,
  GET_COSMOS_PAYMENTS,
  SEARCH_PAYMENTS,
  GET_DISPUTED_PAYMENTS,

  // Statistics queries
  GET_PROTOCOL_STATS,
  GET_DAILY_STATS,
  GET_TOKEN_STATS,
  GET_COSMOS_CHAIN_STATS,

  // Cross-chain queries
  GET_CROSS_CHAIN_PAYMENTS,
  GET_IBC_TRANSFERS,

  // Proof queries
  GET_PROOF_SUBMISSIONS,
};