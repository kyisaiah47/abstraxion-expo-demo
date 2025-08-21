# Treasury Contract Integration Guide

Based on the official Burnt documentation: https://docs.burnt.com/xion/developers/getting-started-advanced/gasless-ux-and-permission-grants/treasury-contracts

## Overview

Your app now has Treasury contract integration implemented following the official Burnt pattern. This enables:

- **Gasless transactions** for users (Treasury pays gas fees)
- **Delegated authorization** (Treasury can execute transactions on user's behalf)
- **Enhanced UX** (no need for users to hold XION for gas)

## Implementation Details

### 1. Treasury Service (`lib/treasuryOfficial.ts`)

- Follows official documentation pattern
- Uses `granter: treasuryAddress` for gas sponsorship
- Automatic fallback to regular transactions if Treasury fails
- Supports all contract operations: job acceptance, proof submission, etc.

### 2. Contract Service Integration

The `ContractService` now:

- Automatically uses Treasury for gas sponsorship when available
- Falls back to user-paid transactions when Treasury is unavailable
- Provides seamless integration without breaking existing functionality

### 3. UI Components

- **SimpleTreasuryStatusCard**: Shows Treasury availability without infinite loops
- **Treasury Management Screen**: Admin interface for funding/managing Treasury
- **Dashboard Integration**: Treasury status indicator

## Setup Instructions

### Step 1: Deploy Treasury Contract

1. Go to the Developer Portal:

   - **Testnet**: https://dev.testnet2.burnt.com/
   - **Mainnet**: https://dev.burnt.com/

2. Click "New treasury" and configure:

   **Fee Grant Configuration:**

   ```json
   {
   	"type": "/cosmos.feegrant.v1beta1.BasicAllowance",
   	"description": "Gas sponsorship for proof-of-work app transactions",
   	"spend_limit": [{ "denom": "uxion", "amount": "1000000000" }] // 1000 XION limit
   }
   ```

   **Grant Configuration:**

   ```json
   {
   	"type_url": "/cosmwasm.wasm.v1.MsgExecuteContract",
   	"description": "Execute proof-of-work contract transactions",
   	"authorization": {
   		"type": "/cosmwasm.wasm.v1.ContractExecutionAuthorization",
   		"grants": [
   			{
   				"contract": "xion1x9wlxg2xs9ft0h20z7t6rmnexhzwwws3qgkmm2j803rcdr4jrrys4gt6cv",
   				"limit": null,
   				"filter": {
   					"type": "accept_all"
   				}
   			}
   		]
   	}
   }
   ```

3. Deploy the contract and note the contract address

### Step 2: Configure Environment

Add to your `.env.local`:

```bash
EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS=xion1your_treasury_contract_address_here
```

### Step 3: Fund Treasury Contract

Transfer XION tokens to the Treasury contract address to cover gas fees:

```bash
# Example: Fund with 100 XION for gas sponsorship
# Use the Treasury management screen in your app or transfer directly
```

### Step 4: User Experience Flow

1. **User Connects Wallet**: Abstraxion handles Treasury permissions
2. **User Sees Allowances**: Treasury permissions are displayed
3. **User Clicks "Allow"**: Creates grants and fee grants automatically
4. **Gasless Transactions**: All subsequent transactions are sponsored by Treasury

## Treasury Contract Messages

The implementation supports these gasless operations:

- `accept_job` - Accept a job posting
- `submit_proof` - Submit proof of work completion
- `accept_proof` - Accept submitted proof (client)
- `reject_proof` - Reject submitted proof (client)
- `cancel_job` - Cancel a job posting

## Monitoring and Management

### Treasury Status Monitoring

The app shows:

- Treasury connection status
- Gas sponsorship availability
- Last status check timestamp

### Admin Functions

Treasury management screen provides:

- Fund Treasury with XION tokens
- Withdraw Treasury funds (admin only)
- Monitor Treasury balance and capacity

## Error Handling

The implementation includes:

1. **Automatic Fallback**: If Treasury fails, transactions use user's gas
2. **Clear Error Messages**: Distinguishes Treasury vs user fund issues
3. **Graceful Degradation**: App works with or without Treasury

## Testing

1. **Without Treasury**: App works normally with user-paid gas
2. **With Treasury**: Transactions are gasless and sponsored
3. **Treasury Empty**: Automatic fallback to user-paid gas

## Key Benefits

- **Improved Onboarding**: Users don't need XION tokens to start
- **Better UX**: Gasless transactions reduce friction
- **Controlled Costs**: Admin controls gas sponsorship limits
- **Security**: Users maintain control, Treasury only sponsors gas

## Configuration Options

In `constants/contracts.ts`:

```typescript
export const TREASURY_CONFIG = {
	address: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS || "",
	enabled: !!process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS,
	minimumBalance: 1.0, // Minimum XION for gas sponsorship
	averageGasCost: 0.2, // Estimated cost per transaction
};
```

## Next Steps

1. Deploy Treasury contract using Developer Portal
2. Configure environment variables
3. Fund Treasury with XION tokens
4. Test gasless transaction flow
5. Monitor Treasury balance and refund as needed

The implementation is production-ready and follows Burnt's official patterns for Treasury contracts and gasless UX.
