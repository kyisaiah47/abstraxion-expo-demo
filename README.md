# Abstraxion Expo Demo

This project is a mobile application built with React Native and Expo Router. It integrates XION's Dave SDK for zkTLS, on-chain payments, and verification flows.

## Features

- **XION Dave SDK Integration**: Secure communication and on-chain payment flows.
- **zkTLS Integration**: Ensures secure proof of completion.
- **On-Chain Payments**: Verify and process payments directly on the blockchain.
- **Navigation**: Tab-based navigation using Expo Router.
- **Custom UI Components**: Includes reusable components like `IconSymbol`.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/burnt-labs/proof-of-work.git
   ```

2. Navigate to the project directory:

   ```bash
   cd proof-of-work
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Configuration

### XION Dave SDK

1. Add your API key and user credentials in `_layout.tsx`:

   ```tsx
   const dave = new Dave({
   	apiKey: "YOUR_API_KEY", // Replace with your actual API key
   	network: "mainnet", // or "testnet"
   });

   dave.authenticate({
   	userId: "USER_ID", // Replace with the actual user ID
   	token: "USER_TOKEN", // Replace with the actual token
   });
   ```

2. Ensure the SDK is properly initialized before using its features.

## Project Structure

- `app/`: Contains the main screens and navigation setup.
- `components/`: Reusable UI components.
- `constants/`: App-wide constants like colors.
- `hooks/`: Custom React hooks.
- `scripts/`: Utility scripts for project management.

## Scripts

- `npm start`: Start the development server.
- `npm run android`: Build and run the app on an Android device/emulator.
- `npm run ios`: Build and run the app on an iOS device/simulator.
- `npm run reset-project`: Reset the project to its initial state.

## Dependencies

- React Native
- Expo Router
- XION Dave SDK
- Material Icons

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

For more information, visit the [XION documentation](https://xion.io/docs).
