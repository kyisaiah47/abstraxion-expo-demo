# ProofPay - Social Payments Platform

A modern social payment app inspired by Venmo, with proof-of-work and blockchain security. Request help, send/request payments, and verify actions with text, photo, or zkTLS proofs. All payments are secured by the XION blockchain.

## ✨ Key Features

### 🔄 Three Payment Flows

## 🚀 Features

- **Social Payments:** Request help, send money, or request payments from friends
- **Proof-of-Work:** Attach proof to payments (None, Text, Photo, zkTLS)
- **Venmo-Style UI:** Clean, minimal, and intuitive interface
- **Username Registration:** Onboarding flow for new users with username validation
- **Tab Navigation:** Switch between Help, Request, and Pay tabs
- **Blockchain Security:** All transactions are secured by XION blockchain
- **Crypto Badge:** Subtle badge for blockchain security
- **Activity Feed:** View recent payment and help activity
- **Profile Management:** View and edit user profile, wallet, and settings
- **Task Requests**: "Help me move furniture for $50" - request work with verifiable completion
- **Direct Payments**: "Thanks for helping!" - send money with optional verification

## �️ Tech Stack

- **React Native** (Expo)
- **Expo Router** (tab navigation)
- **TypeScript**
- **XION Blockchain** (smart contract integration)
- **Abstraxion** (wallet authentication)
- **Custom Design System** (for colors, spacing, typography)
- **React Native** with Expo Router for cross-platform mobile
- **Tailwind CSS** for styling

## 📁 Folder Structure

```
app/
	(tabs)/
		create.tsx         # Main payment form
		activity.tsx       # Recent activity feed
		profile.tsx        # User profile
	username-setup.tsx   # Username onboarding
components/
	SocialPaymentForm.tsx    # Main payment form UI
	PaymentTabSwitcher.tsx   # Tab navigation
	...other UI components
constants/
	Colors.ts
	DesignSystem.ts
hooks/
	useThemeColor.ts
android/ios/              # Native project files
assets/                   # Fonts and images
```

3. Start sending payments and requests

### Intuitive Payment Flow

## 📝 Key Screens

- **Create Tab:**

  - Select payment type (Help, Request, Pay)
  - Enter recipient username (display only, not editable)
  - Enter amount (inline editable)
  - Select proof type (None, Text, Photo, zkTLS)
  - Add description (with tab-specific placeholder)
  - Submit payment/help request

- **Activity Tab:**

  - View recent payments and help requests

- **Profile Tab:**

  - View and edit user profile, wallet address, and settings

- **Username Setup:**
  - Onboarding for new users with real-time validation

### Innovation

- First social payment app with integrated zkTLS verification

## 🛡️ Proof Types

- **None:** No proof required
- **Text Proof:** Enter a short explanation
- **Photo Proof:** Attach a photo
- **zkTLS Proof:** Zero-knowledge proof for advanced verification

# Clone the repository

## � Blockchain Security

All payments and requests are cryptographically secured and recorded on the XION blockchain. The app uses Abstraxion for wallet authentication and smart contract interaction.
git clone https://github.com/kyisaiah47/proof-of-work.git

## 🚦 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the app:**
   ```bash
   npx expo start
   ```
3. **Open in Expo Go or simulator:**
   - Scan the QR code in terminal
   - Or press `i` for iOS, `a` for Android, `w` for web

# Install dependencies

## 🏆 Hackathon Achievement

- **Checkpoint 1 Winner** - Selected as one of 3 winners from 2000+ participants in XION's "Proof of Concept" hackathon.

# Start the development server

````
## 📄 License

MIT


For questions or contributions, open an issue or pull request on GitHub.
```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
````

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
