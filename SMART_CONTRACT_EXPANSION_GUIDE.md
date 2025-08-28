# ProofPay Smart Contract Expansion Guide
*From XION CosmWasm to Multi-Chain Solidity + CosmWasm*

## 🎯 Overview

This guide details the expansion of ProofPay's smart contract architecture from XION-only CosmWasm contracts to a comprehensive multi-chain system supporting both Solidity (EVM) and CosmWasm (Cosmos) ecosystems.

## 📊 Current State Analysis

### ✅ Existing CosmWasm Contracts (XION)
```rust
// Current contract structure (inferred from codebase)
lib/
├── contractService.ts     // Contract interaction layer
├── socialContract.ts      // Social features contract calls  
└── userService.ts         // User management
```

### 🎯 Target Multi-Chain Architecture
```
packages/
├── contracts-evm/          # Solidity contracts (5 chains)
│   ├── contracts/
│   ├── deploy/
│   ├── test/
│   └── hardhat.config.ts
├── contracts-cosmwasm/     # CosmWasm contracts (4 chains)
│   ├── src/
│   ├── examples/
│   └── Cargo.toml
└── shared/                 # Common types and interfaces
    ├── types.ts
    └── constants.ts
```

## 🔗 Multi-Chain Contract Architecture

### Core Contract Features (Both Solidity & CosmWasm)

#### 1. User Management
```solidity
// Solidity version
contract ProofPayUsers {
    struct User {
        string username;
        bool isRegistered;
        mapping(address => bool) authorizedAddresses;
        uint256 createdAt;
    }
    
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;
    
    function registerUser(string calldata username) external;
    function addAuthorizedAddress(address newAddress) external;
}
```

```rust
// CosmWasm version
#[cw_serde]
pub struct User {
    pub username: String,
    pub is_registered: bool,
    pub authorized_addresses: Vec<String>,
    pub created_at: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    RegisterUser { username: String },
    AddAuthorizedAddress { address: String },
}
```

#### 2. Payment Processing
```solidity
// Solidity version
contract ProofPayments {
    struct Payment {
        bytes32 id;
        address sender;
        address recipient;
        uint256 amount;
        address token;
        PaymentStatus status;
        ProofType proofType;
        bytes proofData;
        string description;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    enum PaymentStatus { Pending, Completed, Disputed, Cancelled }
    enum ProofType { None, Text, Photo, zkTLS, Hybrid }
    
    function createPayment(PaymentParams calldata params) external returns (bytes32);
    function submitProof(bytes32 paymentId, bytes calldata proof) external;
    function completePayment(bytes32 paymentId) external;
    function disputePayment(bytes32 paymentId, string calldata reason) external;
}
```

```rust
// CosmWasm version
#[cw_serde]
pub struct Payment {
    pub id: String,
    pub sender: String,
    pub recipient: String,
    pub amount: Uint128,
    pub token: String,
    pub status: PaymentStatus,
    pub proof_type: Option<ProofType>,
    pub proof_data: Option<Binary>,
    pub description: Option<String>,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[cw_serde]
pub enum PaymentStatus {
    Pending,
    Completed,
    Disputed,
    Cancelled,
}
```

#### 3. Cross-Chain Integration

##### Solidity - Chainlink CCIP
```solidity
// contracts/evm/ProofPayCCIP.sol
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract ProofPayCCIP is CCIPReceiver, ProofPayments {
    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    
    // Cross-chain payment structure
    struct CrossChainPayment {
        uint64 destinationChain;
        address recipient;
        uint256 amount;
        address token;
        bytes zkProof;
    }
    
    function sendCrossChainPayment(
        CrossChainPayment calldata params
    ) external returns (bytes32 messageId) {
        // Build CCIP message
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(
            params.recipient,
            params.amount,
            params.zkProof
        );
        
        // Calculate and pay fees
        uint256 fee = i_router.getFee(params.destinationChain, message);
        i_linkToken.transferFrom(msg.sender, address(this), fee);
        
        // Send cross-chain message
        messageId = i_router.ccipSend(params.destinationChain, message);
        
        emit CrossChainPaymentSent(messageId, params.destinationChain, params.recipient);
    }
    
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        // Validate source chain and sender
        require(allowedChains[message.sourceChainSelector], "Invalid source chain");
        
        address sender = abi.decode(message.sender, (address));
        require(trustedSenders[sender], "Untrusted sender");
        
        // Process payment
        _processReceivedPayment(message.data);
    }
}
```

