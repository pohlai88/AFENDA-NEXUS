import { z } from 'zod';

export const R2StorageConfigSchema = z.object({
  /** R2 account ID (from Cloudflare dashboard) */
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  /** R2 access key ID */
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  /** R2 secret access key */
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  /** R2 bucket name */
  R2_BUCKET_NAME: z.string().min(1).optional(),
  /** Public URL for R2 (e.g. custom domain or r2.dev) — for signed URL base */
  R2_PUBLIC_URL: z.string().url().optional(),
  /** Enable storage (false = mock/no-op for tests) */
  R2_ENABLED: z.string().optional().default('true'),
  /** Force mock adapter for tests (overrides R2_ENABLED when true) */
  R2_TEST_ENABLED: z.string().optional(),
  /** Enable MIME sniffing for high-risk types on upload (Plan §7) */
  R2_MIME_SNIFF_ENABLED: z.string().optional().default('false'),
});

export type R2StorageConfig = z.infer<typeof R2StorageConfigSchema>;

export function loadR2Config(
  env: Record<string, string | undefined> = process.env
): R2StorageConfig {
  return R2StorageConfigSchema.parse(env);
}
