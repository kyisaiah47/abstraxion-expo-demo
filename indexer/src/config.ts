import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const ConfigSchema = z.object({
  // XION Configuration
  XION_RPC_WS: z.string().url(),
  XION_RPC_HTTP: z.string().url(),
  CONTRACT_ADDRESS: z.string().min(1),

  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OneSignal Configuration
  ONESIGNAL_APP_ID: z.string().min(1),
  ONESIGNAL_API_KEY: z.string().min(1),

  // Optional Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  HEALTH_CHECK_PORT: z.string().transform(Number).default('3001'),
  CRON_SCHEDULE: z.string().default('*/1 * * * *'), // Every minute
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;

function validateConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid configuration:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const config = validateConfig();

// Export individual config values for convenience
export const {
  XION_RPC_WS,
  XION_RPC_HTTP,
  CONTRACT_ADDRESS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ONESIGNAL_APP_ID,
  ONESIGNAL_API_KEY,
  LOG_LEVEL,
  HEALTH_CHECK_PORT,
  CRON_SCHEDULE,
  NODE_ENV,
} = config;