# ProofPay Development Guide
*Complete Setup and Development Instructions*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Rust 1.70+ (for CosmWasm contracts)
- Foundry/Hardhat (for Solidity contracts)
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

## 📦 Repository Structure

```
proofpay/
├── apps/
│   ├── mobile/                 # React Native app
│   ├── web/                    # Web dashboard (optional)
│   └── api/                    # Backend API
├── packages/
│   ├── contracts-evm/          # Solidity contracts
│   ├── contracts-cosmwasm/     # CosmWasm contracts
│   ├── shared/                 # Shared TypeScript types
│   └── indexer/               # Multi-chain indexing
├── docs/                      # Documentation
├── scripts/                   # Deployment scripts
└── docker-compose.yml         # Local development
```

## 🛠️ Environment Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-org/proofpay
cd proofpay
npm install
```

### 2. Environment Variables
```bash
# Copy template files
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/api/.env.example apps/api/.env
```

### 3. Required Environment Variables

#### Mobile App (.env)
```bash
# Wallet Configuration
EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Chain Configuration
EXPO_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-key
EXPO_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.alchemyapi.io/v2/your-key
EXPO_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443

# Contract Addresses
EXPO_PUBLIC_ETHEREUM_PROOFPAY_ADDRESS=0x...
EXPO_PUBLIC_POLYGON_PROOFPAY_ADDRESS=0x...
EXPO_PUBLIC_XION_PROOFPAY_ADDRESS=xion1...

# CCIP Configuration  
EXPO_PUBLIC_CCIP_ROUTER_ETHEREUM=0x...
EXPO_PUBLIC_CCIP_ROUTER_POLYGON=0x...

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3001
```

#### Backend API (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/proofpay
REDIS_URL=redis://localhost:6379

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-key
POLYGON_RPC_URL=https://polygon-mainnet.alchemyapi.io/v2/your-key
XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443

# Indexing Services
THE_GRAPH_API_KEY=your_graph_api_key
SUBQUERY_ENDPOINT=https://api.subquery.network/sq/your-project

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
ONESIGNAL_APP_ID=your_onesignal_app_id
```

## 🏗️ Development Setup

### 1. Start Infrastructure
```bash
# Start PostgreSQL, Redis, and other services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

### 2. Smart Contract Development

#### EVM Contracts (Solidity)
```bash
cd packages/contracts-evm

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node # Terminal 1
npx hardhat deploy --network localhost # Terminal 2

# Deploy to testnets
npx hardhat deploy --network sepolia
npx hardhat deploy --network polygon-mumbai
```

#### CosmWasm Contracts (Rust)
```bash
cd packages/contracts-cosmwasm

# Install dependencies
cargo build

# Run tests
cargo test

# Optimize for deployment
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.13

# Deploy to testnet
wasmd tx wasm store artifacts/proofpay.wasm --from wallet --chain-id xion-testnet-2
```

### 3. Backend API Development
```bash
cd apps/api

# Install dependencies
npm install

# Start development server
npm run dev

# Run in watch mode with auto-restart
npm run dev:watch

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### 4. Mobile App Development
```bash
cd apps/mobile

# Install dependencies
npm install

# Start Metro bundler
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on web (for testing)
npx expo start --web
```

## 📱 Mobile Development Workflow

### Testing on Different Networks
```typescript
// Switch between networks for testing
const NETWORKS = {
  development: {
    ethereum: 'http://127.0.0.1:8545',
    polygon: 'https://rpc-mumbai.polygon.technology',
    xion: 'https://rpc.xion-testnet-2.burnt.com:443'
  },
  staging: {
    ethereum: 'https://sepolia.infura.io/v3/your-key',
    polygon: 'https://rpc-mumbai.polygon.technology', 
    xion: 'https://rpc.xion-testnet-2.burnt.com:443'
  },
  production: {
    ethereum: 'https://mainnet.infura.io/v3/your-key',
    polygon: 'https://polygon-rpc.com',
    xion: 'https://rpc.xion-mainnet.burnt.com:443'
  }
};
```

### Wallet Integration Testing
```bash
# Test different wallet connections
npm run test:wallets:metamask
npm run test:wallets:walletconnect
npm run test:wallets:keplr
npm run test:wallets:abstraxion
```

### Cross-Chain Payment Testing
```bash
# Test CCIP integration
npm run test:ccip:ethereum-to-polygon
npm run test:ccip:polygon-to-arbitrum

# Test proof verification
npm run test:proofs:zktls
npm run test:proofs:hybrid
```

## 🔧 Smart Contract Development

### Contract Testing Strategy
```solidity
// Test file example: test/ProofPay.test.js
describe("ProofPay Cross-Chain", function() {
  it("Should send cross-chain payment with proof", async function() {
    const { proofPay, mockCCIP } = await loadFixture(deployProofPayFixture);
    
    // Test cross-chain payment
    await expect(
      proofPay.sendCrossChainPayment(
        POLYGON_CHAIN_SELECTOR,
        recipient,
        ethers.utils.parseEther("100"),
        mockProofData
      )
    ).to.emit(proofPay, "CrossChainPaymentSent");
  });
});
```

