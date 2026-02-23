/**
 * 12-factor config via env vars, validated with Zod.
 */
import { z } from "zod";
import dotenv from "dotenv";
import { findUp } from "find-up";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DIRECT: z.string().url(),
  PORT_API: z.coerce.number().default(3001),
  PORT_WEB: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16).optional(),
  JWKS_URL: z.string().url().optional(),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export async function loadConfig(env: Record<string, string | undefined> = process.env): Promise<AppConfig> {
  // Load .env from monorepo root
  const envPath = await findUp('.env');
  if (envPath) {
    dotenv.config({ path: envPath });
  }

  return EnvSchema.parse(env);
}