##### CosmWasm - IBC Integration
```rust
// contracts/cosmwasm/src/ibc.rs
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_channel_open(
    _deps: DepsMut,
    _env: Env,
    _msg: IbcChannelOpenMsg,
) -> Result<IbcChannelOpenResponse, ContractError> {
    Ok(IbcChannelOpenResponse::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_packet_receive(
    deps: DepsMut,
    _env: Env,
    msg: IbcPacketReceiveMsg,
) -> Result<IbcReceiveResponse, ContractError> {
    let packet: CrossChainPaymentPacket = from_binary(&msg.packet.data)?;
    
    // Validate packet
    validate_cross_chain_packet(&packet)?;
    
    // Process payment
    let payment_id = process_received_payment(deps.storage, packet)?;
    
    Ok(IbcReceiveResponse::new()
        .add_attribute("action", "receive_cross_chain_payment")
        .add_attribute("payment_id", payment_id))
}

#[cw_serde]
pub struct CrossChainPaymentPacket {
    pub sender: String,
    pub recipient: String,
    pub amount: Uint128,
    pub token: String,
    pub proof_data: Option<Binary>,
    pub description: Option<String>,
}
```

## 📦 Package Structure & Setup

### 1. EVM Contracts Package
```bash
# Create EVM contracts package
mkdir -p packages/contracts-evm
cd packages/contracts-evm

# Initialize Hardhat project
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install --save-dev @openzeppelin/contracts
npm install --save-dev @chainlink/contracts
npx hardhat init
```

**packages/contracts-evm/package.json**
```json
{
  "name": "@proofpay/contracts-evm",
  "version": "1.0.0",
  "scripts": {
    "compile": "npx hardhat compile",
    "test": "npx hardhat test",
    "deploy:localhost": "npx hardhat deploy --network localhost",
    "deploy:sepolia": "npx hardhat deploy --network sepolia", 
    "deploy:polygon": "npx hardhat deploy --network polygon",
    "deploy:bsc": "npx hardhat deploy --network bsc",
    "deploy:arbitrum": "npx hardhat deploy --network arbitrum",
    "verify": "npx hardhat verify --network"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "@chainlink/contracts": "^0.8.0"
  },
  "devDependencies": {
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**packages/contracts-evm/hardhat.config.ts**
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    bsc: {
      url: process.env.BSC_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
      bsc: process.env.BSCSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
    },
  },
};

export default config;
```

### 2. CosmWasm Contracts Package
```bash
# Create CosmWasm contracts package
mkdir -p packages/contracts-cosmwasm
cd packages/contracts-cosmwasm

# Initialize Rust project
cargo init --name proofpay-cosmwasm
```

**packages/contracts-cosmwasm/Cargo.toml**
```toml
[package]
name = "proofpay-cosmwasm"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = ["contract"]
contract = []
library = []

[dependencies]
cosmwasm-std = "1.5.0"
cosmwasm-storage = "1.5.0"
cw-storage-plus = "1.2.0"
cw2 = "1.1.0"
schemars = "0.8.16"
serde = { version = "1.0.195", default-features = false, features = ["derive"] }
thiserror = { version = "1.0.56" }

# For IBC
cosmwasm-std = { version = "1.5.0", features = ["ibc3"] }
cw-utils = "1.0.3"

[dev-dependencies]
cosmwasm-vm = "1.5.0"
cw-multi-test = "0.20.0"
```

