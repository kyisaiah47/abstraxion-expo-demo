import { createClient } from '@supabase/supabase-js';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const XION_RPC_URL = process.env.EXPO_PUBLIC_XION_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443';
const NEW_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_XION_PROOFPAY_ADDRESS!;

interface ValidationReport {
  usersTotal: number;
  usersFound: number;
  usersMissing: number;
  paymentsTotal: number;
  paymentsFound: number;
  paymentsMissing: number;
  dataIntegrityIssues: string[];
  validationsPassed: string[];
  validationsFailed: string[];
  timestamp: string;
}

class MigrationValidator {
  private supabase: any;
  private cosmWasmClient: CosmWasmClient | null = null;
  private report: ValidationReport;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.report = {
      usersTotal: 0,
      usersFound: 0,
      usersMissing: 0,
      paymentsTotal: 0,
      paymentsFound: 0,
      paymentsMissing: 0,
      dataIntegrityIssues: [],
      validationsPassed: [],
      validationsFailed: [],
      timestamp: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing migration validator...');

    try {
      this.cosmWasmClient = await CosmWasmClient.connect(XION_RPC_URL);
      console.log('✅ Connected to XION RPC');
    } catch (error) {
      console.error('❌ Failed to connect to XION:', error);
      throw error;
    }
  }

