# ProofPay Technical Architecture
*Comprehensive System Design for Multi-Chain P2P Payments*

## 🏗️ System Overview

ProofPay is a multi-chain peer-to-peer payment platform with mathematical proof verification, deployed across EVM and Cosmos ecosystems.

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Smart Contracts │    │   Infrastructure │
│  (React Native) │◄──►│ (Multi-Chain)   │◄──►│   (Indexing)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📱 Frontend Architecture

### React Native Application
```
ProofPay/
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx           # Dashboard & balance
│   │   ├── send.tsx           # Payment creation
│   │   ├── activity.tsx       # Transaction history
│   │   └── profile.tsx        # User settings
│   ├── payment/
│   │   ├── [id].tsx          # Payment details
│   │   └── proof.tsx         # Proof submission
│   └── onboarding/
│       ├── wallet-setup.tsx  # Wallet connection
│       └── username.tsx      # Username registration
├── components/
│   ├── wallets/
│   │   ├── WalletManager.tsx  # Multi-wallet abstraction
│   │   ├── MetaMaskConnector.tsx
│   │   ├── WalletConnectConnector.tsx
│   │   ├── KeplrConnector.tsx
│   │   └── AbstraxionConnector.tsx
│   ├── payments/
│   │   ├── PaymentForm.tsx    # Universal payment UI
│   │   ├── ChainSelector.tsx  # Chain switching
│   │   ├── CrossChainBridge.tsx # CCIP integration
│   │   └── ProofSelector.tsx  # zkTLS proof types
│   └── shared/
│       ├── ChainBadge.tsx     # Chain indicators
│       ├── TokenBalance.tsx   # Multi-chain balances
│       └── TransactionStatus.tsx # Real-time updates
└── services/
    ├── blockchain/
    │   ├── ChainService.ts    # Chain abstraction
    │   ├── ContractService.ts # Smart contract calls
    │   └── CCIPService.ts     # Cross-chain payments
    ├── proof/
    │   ├── zkTLSService.ts    # Proof generation
    │   └── ProofValidator.ts  # Proof verification
    └── api/
        ├── IndexerAPI.ts      # Multi-chain data
        └── NotificationAPI.ts # Real-time updates
```

### State Management
```typescript
// Global app state
interface AppState {
  user: {
    profile: UserProfile;
    addresses: ChainAddresses;
    preferences: UserPreferences;
  };
  wallets: {
    connected: ConnectedWallet[];
    active: WalletType;
    balances: MultiChainBalances;
  };
  payments: {
    history: Transaction[];
    pending: PendingTransaction[];
    friends: Friend[];
  };
  chains: {
    supported: Chain[];
    active: ChainId;
    status: ChainStatus[];
  };
}
```

## 🔗 Smart Contract Architecture

### EVM Contracts (Solidity)

#### Core ProofPay Contract
```solidity
// contracts/evm/ProofPay.sol
contract ProofPay is CCIPReceiver, Ownable, ReentrancyGuard {
    // Core data structures
    struct User {
        string username;
        bool isRegistered;
        mapping(address => bool) authorizedAddresses;
    }
    
    struct Payment {
        bytes32 id;
        address sender;
        address recipient;
        uint256 amount;
        address token;
        PaymentStatus status;
        ProofType proofType;
        bytes proofData;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    enum PaymentStatus { Pending, Completed, Disputed, Cancelled }
    enum ProofType { None, Text, Photo, zkTLS, Hybrid }
    
    // Core functions
    function registerUser(string calldata username) external;
    function sendPayment(PaymentParams calldata params) external;
    function submitProof(bytes32 paymentId, bytes calldata proof) external;
    function completePayment(bytes32 paymentId) external;
    
    // Cross-chain functions
    function sendCrossChainPayment(
        uint64 destinationChain,
        address recipient,
        uint256 amount,
        address token,
        bytes calldata zkProof
    ) external;
    
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override;
}
```

#### CCIP Integration
```solidity
// contracts/evm/CCIPIntegration.sol
contract CCIPIntegration {
    IRouterClient private immutable router;
    IERC20 private immutable linkToken;
    
    function estimateFee(
        uint64 destinationChain,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external view returns (uint256) {
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(
            recipient, amount, data
        );
        return router.getFee(destinationChain, message);
    }
    
    function sendCrossChainMessage(
        uint64 destinationChain,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(
            recipient, amount, data
        );
        
        uint256 fee = router.getFee(destinationChain, message);
        linkToken.transferFrom(msg.sender, address(this), fee);
        
        return router.ccipSend(destinationChain, message);
    }
}
```

### Cosmos Contracts (CosmWasm)