### 3. Contract Deployment Configuration

**Chain Configuration Matrix**
```typescript
// packages/shared/chains.ts
export const SUPPORTED_CHAINS = {
  // EVM Chains
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    ccipChainSelector: '5009297550715157269',
    deploymentAddress: '',
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL,
    ccipChainSelector: '4051577828743386545',
    deploymentAddress: '',
  },
  BSC: {
    chainId: 56,
    name: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL,
    ccipChainSelector: '11344663589394136015',
    deploymentAddress: '',
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    ccipChainSelector: '4949039107694359620',
    deploymentAddress: '',
  },
  
  // Cosmos Chains
  XION: {
    chainId: 'xion-testnet-1',
    name: 'XION',
    rpcUrl: 'https://rpc.xion-testnet-2.burnt.com:443',
    addressPrefix: 'xion',
    deploymentAddress: '',
  },
  OSMOSIS: {
    chainId: 'osmosis-1',
    name: 'Osmosis',
    rpcUrl: 'https://rpc.osmosis.zone:443',
    addressPrefix: 'osmo',
    deploymentAddress: '',
  },
  NEUTRON: {
    chainId: 'neutron-1',
    name: 'Neutron',
    rpcUrl: 'https://rpc.neutron.org:443',
    addressPrefix: 'neutron',
    deploymentAddress: '',
  },
  JUNO: {
    chainId: 'juno-1', 
    name: 'Juno',
    rpcUrl: 'https://rpc.juno.omniflix.co:443',
    addressPrefix: 'juno',
    deploymentAddress: '',
  },
} as const;
```

## 🚀 Implementation Roadmap

### Phase 1: Core Contract Development (Weeks 1-4)

#### Week 1-2: EVM Contract Foundation
```solidity
// packages/contracts-evm/contracts/ProofPay.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ProofPay is ReentrancyGuard, Ownable {
    // Core payment functionality
    // User management
    // Proof verification
    
    event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address indexed recipient);
    event ProofSubmitted(bytes32 indexed paymentId, ProofType proofType);
    event PaymentCompleted(bytes32 indexed paymentId);
}
```

#### Week 3-4: CosmWasm Contract Migration
```rust
// packages/contracts-cosmwasm/src/contract.rs
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo,
    Response, StdResult, Uint128,
};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Initialize contract state
    // Set up payment system
    // Configure proof verification
}
```

### Phase 2: Cross-Chain Integration (Weeks 5-8)

#### CCIP Integration for EVM
```solidity
// Integration with Chainlink CCIP
function estimateCrossChainFee(
    uint64 destinationChainSelector,
    address token,
    uint256 amount
) external view returns (uint256 fee) {
    Client.EVM2AnyMessage memory message = _buildCCIPMessage(token, amount);
    return i_router.getFee(destinationChainSelector, message);
}
```

#### IBC Integration for Cosmos
```rust
// IBC packet handling for cross-chain payments
pub fn execute_send_ibc_payment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    params: IBCPaymentParams,
) -> Result<Response, ContractError> {
    // Build IBC packet
    // Send to destination chain
    // Track payment status
}
```

### Phase 3: Testing & Deployment (Weeks 9-12)

#### Testing Strategy
```typescript
// packages/contracts-evm/test/ProofPay.test.ts
describe("ProofPay Multi-Chain", function() {
  it("Should handle cross-chain payments", async function() {
    // Test CCIP integration
    // Verify proof systems work
    // Check rate limiting
  });
  
  it("Should integrate with all supported wallets", async function() {
    // Test MetaMask integration
    // Test WalletConnect
    // Test Keplr
  });
});
```

