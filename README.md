# Proof of Work - Social Payments Platform

A blockchain-powered social payment app that revolutionizes how friends handle money with built-in verification and accountability.

## 🚀 Overview

Proof of Work combines the simplicity of Venmo with the security of blockchain verification. Send payments, request money, and create verifiable tasks with cryptographic proof - all within your social network.

**"Venmo meets mathematics"** - Simple P2P payments with zero-knowledge proof verification for complete transparency.

## ✨ Key Features

### 🔄 Three Payment Flows

- **Task Requests**: "Help me move furniture for $50" - request work with verifiable completion
- **Payment Requests**: "You owe me $20 for dinner" - request money with optional proof
- **Direct Payments**: "Thanks for helping!" - send money with optional verification

### 🛡️ Proof Verification System

- **Text Proof**: Simple description of work completed
- **Photo Proof**: Visual confirmation with image upload
- **zkTLS Verification**: Advanced cryptographic proof using zero-knowledge protocols
- **No Proof**: Trust-based payments for close friends

### 👥 Social Network

- Username-based user discovery (@username)
- Friend requests and management
- Global user search and connection
- Blockchain-based identity system

### 🔐 Cryptographic Security

- All transactions secured on XION blockchain
- Zero-knowledge proofs for maximum privacy
- Immutable payment history
- Trustless verification system

## 🛠️ Technical Stack

### Frontend

- **React Native** with Expo Router for cross-platform mobile
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- Native camera and file upload integration

### Blockchain

- **XION Blockchain** for transactions and smart contracts
- **XION Dave SDK** for zkTLS and payment processing
- **Abstraxion** for wallet integration and authentication
- **IPFS** for decentralized file storage

### Smart Contract Features

- User registration and username management
- Friend network on-chain storage
- Payment escrow and release mechanisms
- Proof verification and validation
- zkTLS integration for advanced verification

## 📱 User Experience

### Simple Onboarding

1. Connect wallet with Abstraxion
2. Choose unique @username
3. Start sending payments and requests

### Intuitive Payment Flow

1. Select payment type (Task/Request/Payment)
2. Choose recipient and amount
3. Add description and proof requirements
4. Send transaction

### Verification Process

1. Recipient completes task/provides proof
2. Submits verification through app
3. Payment automatically releases upon approval
4. Both parties maintain permanent record

## 🏆 Hackathon Achievement

**🥇 Checkpoint 1 Winner** - Selected as one of 3 winners from 2000+ participants in XION's "Proof of Concept" hackathon.

### Problem Solved

Traditional social payments lack accountability and verification, leading to disputes and broken trust. Proof of Work adds cryptographic verification to ensure fair exchanges.

### Innovation

- First social payment app with integrated zkTLS verification
- Blockchain-based friend networks with permanent transaction history
- Three-tier proof system for different trust levels
- Mobile-first design for mainstream adoption

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- React Native development environment
- XION testnet wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/kyisaiah47/proof-of-work.git
cd proof-of-work

# Install dependencies
npm install

# Start the development server
npm start
```

### Development Setup

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 🔗 Key Integrations

### XION Dave SDK

```javascript
import { DaveSDK } from "@xion/dave-sdk";

// Initialize zkTLS verification
const proof = await DaveSDK.generateProof(data);
```

### Abstraxion Wallet

```javascript
import { useAbstraxionAuth } from "@abstraxion/react";

// Connect wallet and authenticate
const { connect, account } = useAbstraxionAuth();
```

## 🎯 Roadmap

### Phase 1: Core Features ✅

- [x] Basic payment flows
- [x] User registration and friends
- [x] Text and photo proof verification
- [x] XION blockchain integration

### Phase 2: Advanced Features 🚧

- [ ] Group payments and bill splitting
- [ ] Recurring payment requests
- [ ] Enhanced zkTLS verification
- [ ] Payment analytics dashboard

### Phase 3: Scale & Growth 🎯

- [ ] Business accounts and invoicing
- [ ] Integration with external services
- [ ] Advanced fraud detection
- [ ] Multi-chain support

## 💡 Use Cases

### Personal

- **Moving Day**: "Help me move for $100" with photo proof of completion
- **Dinner Split**: "You owe me $25 for dinner" with receipt photo
- **Airport Pickup**: "Thanks for the ride!" with location verification

### Professional

- **Freelance Work**: Verify task completion before payment release
- **Service Payments**: Proof of service delivery for contractors
- **Expense Reimbursement**: Submit receipts with automatic verification

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **XION Team** for blockchain infrastructure and hackathon opportunity
- **Abstraxion** for seamless wallet integration
- **React Native Community** for mobile development tools
- **All contributors** who helped shape this project

## 📞 Contact

**Isaiah Kim** - [@kyisaiah47](https://github.com/kyisaiah47)

**Project Link**: https://github.com/kyisaiah47/proof-of-work

---

_Built for the XION "Proof of Concept" Hackathon - Making social payments trustless and verifiable._