#### Core ProofPay Contract
```rust
// contracts/cosmwasm/src/contract.rs
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Initialize contract state
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RegisterUser { username } => register_user(deps, info, username),
        ExecuteMsg::SendPayment { payment_params } => send_payment(deps, env, info, payment_params),
        ExecuteMsg::SubmitProof { payment_id, proof } => submit_proof(deps, info, payment_id, proof),
        ExecuteMsg::CompletePayment { payment_id } => complete_payment(deps, info, payment_id),
        ExecuteMsg::SendIBCPayment { params } => send_ibc_payment(deps, env, info, params),
    }
}

// Cross-chain IBC integration
pub fn send_ibc_payment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    params: IBCPaymentParams,
) -> Result<Response, ContractError> {
    // IBC channel communication
    let ibc_msg = IbcMsg::SendPacket {
        channel_id: params.channel_id,
        data: to_binary(&params.payment_data)?,
        timeout: env.block.time.plus_seconds(3600).into(),
    };
    
    Ok(Response::new()
        .add_message(ibc_msg)
        .add_attribute("action", "send_ibc_payment"))
}
```

## 🗄️ Database Schema

### PostgreSQL Multi-Chain Schema
```sql
-- Users table (chain-agnostic)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User addresses across chains
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    chain_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    wallet_type VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chain_id, address)
);

-- Multi-chain payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(66) NOT NULL, -- blockchain tx hash
    chain_id INTEGER NOT NULL,
    sender_address TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    sender_username VARCHAR(50),
    recipient_username VARCHAR(50),
    amount DECIMAL(36,18) NOT NULL,
    token_address TEXT,
    token_symbol VARCHAR(10),
    payment_type VARCHAR(20) NOT NULL,
    proof_type VARCHAR(20),
    proof_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    INDEX(chain_id, payment_id),
    INDEX(sender_address),
    INDEX(recipient_address)
);

-- Cross-chain transactions
CREATE TABLE cross_chain_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_payment_id UUID REFERENCES payments(id),
    destination_payment_id UUID REFERENCES payments(id),
    bridge_provider VARCHAR(20) NOT NULL, -- 'ccip', 'axelar', etc.
    bridge_tx_hash TEXT,
    source_chain_id INTEGER NOT NULL,
    destination_chain_id INTEGER NOT NULL,
    bridge_fee DECIMAL(36,18),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Friends/Contacts
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id),
    user2_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Proof verification records
CREATE TABLE proof_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    proof_type VARCHAR(20) NOT NULL,
    proof_hash TEXT,
    verification_result JSONB,
    verified_at TIMESTAMP DEFAULT NOW(),
    verifier_address TEXT
);
```

## 🔄 API Architecture

### RESTful API Endpoints
```typescript
// Multi-chain unified API
interface APIEndpoints {
  // User management
  'POST /users': CreateUser;
  'GET /users/:username': GetUser;
  'PUT /users/:id': UpdateUser;
  
  // Payments
  'POST /payments': CreatePayment;
  'GET /payments': GetPayments;
  'GET /payments/:id': GetPayment;
  'PUT /payments/:id/proof': SubmitProof;
  
  // Cross-chain
  'POST /cross-chain/estimate': EstimateFee;
  'POST /cross-chain/send': SendCrossChain;
  'GET /cross-chain/:id/status': GetBridgeStatus;
  
  // Balances
  'GET /balances/:address': GetMultiChainBalance;
  'GET /chains': GetSupportedChains;
  
  // Social features
  'POST /friends/request': SendFriendRequest;
  'GET /friends': GetFriends;
  'POST /friends/search': SearchUsers;
}
```

### WebSocket Real-Time Updates
```typescript
// Real-time event system
interface WebSocketEvents {
  // Payment updates
  'payment:created': PaymentCreatedEvent;
  'payment:completed': PaymentCompletedEvent;
  'payment:disputed': PaymentDisputedEvent;
  
  // Cross-chain updates
  'bridge:initiated': BridgeInitiatedEvent;
  'bridge:completed': BridgeCompletedEvent;
  'bridge:failed': BridgeFailedEvent;
  
  // Balance updates
  'balance:updated': BalanceUpdatedEvent;
  
  // Social updates
  'friend:request': FriendRequestEvent;
  'friend:accepted': FriendAcceptedEvent;
}
```

## 🔍 Data Indexing Architecture

### Multi-Chain Event Indexing
```typescript
// Event indexing system
class MultiChainIndexer {
  private evmIndexer: TheGraphIndexer;
  private cosmosIndexer: SubQueryIndexer;
  private database: PostgreSQL;
  
  async startIndexing() {
    // EVM chains (Ethereum, Polygon, etc.)
    await this.evmIndexer.subscribeToEvents([
      'PaymentCreated',
      'PaymentCompleted', 
      'ProofSubmitted',
      'UserRegistered'
    ]);
    
    // Cosmos chains (XION, Osmosis, etc.)
    await this.cosmosIndexer.subscribeToEvents([
      'payment_created',
      'payment_completed',
      'proof_submitted', 
      'user_registered'
    ]);
  }
  
  async processEvent(event: ChainEvent) {
    // Normalize event data across chains
    const normalizedEvent = this.normalizeEvent(event);
    
    // Store in unified database
    await this.database.storeEvent(normalizedEvent);
    
    // Emit real-time update
    this.websocket.emit(normalizedEvent.type, normalizedEvent.data);
  }
}
```