  async fetchLegacyData(): Promise<{ users: any[]; payments: any[] }> {
    console.log('📊 Fetching legacy data from Supabase...');

    try {
      const [usersResult, paymentsResult] = await Promise.all([
        this.supabase.from('users').select('*'),
        this.supabase.from('payments').select('*').eq('chain_id', 'xion-testnet-2')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      console.log(`✅ Found ${usersResult.data.length} users and ${paymentsResult.data.length} payments`);
      
      this.report.usersTotal = usersResult.data.length;
      this.report.paymentsTotal = paymentsResult.data.length;

      return {
        users: usersResult.data,
        payments: paymentsResult.data,
      };
    } catch (error) {
      console.error('❌ Failed to fetch legacy data:', error);
      throw error;
    }
  }

  async validateUser(user: any): Promise<boolean> {
    if (!this.cosmWasmClient) throw new Error('Client not initialized');

    try {
      const userQuery = await this.cosmWasmClient.queryContractSmart(
        NEW_CONTRACT_ADDRESS,
        {
          get_user: { address: user.wallet_address }
        }
      );

      if (!userQuery.user) {
        console.log(`❌ User not found in new contract: ${user.wallet_address}`);
        this.report.usersMissing++;
        return false;
      }

      // Validate user data integrity
      const contractUser = userQuery.user;
      const issues: string[] = [];

      // Check username
      if (user.username && contractUser.username !== user.username) {
        issues.push(`Username mismatch for ${user.wallet_address}: expected "${user.username}", got "${contractUser.username}"`);
      }

      // Check metadata for migration markers
      let metadata: any = {};
      try {
        metadata = JSON.parse(contractUser.metadata || '{}');
      } catch (e) {
        issues.push(`Invalid metadata JSON for user ${user.wallet_address}`);
      }

      if (!metadata.migrated_from) {
        issues.push(`Missing migration marker for user ${user.wallet_address}`);
      }

      if (issues.length > 0) {
        this.report.dataIntegrityIssues.push(...issues);
      }

      this.report.usersFound++;
      return true;
    } catch (error) {
      console.error(`❌ Error validating user ${user.wallet_address}:`, error);
      this.report.usersMissing++;
      return false;
    }
  }

  async validatePayment(payment: any): Promise<boolean> {
    if (!this.cosmWasmClient) throw new Error('Client not initialized');

    try {
      const paymentQuery = await this.cosmWasmClient.queryContractSmart(
        NEW_CONTRACT_ADDRESS,
        {
          get_payment: { payment_id: payment.id }
        }
      );

      if (!paymentQuery.payment) {
        console.log(`❌ Payment not found in new contract: ${payment.id}`);
        this.report.paymentsMissing++;
        return false;
      }

      // Validate payment data integrity
      const contractPayment = paymentQuery.payment;
      const issues: string[] = [];

      // Check basic fields
      if (contractPayment.sender !== payment.sender_address) {
        issues.push(`Sender mismatch for payment ${payment.id}: expected "${payment.sender_address}", got "${contractPayment.sender}"`);
      }

      if (contractPayment.recipient !== payment.recipient_address) {
        issues.push(`Recipient mismatch for payment ${payment.id}: expected "${payment.recipient_address}", got "${contractPayment.recipient}"`);
      }

      if (contractPayment.amount !== payment.amount) {
        issues.push(`Amount mismatch for payment ${payment.id}: expected "${payment.amount}", got "${contractPayment.amount}"`);
      }

      // Check status mapping
      const statusMap: { [key: string]: string } = {
        'pending': 'pending',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'disputed': 'disputed',
      };

      const expectedStatus = statusMap[payment.status];
      if (contractPayment.status !== expectedStatus) {
        issues.push(`Status mismatch for payment ${payment.id}: expected "${expectedStatus}", got "${contractPayment.status}"`);
      }

      if (issues.length > 0) {
        this.report.dataIntegrityIssues.push(...issues);
      }

      this.report.paymentsFound++;
      return true;
    } catch (error) {
      console.error(`❌ Error validating payment ${payment.id}:`, error);
      this.report.paymentsMissing++;
      return false;
    }
  }

  async validateContractState(): Promise<void> {
    console.log('🔍 Validating contract state...');

    if (!this.cosmWasmClient) throw new Error('Client not initialized');

    try {
      // Get contract info
      const contractInfo = await this.cosmWasmClient.queryContractSmart(
        NEW_CONTRACT_ADDRESS,
        { get_contract_info: {} }
      );

      console.log(`📄 Contract Version: ${contractInfo.version}`);
      console.log(`👥 Total Users: ${contractInfo.total_users}`);
      console.log(`💳 Total Payments: ${contractInfo.total_payments}`);

      // Validate totals match expectations
      if (contractInfo.total_users < this.report.usersFound) {
        this.report.validationsFailed.push(`Contract reports ${contractInfo.total_users} users but we found ${this.report.usersFound} migrated`);
      } else {
        this.report.validationsPassed.push('User count validation passed');
      }

      if (contractInfo.total_payments < this.report.paymentsFound) {
        this.report.validationsFailed.push(`Contract reports ${contractInfo.total_payments} payments but we found ${this.report.paymentsFound} migrated`);
      } else {
        this.report.validationsPassed.push('Payment count validation passed');
      }

    } catch (error) {
      console.error('❌ Failed to validate contract state:', error);
      this.report.validationsFailed.push(`Contract state validation failed: ${error}`);
    }
  }

  async validateDataIntegrity(): Promise<void> {
    console.log('🔍 Performing additional data integrity checks...');

    try {
      // Check for orphaned payments (payments without valid users)
      const { payments } = await this.fetchLegacyData();
      
      for (const payment of payments) {
        // Check if sender exists
        try {
          const senderQuery = await this.cosmWasmClient!.queryContractSmart(
            NEW_CONTRACT_ADDRESS,
            { get_user: { address: payment.sender_address } }
          );
          
          if (!senderQuery.user) {
            this.report.dataIntegrityIssues.push(`Payment ${payment.id} has non-existent sender: ${payment.sender_address}`);
          }
        } catch (e) {
          this.report.dataIntegrityIssues.push(`Failed to validate sender for payment ${payment.id}: ${e}`);
        }

        // Check if recipient exists
        try {
          const recipientQuery = await this.cosmWasmClient!.queryContractSmart(
            NEW_CONTRACT_ADDRESS,
            { get_user: { address: payment.recipient_address } }
          );
          
          if (!recipientQuery.user) {
            this.report.dataIntegrityIssues.push(`Payment ${payment.id} has non-existent recipient: ${payment.recipient_address}`);
          }
        } catch (e) {
          this.report.dataIntegrityIssues.push(`Failed to validate recipient for payment ${payment.id}: ${e}`);
        }
      }

      if (this.report.dataIntegrityIssues.length === 0) {
        this.report.validationsPassed.push('Data integrity validation passed');
      }

    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      this.report.validationsFailed.push(`Data integrity validation failed: ${error}`);
    }
  }

  async validateUsers(users: any[]): Promise<void> {
    console.log(`🔄 Validating ${users.length} users...`);
    
    const batchSize = 20;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const promises = batch.map(user => this.validateUser(user));
      
      await Promise.allSettled(promises);
      
      console.log(`📈 Progress: ${Math.min(i + batchSize, users.length)}/${users.length} users validated`);
      
      // Rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ User validation completed: ${this.report.usersFound} found, ${this.report.usersMissing} missing`);
  }

  async validatePayments(payments: any[]): Promise<void> {
    console.log(`🔄 Validating ${payments.length} payments...`);
    
    const batchSize = 10;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      const promises = batch.map(payment => this.validatePayment(payment));
      
      await Promise.allSettled(promises);
      
      console.log(`📈 Progress: ${Math.min(i + batchSize, payments.length)}/${payments.length} payments validated`);
      
      // Rate limiting
      if (i + batchSize < payments.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    console.log(`✅ Payment validation completed: ${this.report.paymentsFound} found, ${this.report.paymentsMissing} missing`);
  }

  async generateReport(): Promise<void> {
    const reportPath = path.join(__dirname, '..', '..', 'validation-reports', `validation-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    const successRate = {
      users: this.report.usersTotal > 0 ? (this.report.usersFound / this.report.usersTotal * 100).toFixed(1) : '0',
      payments: this.report.paymentsTotal > 0 ? (this.report.paymentsFound / this.report.paymentsTotal * 100).toFixed(1) : '0',
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${this.report.timestamp}`);
    console.log(`\n👥 Users:`);
    console.log(`  Total: ${this.report.usersTotal}`);
    console.log(`  Found: ${this.report.usersFound} (${successRate.users}%)`);
    console.log(`  Missing: ${this.report.usersMissing}`);
    console.log(`\n💳 Payments:`);
    console.log(`  Total: ${this.report.paymentsTotal}`);
    console.log(`  Found: ${this.report.paymentsFound} (${successRate.payments}%)`);
    console.log(`  Missing: ${this.report.paymentsMissing}`);
    console.log(`\n✅ Validations Passed: ${this.report.validationsPassed.length}`);
    console.log(`❌ Validations Failed: ${this.report.validationsFailed.length}`);
    console.log(`⚠️  Data Integrity Issues: ${this.report.dataIntegrityIssues.length}`);
    
    if (this.report.validationsFailed.length > 0) {
      console.log('\nFailed Validations:');
      this.report.validationsFailed.forEach(failure => console.log(`  - ${failure}`));
    }
    
    if (this.report.dataIntegrityIssues.length > 0 && this.report.dataIntegrityIssues.length <= 5) {
      console.log('\nData Integrity Issues (showing first 5):');
      this.report.dataIntegrityIssues.slice(0, 5).forEach(issue => console.log(`  - ${issue}`));
      if (this.report.dataIntegrityIssues.length > 5) {
        console.log(`  ... and ${this.report.dataIntegrityIssues.length - 5} more (see full report)`);
      }
    }
    
    console.log(`\n📄 Full report saved: ${reportPath}`);
    console.log('='.repeat(60));

    // Overall status
    const isSuccess = this.report.usersMissing === 0 && 
                     this.report.paymentsMissing === 0 && 
                     this.report.validationsFailed.length === 0;
    
    if (isSuccess) {
      console.log('\n🎉 Migration validation PASSED! All data successfully migrated.');
    } else {
      console.log('\n⚠️  Migration validation found issues. Please review the report above.');
    }
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting migration validation...\n');
      
      await this.initialize();
      const { users, payments } = await this.fetchLegacyData();

      if (users.length === 0 && payments.length === 0) {
        console.log('ℹ️ No data to validate');
        return;
      }

      // Validate migrated data
      if (users.length > 0) {
        await this.validateUsers(users);
      }
      
      if (payments.length > 0) {
        await this.validatePayments(payments);
      }

      // Additional validations
      await this.validateContractState();
      await this.validateDataIntegrity();

    } catch (error) {
      console.error('💥 Validation failed:', error);
      this.report.validationsFailed.push(`Critical error: ${error}`);
    } finally {
      await this.generateReport();
    }
  }
}

// CLI interface
async function main() {
  const validator = new MigrationValidator();
  
  // Validate required environment variables
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_XION_PROOFPAY_ADDRESS',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }

  await validator.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { MigrationValidator };