# ProofPay Data Migration Scripts

This directory contains scripts to migrate existing XION ProofPay data to the new multi-chain architecture.

## Overview

The migration process involves:

1. **Backup Creation**: Creates backups of existing data
2. **Data Migration**: Migrates users and payments to new contract structure
3. **Validation**: Validates that all data was migrated correctly
4. **Reporting**: Generates detailed reports of the migration process

## Scripts

### `migrate-xion-data.ts`

Main migration script that handles the transfer of data from the legacy XION system to the new multi-chain contract.

**Features:**
- Migrates user accounts with metadata preservation
- Migrates payment history with status preservation
- Creates automatic backups before migration
- Batch processing with rate limiting
- Comprehensive error handling and reporting
- Idempotent - can be run multiple times safely

**Usage:**
```bash
# Set required environment variables
export EXPO_PUBLIC_SUPABASE_URL="your_supabase_url"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
export OLD_XION_CONTRACT_ADDRESS="old_contract_address"
export EXPO_PUBLIC_XION_PROOFPAY_ADDRESS="new_contract_address"
export MIGRATION_WALLET_MNEMONIC="wallet_mnemonic_with_admin_permissions"

# Run migration
npx ts-node scripts/migration/migrate-xion-data.ts
```

### `validate-migration.ts`

Validation script that verifies the integrity and completeness of the migration.

**Features:**
- Validates all users were migrated correctly
- Validates all payments were migrated with correct data
- Checks data integrity and relationships
- Validates contract state consistency
- Generates detailed validation reports

**Usage:**
```bash
# Run validation after migration
npx ts-node scripts/migration/validate-migration.ts
```

## Prerequisites

### Environment Variables

Create a `.env.migration` file with the following variables:

```env
# Legacy system access
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# XION RPC
EXPO_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443

# Contract addresses
OLD_XION_CONTRACT_ADDRESS=xion1old_contract_address...
EXPO_PUBLIC_XION_PROOFPAY_ADDRESS=xion1new_contract_address...

# Migration wallet (must have admin permissions on new contract)
MIGRATION_WALLET_MNEMONIC="your twelve word mnemonic phrase here"
```

### Dependencies

Install required dependencies:

```bash
npm install @supabase/supabase-js @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate
```

### Permissions

The migration wallet must have admin permissions on the new contract to:
- Register users on behalf of the original addresses
- Create historical payment records
- Update payment statuses

## Migration Process

### 1. Pre-Migration

1. **Deploy new multi-chain contract** with historical migration support
2. **Set up environment variables** as described above
3. **Test with small dataset** first on testnet
4. **Coordinate with users** about potential downtime

### 2. Running Migration

```bash
# 1. Create backup (automatic, but verify)
ls backups/

# 2. Run migration
npx ts-node scripts/migration/migrate-xion-data.ts

# 3. Validate results
npx ts-node scripts/migration/validate-migration.ts

# 4. Review reports
ls migration-reports/
ls validation-reports/
```

### 3. Post-Migration

1. **Review migration and validation reports**
2. **Test critical user flows** with migrated data
3. **Update frontend** to point to new contracts
4. **Monitor system** for any issues
5. **Archive old system** once stability is confirmed

## Migration Features

### Data Preservation

- **User Data**: Usernames, metadata, creation timestamps
- **Payment Data**: All payment details, proof data, transaction hashes
- **Status History**: Original completion, cancellation, and dispute timestamps
- **Relationships**: Sender-recipient relationships maintained

### Historical Markers

All migrated data includes metadata marking it as migrated:

```json
{
  "migrated_from": "legacy_system",
  "original_created_at": "2024-01-01T00:00:00Z",
  "migration_timestamp": "2024-08-28T10:30:00Z"
}
```

### Batch Processing

- Users: 10 per batch with 2-second delays
- Payments: 5 per batch with 3-second delays
- Rate limiting prevents RPC overload

### Error Recovery

- Detailed error logging for each failed migration
- Idempotent design allows rerunning safely
- Automatic skip of already-migrated data
- Comprehensive reporting of successes/failures

## Reports

### Migration Report

Generated automatically after migration:

```json
{
  "usersTotal": 1000,
  "usersMigrated": 998,
  "usersSkipped": 2,
  "paymentsTotal": 5000,
  "paymentsMigrated": 4995,
  "paymentsSkipped": 5,
  "errors": ["Error details..."],
  "duration": 3600000,
  "timestamp": "2024-08-28T10:30:00Z"
}
```

### Validation Report

Generated after running validation:

```json
{
  "usersTotal": 1000,
  "usersFound": 998,
  "usersMissing": 2,
  "paymentsTotal": 5000,
  "paymentsFound": 4995,
  "paymentsMissing": 5,
  "dataIntegrityIssues": ["Issue descriptions..."],
  "validationsPassed": ["Validation descriptions..."],
  "validationsFailed": ["Failed validation descriptions..."]
}
```

## Troubleshooting

### Common Issues

1. **RPC Rate Limiting**
   - Solution: Increase delays between batches
   - Check: Ensure RPC endpoint has sufficient rate limits

2. **Insufficient Gas**
   - Solution: Ensure migration wallet has sufficient balance
   - Check: Monitor gas usage during migration

3. **Data Integrity Issues**
   - Solution: Review validation report for specific issues
   - Check: Verify source data quality before migration

4. **Contract Permission Errors**
   - Solution: Ensure migration wallet has admin permissions
   - Check: Test admin functions before full migration

### Recovery Steps

If migration fails partway through:

1. **Review error logs** in migration report
2. **Fix underlying issues** (permissions, gas, etc.)
3. **Rerun migration** - it will skip already-migrated data
4. **Validate results** once complete

## Security Considerations

- **Migration wallet security**: Store mnemonic securely, remove after migration
- **Admin permissions**: Revoke after successful migration
- **Backup encryption**: Consider encrypting backup files
- **Audit trail**: Keep all migration reports for auditing

## Testing

Before running on mainnet:

1. **Test on testnet** with subset of data
2. **Validate all flows** work with migrated data
3. **Performance test** with expected data volumes
4. **Rollback plan** in case of critical issues

## Support

For issues with migration:

1. **Check logs** in migration/validation reports
2. **Review environment** variable configuration
3. **Test RPC connectivity** and contract permissions
4. **Contact development team** with specific error details