#### Deployment Automation
```bash
#!/bin/bash
# scripts/deploy-all-chains.sh

# Deploy to EVM chains
npm run contracts:evm:deploy:sepolia
npm run contracts:evm:deploy:polygon
npm run contracts:evm:deploy:bsc
npm run contracts:evm:deploy:arbitrum

# Deploy to Cosmos chains
npm run contracts:cosmwasm:deploy:xion
npm run contracts:cosmwasm:deploy:osmosis
npm run contracts:cosmwasm:deploy:neutron
npm run contracts:cosmwasm:deploy:juno

# Update deployment addresses
npm run update-deployment-config
```

## 🛡️ Security Considerations

### Contract Security Checklist
- [ ] **Reentrancy Protection**: All external calls protected
- [ ] **Access Control**: Proper role-based permissions
- [ ] **Rate Limiting**: Per-user and global limits
- [ ] **Input Validation**: All parameters validated
- [ ] **Cross-Chain Security**: Source validation for CCIP/IBC
- [ ] **Upgrade Patterns**: Safe upgrade mechanisms
- [ ] **Emergency Controls**: Circuit breakers implemented

### Audit Requirements
```typescript
// Security audit checklist
interface SecurityAudit {
  staticAnalysis: {
    slither: boolean;          // For Solidity
    clippy: boolean;           // For Rust
  };
  
  dynamicTesting: {
    fuzzing: boolean;
    integrationTests: boolean;
    crossChainTests: boolean;
  };
  
  thirdPartyAudit: {
    contractAuditor: string;
    reportDate: Date;
    issues: SecurityIssue[];
  };
}
```

## 📊 Gas Optimization & Cost Analysis

### EVM Gas Optimization
```solidity
// Gas-optimized storage patterns
struct PackedPayment {
    address sender;           // 20 bytes
    address recipient;        // 20 bytes  
    uint96 amount;           // 12 bytes (packed with addresses in single slot)
    uint32 createdAt;        // 4 bytes
    PaymentStatus status;     // 1 byte (enum)
    ProofType proofType;     // 1 byte (enum)
}
```

### Cross-Chain Cost Matrix
| Route | Estimated Fee | Speed | Security |
|-------|--------------|--------|----------|
| Ethereum → Polygon | $5-15 | 5-10 min | High |
| Polygon → BSC | $3-8 | 3-7 min | High |
| XION → Osmosis | $0.1-0.5 | 1-3 min | High |
| Osmosis → Neutron | $0.05-0.2 | 30s-2min | High |

## 🚀 Migration Strategy

### Gradual Rollout Plan
1. **Phase 1**: Deploy testnets for all chains
2. **Phase 2**: Soft launch on mainnets (limited users)
3. **Phase 3**: Full production launch
4. **Phase 4**: Advanced features (analytics, governance)

### Data Migration
```typescript
// Migrate existing XION data to multi-chain structure
interface MigrationPlan {
  users: {
    preserveUsernames: boolean;
    addMultiChainAddresses: boolean;
  };
  
  payments: {
    maintainHistory: boolean;
    addChainMetadata: boolean;
  };
  
  proofs: {
    migrateZkTLSData: boolean;
    enhanceVerification: boolean;
  };
}
```

---

## 🎯 Success Metrics

### Technical KPIs
- **Contract Deployment**: 9 chains (5 EVM + 4 Cosmos) ✅
- **Transaction Success Rate**: >99% across all chains
- **Average Cross-Chain Time**: <10 minutes
- **Gas Efficiency**: <200k gas per payment on Ethereum

### Security KPIs  
- **Zero Critical Vulnerabilities**: Post-audit
- **Emergency Response Time**: <1 hour
- **Multi-Signature Coverage**: 100% of admin functions

### User Experience KPIs
- **Wallet Integration**: 4 wallets supported
- **Chain Abstraction**: Users don't see chain complexity
- **Proof Adoption**: >50% payments include verification

This comprehensive guide provides the blueprint for expanding ProofPay's smart contract architecture from XION-only to a true multi-chain platform supporting both EVM and Cosmos ecosystems.

**Ready to build the future of verified payments across all blockchains? Let's get started!** 🚀