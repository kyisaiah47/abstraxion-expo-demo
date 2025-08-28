import { createClient } from '@supabase/supabase-js';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningCosmWasmClient, CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const XION_RPC_URL = process.env.EXPO_PUBLIC_XION_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443';
const OLD_CONTRACT_ADDRESS = process.env.OLD_XION_CONTRACT_ADDRESS!;
const NEW_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_XION_PROOFPAY_ADDRESS!;
const MIGRATION_WALLET_MNEMONIC = process.env.MIGRATION_WALLET_MNEMONIC!;

interface LegacyUser {
  wallet_address: string;
  username?: string;
  created_at: string;
  updated_at: string;
  total_payments_sent: number;
  total_payments_received: number;
}

interface LegacyPayment {
  id: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  proof_type: string;
  proof_data?: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  disputed_at?: string;
  transaction_hash: string;
  chain_id: string;
}

interface MigrationReport {
  usersTotal: number;
  usersMigrated: number;
  usersSkipped: number;
  paymentsTotal: number;
  paymentsMigrated: number;
  paymentsSkipped: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

class XionDataMigration {
  private supabase: any;
  private cosmWasmClient: CosmWasmClient | null = null;
  private signingClient: SigningCosmWasmClient | null = null;
  private migrationWallet: any = null;
  private report: MigrationReport;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.report = {
      usersTotal: 0,
      usersMigrated: 0,
      usersSkipped: 0,
      paymentsTotal: 0,
      paymentsMigrated: 0,
      paymentsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing XION data migration...');

    try {
      // Initialize CosmWasm client
      this.cosmWasmClient = await CosmWasmClient.connect(XION_RPC_URL);
      console.log('✅ Connected to XION RPC');

      // Initialize signing client for migration wallet
      this.migrationWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        MIGRATION_WALLET_MNEMONIC,
        { prefix: 'xion' }
      );

      const [account] = await this.migrationWallet.getAccounts();
      console.log(`✅ Migration wallet address: ${account.address}`);

      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        XION_RPC_URL,
        this.migrationWallet,
        {
          gasPrice: GasPrice.fromString('0.001uxion'),
        }
      );

