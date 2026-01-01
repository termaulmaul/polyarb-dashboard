import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PM_PRIVATE_KEY: z.string().min(1, 'PM_PRIVATE_KEY is required'),
  PM_CHAIN: z.enum(['polygon', 'mumbai']).default('polygon'),
  PM_CLOB_HOST: z.string().url().default('https://clob.polymarket.com'),
  MIN_EDGE_DEFAULT: z.coerce.number().min(0.1).max(10).default(1.5),
  MAX_POSITION_DEFAULT: z.coerce.number().min(1).max(1000).default(10),
  EXECUTION_TIMEOUT_MS: z.coerce.number().min(1000).max(10000).default(3000),
  PORT: z.coerce.number().min(1000).max(9999).default(3001),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug').default('info'),
  DB_PATH: z.string().default('./data/polymarket.db'),
  SCAN_INTERVAL_MS: z.coerce.number().min(1000).max(30000).default(5000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export let envConfig: EnvConfig;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