### Chain-Specific Indexers
```yaml
# The Graph subgraph for EVM chains
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: ProofPay
    network: ethereum
    source:
      address: "0x..." # ProofPay contract address
      abi: ProofPay
      startBlock: 18500000
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Payment
        - User
        - Proof
      eventHandlers:
        - event: PaymentCreated(indexed bytes32,indexed address,indexed address,uint256)
          handler: handlePaymentCreated
        - event: ProofSubmitted(indexed bytes32,bytes)
          handler: handleProofSubmitted
```

## 🛡️ Security Architecture

### Multi-Signature Contract Management
```solidity
// Multi-sig for contract upgrades across chains
contract ProofPayMultiSig {
    mapping(address => bool) public isOwner;
    mapping(bytes32 => uint256) public confirmations;
    uint256 public requiredConfirmations = 3;
    
    modifier onlyOwners() {
        require(isOwner[msg.sender], "Not authorized");
        _;
    }
    
    function proposeUpgrade(
        address contractAddress,
        bytes calldata upgradeData
    ) external onlyOwners returns (bytes32 proposalId) {
        // Multi-chain upgrade coordination
    }
}
```

### Rate Limiting & Anti-Abuse
```typescript
// Rate limiting for cross-chain operations
interface RateLimiter {
  // Per user limits
  userDailyLimit: Map<string, number>; // $10,000/day
  userHourlyLimit: Map<string, number>; // $1,000/hour
  
  // Per chain limits
  chainDailyVolume: Map<number, number>; // $1M/day per chain
  
  // Global limits
  totalDailyVolume: number; // $10M/day across all chains
}
```

## 🔧 DevOps & Infrastructure

### Multi-Chain Deployment Pipeline
```yaml
# GitHub Actions deployment
name: Multi-Chain Deployment
on:
  push:
    branches: [main]

jobs:
  deploy-evm:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        chain: [ethereum, polygon, bsc, arbitrum]
    steps:
      - name: Deploy to ${{ matrix.chain }}
        run: |
          npx hardhat deploy --network ${{ matrix.chain }}
          npx hardhat verify --network ${{ matrix.chain }}
  
  deploy-cosmos:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        chain: [xion, osmosis, neutron, juno]
    steps:
      - name: Build CosmWasm
        run: cargo wasm
      - name: Deploy to ${{ matrix.chain }}
        run: |
          wasmd tx wasm store contract.wasm
          wasmd tx wasm instantiate $CODE_ID
```

### Monitoring & Alerting
```typescript
// Multi-chain monitoring system
interface MonitoringSystem {
  // Health checks
  chainHealth: Map<number, ChainStatus>;
  contractHealth: Map<string, ContractStatus>;
  bridgeHealth: Map<string, BridgeStatus>;
  
  // Performance metrics
  transactionTimes: Map<number, number[]>;
  successRates: Map<number, number>;
  gasUsage: Map<number, BigNumber>;
  
  // Security alerts
  suspiciousActivity: Alert[];
  failedTransactions: FailedTx[];
  bridgeFailures: BridgeFailure[];
}
```

## 📊 Analytics & Metrics

### Business Intelligence Dashboard
```sql
-- Key metrics queries
-- Daily active users across all chains
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT sender_address) as active_users,
  chain_id
FROM payments 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), chain_id;

-- Cross-chain payment volume
SELECT 
  source_chain_id,
  destination_chain_id,
  COUNT(*) as payment_count,
  SUM(amount) as total_volume
FROM cross_chain_payments
WHERE status = 'completed'
GROUP BY source_chain_id, destination_chain_id;

-- Proof type adoption
SELECT 
  proof_type,
  COUNT(*) as usage_count,
  AVG(amount) as avg_amount
FROM payments 
WHERE proof_type IS NOT NULL
GROUP BY proof_type;
```

## 🚀 Scalability Considerations

### Horizontal Scaling Strategy
```
Load Balancer
├── API Gateway (Multi-region)
│   ├── US-East (Primary)
│   ├── EU-West (Secondary)  
│   └── Asia-Pacific (Tertiary)
├── Database Cluster
│   ├── Master (Write)
│   ├── Read Replicas (3x)
│   └── Archive (Historical data)
└── Indexing Cluster
    ├── EVM Indexers (5x)
    ├── Cosmos Indexers (4x)
    └── Data Processors (10x)
```

### Caching Strategy
```typescript
// Multi-layer caching
interface CacheStrategy {
  // Level 1: In-memory (Redis)
  userProfiles: Cache<string, UserProfile>; // 5min TTL
  balances: Cache<string, Balance[]>; // 30sec TTL
  
  // Level 2: CDN (CloudFlare)
  staticAssets: CDNCache; // 24hr TTL
  chainMetadata: CDNCache; // 1hr TTL
  
  // Level 3: Database query cache
  paymentHistory: QueryCache; // 5min TTL
  friendsLists: QueryCache; // 10min TTL
}
```

This technical architecture document provides the detailed blueprint for implementing ProofPay's multi-chain infrastructure. It covers all major system components from smart contracts to databases, APIs, and deployment strategies.