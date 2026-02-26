/**
 * 12-factor config via env vars, validated with Zod.
 */
import { z } from 'zod';
import dotenv from 'dotenv';
import { findUp } from 'find-up';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    DATABASE_URL_DIRECT: z.string().url(),
    /** Optional: Neon read replica for reporting/analytics. Falls back to primary when unset. */
    DATABASE_URL_READONLY: z.string().url().optional(),
    /** Optional: sslmode=verify-full for highest security. Default: require. */
    DATABASE_SSL_MODE: z.enum(['require', 'verify-full']).optional(),
    PORT_API: z.coerce.number().default(3001),
    PORT_WEB: z.coerce.number().default(3000),

    // ── Neon Auth ──────────────────────────────────────────────────────
    NEON_AUTH_BASE_URL: z.string().url().optional(),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
    NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),
    JWKS_URL: z.string().url().optional(),

    // ── Email (Resend) ──────────────────────────────────────────────────
    RESEND_API_KEY: z.string().optional(),
    DEFAULT_FROM_EMAIL: z.string().email().default('no-reply@nexuscanon.com'),
    DEFAULT_FROM_NAME: z.string().default('NexusCanon'),

    // ── Redis (optional — for secondary storage / rate limiting) ────────
    REDIS_URL: z.string().url().optional(),

    // ── App URL (used for CORS allowlist, email links, etc.) ────────────
    APP_URL: z.string().url().optional(),

    // ── R2 Storage (Cloudflare) ─────────────────────────────────────────
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_ENABLED: z.string().optional().default('true'),
  })
  .refine(
    (env) => {
      // In production, NEON_AUTH_BASE_URL is required
      if (env.NODE_ENV === 'production' && !env.NEON_AUTH_BASE_URL) {
        return false;
      }
      return true;
    },
    { message: 'NEON_AUTH_BASE_URL is required in production' }
  )
  .refine(
    (env) => {
      // DATABASE_URL must use pooled endpoint (-pooler) for API/web (NEON-INTEGRATION.md)
      if (
        env.NODE_ENV === 'production' &&
        env.DATABASE_URL &&
        !env.DATABASE_URL.includes('pooler')
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'DATABASE_URL must use Neon pooled endpoint (host contains -pooler) for production. Use DATABASE_URL_DIRECT for migrations.',
    }
  );

export type AppConfig = z.infer<typeof EnvSchema>;

export async function loadConfig(
  env: Record<string, string | undefined> = process.env
): Promise<AppConfig> {
  // Load .env from monorepo root
  const envPath = await findUp('.env');
  if (envPath) {
    dotenv.config({ path: envPath });
  }

  return EnvSchema.parse(env);
}