### Gas Optimization
```bash
# Analyze gas usage
npx hardhat test --gas-report

# Size optimization
npx hardhat size-contracts

# Run slither security analysis
slither packages/contracts-evm/contracts/
```

## 🗄️ Database Development

### Schema Management
```bash
# Create new migration
npm run db:migration:create add_cross_chain_payments

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:rollback

# Reset database (CAUTION: deletes all data)
npm run db:reset
```

### Sample Migration
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  chain_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  wallet_type VARCHAR(20) NOT NULL,
  UNIQUE(chain_id, address)
);

-- Add indexes
CREATE INDEX idx_user_addresses_chain_id ON user_addresses(chain_id);
CREATE INDEX idx_user_addresses_address ON user_addresses(address);
```

## 🔍 Indexing Development

### Setting up The Graph
```bash
cd packages/indexer/evm

# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Initialize subgraph
graph init --product hosted-service your-org/proofpay

# Build subgraph
graph build

# Deploy to hosted service
graph deploy --product hosted-service your-org/proofpay
```

### SubGraph Schema
```graphql
# schema.graphql
type User @entity {
  id: ID!
  username: String!
  payments: [Payment!]! @derivedFrom(field: "sender")
  createdAt: BigInt!
}

type Payment @entity {
  id: ID!
  sender: User!
  recipient: String!
  amount: BigInt!
  token: String!
  proofType: String
  proofData: Bytes
  status: String!
  createdAt: BigInt!
}
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:contracts
npm run test:api  
npm run test:mobile

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test full payment flow
npm run test:integration:payment-flow

# Test cross-chain flow  
npm run test:integration:cross-chain

# Test wallet integration
npm run test:integration:wallets
```

### E2E Tests (Mobile)
```bash
# Install Detox
npm install -g detox-cli

# Build for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

## 🚀 Deployment

### Smart Contract Deployment
```bash
# Deploy to all testnets
npm run deploy:testnets

# Deploy to specific network
npx hardhat deploy --network ethereum --tags ProofPay

# Verify contracts
npm run verify:ethereum
npm run verify:polygon
```

### Backend Deployment
```bash
# Build production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Run database migrations on production
npm run db:migrate:production
```

### Mobile App Deployment
```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 🐛 Debugging

### Common Issues

#### Wallet Connection Issues
```typescript
// Debug wallet connections
const debugWalletConnection = async (walletType: WalletType) => {
  console.log(`Testing ${walletType} connection...`);
  
  try {
    const wallet = await connectWallet(walletType);
    console.log(`✅ ${walletType} connected:`, wallet.address);
  } catch (error) {
    console.error(`❌ ${walletType} failed:`, error);
  }
};
```

#### Cross-Chain Payment Issues
```bash
# Check CCIP transaction status
npm run debug:ccip:transaction 0x...

# Verify contract addresses
npm run debug:contracts:verify

# Check indexer sync status
npm run debug:indexer:status
```

#### Performance Issues
```bash
# Profile React Native performance
npx react-native profile-hermes

# Analyze bundle size
npx expo export --dump-assetmap

# Database query performance
npm run debug:db:slow-queries
```

## 📊 Monitoring & Logging

### Application Monitoring
```typescript
// Error tracking
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn'
});

// Performance monitoring
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('proofpay-mobile');
```

### Blockchain Monitoring
```bash
# Monitor contract events
npm run monitor:contracts

# Check transaction status
npm run monitor:transactions

# Monitor gas prices
npm run monitor:gas-prices
```

## 🔐 Security Best Practices

### Code Security
```bash
# Run security audits
npm audit
npm run security:contracts
npm run security:dependencies

# Static analysis
npx eslint packages/shared/src --ext .ts,.tsx
slither packages/contracts-evm/contracts/
```

### Environment Security
```bash
# Never commit sensitive keys
echo ".env*" >> .gitignore
echo "*.pem" >> .gitignore

# Use environment-specific configs
npm run config:staging
npm run config:production
```

## 📚 Additional Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Hardhat Docs](https://hardhat.org/docs)
- [CosmWasm Docs](https://docs.cosmwasm.com/)
- [Chainlink CCIP Docs](https://docs.chain.link/ccip)

### Community
- [ProofPay Discord](https://discord.gg/proofpay)
- [Development Discussions](https://github.com/your-org/proofpay/discussions)
- [Bug Reports](https://github.com/your-org/proofpay/issues)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/awesome-feature`
3. Commit changes: `git commit -m 'Add awesome feature'`
4. Push branch: `git push origin feature/awesome-feature`
5. Create Pull Request

### Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

### Pull Request Checklist
- [ ] Tests pass (`npm run test`)
- [ ] Code formatted (`npm run format`)
- [ ] No lint errors (`npm run lint`)
- [ ] Documentation updated
- [ ] Change log updated