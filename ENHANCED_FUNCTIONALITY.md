# Enhanced zkTLS Integration with Custom Claim Keys

This enhanced version of the zkTLS integration tutorial now supports both the original hardcoded flow and a new custom flow that allows users to deploy their own RUM contracts with custom claim keys.

## Features

### 🚀 Default Flow (Original Tutorial)
- **Pre-configured**: Uses a hardcoded RUM contract address from environment variables
- **Hardcoded Claim Key**: Uses "followers_count" as the claim key
- **Quick Start**: Perfect for following the tutorial and getting started quickly
- **No deployment needed**: Uses the existing contract instance

### ⚡ Custom Flow (New Enhancement)
- **Deploy Your Own Contract**: Create your own RUM contract instance
- **Custom Claim Keys**: Define any claim key that matches your Reclaim proof data
- **Full Control**: Complete control over contract configuration
- **Flexible**: Perfect for unique use cases and custom implementations

## How It Works

### Default Flow
1. Select "Default Flow" in the interface
2. The app uses the pre-configured RUM contract address from `EXPO_PUBLIC_RUM_CONTRACT_ADDRESS`
3. Uses "followers_count" as the hardcoded claim key
4. Works immediately without any setup

### Custom Flow
1. Select "Custom Flow" in the interface
2. Click "Deploy New Contract" to create your own RUM contract
3. Enter a custom claim key (e.g., "account_age", "post_count", "followers_count", etc.)
4. Deploy the contract and start using it for verification
5. The app remembers your deployed contracts for easy reuse

## Environment Variables

Make sure your `.env.local` file contains all necessary environment variables:

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

## Components Architecture

### FlowSelector
- Main orchestrator component
- Handles flow selection (default vs custom)
- Manages state between different flows
- Provides UI for switching between flows

### ReclaimComponent (Enhanced)
- Enhanced to support both flows
- Accepts props for custom contract address and claim key
- Backwards compatible with original implementation
- Shows flow-specific information in the UI

### CustomRumInstantiator (New)
- Handles deployment of new RUM contracts
- Allows users to specify custom claim keys
- Maintains history of deployed contracts
- Provides contract selection interface

## UI Flow

1. **Flow Selection**: Choose between Default or Custom flow
2. **Default Flow**: Use immediately with pre-configured settings
3. **Custom Flow**: 
   - Deploy new contract OR select existing one
   - Configure custom claim key
   - Use the custom contract for verification

## Custom Claim Key Examples

Your claim key should match a field in your Reclaim proof's context data. Common examples:

- `followers_count` - Twitter/X follower count
- `following_count` - Twitter/X following count  
- `post_count` - Number of posts/tweets
- `account_age` - Account creation date
- `verification_status` - Account verification status
- `profile_views` - Profile view count

## Benefits

### For Tutorial Users
- **No Breaking Changes**: Existing tutorial still works exactly the same
- **Easy Migration**: Can switch to custom flow when ready
- **Learning Path**: Start simple, then explore advanced features

### For Advanced Users  
- **Full Flexibility**: Deploy contracts with any claim key
- **Custom Use Cases**: Support any Reclaim proof data field
- **Production Ready**: Full control over contract deployment and configuration

## Backward Compatibility

✅ **100% Backward Compatible**: All existing tutorial code continues to work without any changes.

The original hardcoded flow remains the default, ensuring that users following the tutorial will have the same experience while providing optional advanced functionality for those who need it.

## Usage Tips

1. **Start with Default Flow**: Perfect for learning and tutorial completion
2. **Experiment with Custom Flow**: Try different claim keys to understand the flexibility
3. **Plan Your Claim Keys**: Match them to your specific Reclaim proof requirements
4. **Test Before Production**: Always test custom contracts on testnet first

## Technical Details

- **Contract Code ID**: 1289 (RUM contract)
- **Verification Contract**: Pre-deployed on testnet
- **Network**: XION Testnet
- **Gas**: All transactions use "auto" gas estimation
- **Storage**: Custom contracts are remembered in component state (consider adding persistence for production) 