      console.log('✅ Signing client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize clients:', error);
      throw error;
    }
  }

  async fetchLegacyUsers(): Promise<LegacyUser[]> {
    console.log('📊 Fetching legacy users from Supabase...');

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*');

      if (error) {
        throw error;
      }

      console.log(`✅ Found ${data.length} legacy users`);
      this.report.usersTotal = data.length;
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch legacy users:', error);
      this.report.errors.push(`Failed to fetch users: ${error}`);
      return [];
    }
  }

  async fetchLegacyPayments(): Promise<LegacyPayment[]> {
    console.log('📊 Fetching legacy payments from Supabase...');

    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('chain_id', 'xion-testnet-2'); // Only XION payments

      if (error) {
        throw error;
      }

      console.log(`✅ Found ${data.length} legacy payments`);
      this.report.paymentsTotal = data.length;
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch legacy payments:', error);
      this.report.errors.push(`Failed to fetch payments: ${error}`);
      return [];
    }
  }

  async migrateUser(user: LegacyUser): Promise<boolean> {
    if (!this.signingClient || !this.migrationWallet) {
      throw new Error('Clients not initialized');
    }

    try {
      const [migrationAccount] = await this.migrationWallet.getAccounts();

      // Check if user already exists in new contract
      const userQuery = await this.cosmWasmClient!.queryContractSmart(
        NEW_CONTRACT_ADDRESS,
        {
          get_user: { address: user.wallet_address }
        }
      );

      if (userQuery.user) {
        console.log(`⏭️ User ${user.wallet_address} already exists, skipping`);
        this.report.usersSkipped++;
        return true;
      }

      // Register user in new contract
      const registerMsg = {
        register_user: {
          username: user.username || '',
          metadata: JSON.stringify({
            migrated_from: 'legacy_system',
            original_created_at: user.created_at,
            total_payments_sent: user.total_payments_sent,
            total_payments_received: user.total_payments_received,
          }),
        }
      };

      await this.signingClient.execute(
        migrationAccount.address,
        NEW_CONTRACT_ADDRESS,
        registerMsg,
        'auto'
      );

      console.log(`✅ Migrated user: ${user.wallet_address}`);
      this.report.usersMigrated++;
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.wallet_address}:`, error);
      this.report.errors.push(`User migration failed (${user.wallet_address}): ${error}`);
      this.report.usersSkipped++;
      return false;
    }
  }

  async migratePayment(payment: LegacyPayment): Promise<boolean> {
    if (!this.signingClient || !this.migrationWallet) {
      throw new Error('Clients not initialized');
    }

    try {
      const [migrationAccount] = await this.migrationWallet.getAccounts();

      // Check if payment already exists in new contract
      try {
        const paymentQuery = await this.cosmWasmClient!.queryContractSmart(
          NEW_CONTRACT_ADDRESS,
          {
            get_payment: { payment_id: payment.id }
          }
        );

        if (paymentQuery.payment) {
          console.log(`⏭️ Payment ${payment.id} already exists, skipping`);
          this.report.paymentsSkipped++;
          return true;
        }
      } catch (queryError) {
        // Payment doesn't exist, continue with migration
      }

      // Map legacy status to new status
      const statusMap: { [key: string]: string } = {
        'pending': 'pending',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'disputed': 'disputed',
      };

      // Create payment in new contract with historical data
      const createMsg = {
        create_payment_historical: {
          payment_id: payment.id,
          recipient: payment.recipient_address,
          amount: payment.amount,
          proof_type: payment.proof_type,
          proof_data: payment.proof_data || '',
          original_sender: payment.sender_address,
          original_created_at: payment.created_at,
          original_status: statusMap[payment.status] || 'pending',
          original_tx_hash: payment.transaction_hash,
          migration_timestamp: new Date().toISOString(),
        }
      };

      await this.signingClient.execute(
        migrationAccount.address,
        NEW_CONTRACT_ADDRESS,
        createMsg,
        'auto'
      );

      // If payment was completed, mark it as completed with historical data
      if (payment.status === 'completed' && payment.completed_at) {
        const completeMsg = {
          complete_payment_historical: {
            payment_id: payment.id,
            original_completed_at: payment.completed_at,
          }
        };

        await this.signingClient.execute(
          migrationAccount.address,
          NEW_CONTRACT_ADDRESS,
          completeMsg,
          'auto'
        );
      }

      console.log(`✅ Migrated payment: ${payment.id}`);
      this.report.paymentsMigrated++;
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate payment ${payment.id}:`, error);
      this.report.errors.push(`Payment migration failed (${payment.id}): ${error}`);
      this.report.paymentsSkipped++;
      return false;
    }
  }

  async migrateUsers(users: LegacyUser[]): Promise<void> {
    console.log(`🔄 Starting user migration for ${users.length} users...`);
    
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const promises = batch.map(user => this.migrateUser(user));
      
      await Promise.allSettled(promises);
      
      console.log(`📈 Progress: ${Math.min(i + batchSize, users.length)}/${users.length} users processed`);
      
      // Rate limiting - wait 2 seconds between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ User migration completed: ${this.report.usersMigrated} successful, ${this.report.usersSkipped} skipped`);
  }

  async migratePayments(payments: LegacyPayment[]): Promise<void> {
    console.log(`🔄 Starting payment migration for ${payments.length} payments...`);
    
    const batchSize = 5; // Smaller batch size for payments
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      const promises = batch.map(payment => this.migratePayment(payment));
      
      await Promise.allSettled(promises);
      
      console.log(`📈 Progress: ${Math.min(i + batchSize, payments.length)}/${payments.length} payments processed`);
      
      // Rate limiting - wait 3 seconds between batches for payments
      if (i + batchSize < payments.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`✅ Payment migration completed: ${this.report.paymentsMigrated} successful, ${this.report.paymentsSkipped} skipped`);
  }

  async createBackup(): Promise<void> {
    console.log('💾 Creating backup of current data...');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, '..', '..', 'backups', timestamp);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Backup users
      const { data: users } = await this.supabase.from('users').select('*');
      fs.writeFileSync(
        path.join(backupDir, 'users.json'),
        JSON.stringify(users, null, 2)
      );

      // Backup payments
      const { data: payments } = await this.supabase.from('payments').select('*');
      fs.writeFileSync(
        path.join(backupDir, 'payments.json'),
        JSON.stringify(payments, null, 2)
      );

      console.log(`✅ Backup created at: ${backupDir}`);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      this.report.errors.push(`Backup creation failed: ${error}`);
    }
  }

  async generateReport(): Promise<void> {
    this.report.duration = Date.now() - new Date(this.report.timestamp).getTime();
    
    const reportPath = path.join(__dirname, '..', '..', 'migration-reports', `migration-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${this.report.timestamp}`);
    console.log(`Duration: ${(this.report.duration / 1000).toFixed(2)}s`);
    console.log(`\n👥 Users:`);
    console.log(`  Total: ${this.report.usersTotal}`);
    console.log(`  Migrated: ${this.report.usersMigrated}`);
    console.log(`  Skipped: ${this.report.usersSkipped}`);
    console.log(`\n💳 Payments:`);
    console.log(`  Total: ${this.report.paymentsTotal}`);
    console.log(`  Migrated: ${this.report.paymentsMigrated}`);
    console.log(`  Skipped: ${this.report.paymentsSkipped}`);
    console.log(`\n❌ Errors: ${this.report.errors.length}`);
    if (this.report.errors.length > 0) {
      console.log('Error details saved in migration report');
    }
    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('='.repeat(60));
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting XION data migration...\n');
      
      // Initialize clients
      await this.initialize();
      
      // Create backup
      await this.createBackup();
      
      // Fetch legacy data
      const [users, payments] = await Promise.all([
        this.fetchLegacyUsers(),
        this.fetchLegacyPayments()
      ]);

      if (users.length === 0 && payments.length === 0) {
        console.log('ℹ️ No data to migrate');
        return;
      }

      // Migrate users first
      if (users.length > 0) {
        await this.migrateUsers(users);
      }

      // Then migrate payments
      if (payments.length > 0) {
        await this.migratePayments(payments);
      }

    } catch (error) {
      console.error('💥 Migration failed:', error);
      this.report.errors.push(`Critical error: ${error}`);
    } finally {
      await this.generateReport();
    }
  }
}

// CLI interface
async function main() {
  const migration = new XionDataMigration();
  
  // Validate required environment variables
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'OLD_XION_CONTRACT_ADDRESS',
    'EXPO_PUBLIC_XION_PROOFPAY_ADDRESS',
    'MIGRATION_WALLET_MNEMONIC',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }

  // Confirm migration
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = await new Promise<string>((resolve) => {
    readline.question('⚠️  This will migrate data from the legacy XION system. Continue? (yes/no): ', resolve);
  });

  readline.close();

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Migration cancelled');
    process.exit(0);
  }

  await migration.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { XionDataMigration };