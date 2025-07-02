# zkTLS Integration with Reclaim Protocol - Enhanced Demo 🚀

This is an enhanced [Expo](https://expo.dev) project that demonstrates zkTLS integration using Reclaim Protocol on XION blockchain. It supports both the original tutorial flow and advanced custom implementations.

## ✨ Enhanced Features

### 🔥 Default Flow (Tutorial Compatible)
- Pre-configured RUM contract with hardcoded "followers_count" claim key
- Perfect for following the [XION zkTLS tutorial](https://docs.burnt.com/xion/developers/mobile-app-development/zktls-integration-using-reclaim-in-a-xion-mobile-app)
- Works immediately without additional setup

### ⚡ Custom Flow (Advanced)
- Deploy your own RUM contracts with custom claim keys
- Full control over contract configuration
- Support for any Reclaim proof data field
- Perfect for unique use cases and production implementations

## 📋 Prerequisites

- Node.js (LTS version)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)
- A Reclaim Protocol account with configured application and provider

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create a `.env.local` file in the root directory with the following variables:

   ```bash
   # Required for both flows
   EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS="your-treasury-contract-address"
   EXPO_PUBLIC_RPC_ENDPOINT="https://rpc.xion-testnet-2.burnt.com:443"
   EXPO_PUBLIC_REST_ENDPOINT="https://api.xion-testnet-2.burnt.com"

   # Reclaim Protocol Configuration  
   EXPO_PUBLIC_RECLAIM_APP_ID="your-reclaim-app-id"
   EXPO_PUBLIC_RECLAIM_APP_SECRET="your-reclaim-secret"
   EXPO_PUBLIC_RECLAIM_PROVIDER_ID="your-reclaim-provider-id"

   # For Default Flow
   EXPO_PUBLIC_RUM_CONTRACT_ADDRESS="your-default-rum-contract-address"

   # For Custom Flow Contract Deployment
   EXPO_PUBLIC_CODE_ID="1289"
   EXPO_PUBLIC_VERIFICATION_CONTRACT_ADDRESS="xion1qf8jtznwf0tykpg7e65gwafwp47rwxl4x2g2kldvv357s6frcjlsh2m24e"
   ```

3. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## 🎯 How to Use

### Default Flow (Tutorial Users)
1. Launch the app and navigate to the "ZKtls" tab
2. Connect your wallet
3. Select "Default Flow" 
4. Click "Start Verification Flow" to use the pre-configured setup

### Custom Flow (Advanced Users)
1. Launch the app and navigate to the "ZKtls" tab
2. Connect your wallet
3. Select "Custom Flow"
4. Click "Deploy New Contract"
5. Enter your custom claim key (must match your Reclaim proof data)
6. Deploy the contract and start verification

## 📚 Learn More

- [Enhanced Functionality Documentation](./ENHANCED_FUNCTIONALITY.md) - Detailed guide to new features
- [XION zkTLS Tutorial](https://docs.burnt.com/xion/developers/mobile-app-development/zktls-integration-using-reclaim-in-a-xion-mobile-app) - Original tutorial
- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/) - Learn about zkTLS and Reclaim
- [XION Documentation](https://docs.burnt.com/) - XION blockchain documentation

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
- [XION Discord](https://discord.gg/burnt) - XION blockchain community
