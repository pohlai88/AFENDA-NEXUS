import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Type-safe environment variables for @afenda/web.
 *
 * Server-side variables are only available in Server Components, Route Handlers,
 * and Server Actions. Client-side variables (NEXT_PUBLIC_*) are available everywhere.
 *
 * Usage:
 *   import { env } from '@/env';
 *   const url = env.NEON_AUTH_BASE_URL;
 */
export const env = createEnv({
  // ─── Server-Side Variables ──────────────────────────────────────────────────
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Neon Auth (required in production, optional in dev for header fallback)
    NEON_AUTH_BASE_URL: z.string().url().optional(),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),

    // API (server-to-server)
    API_URL: z.string().url().optional(),

    // Sentry
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    // Standalone output mode
    STANDALONE: z.enum(['true', 'false']).optional(),

    // Bundle analyzer
    ANALYZE: z.enum(['true', 'false']).optional(),
  },

  // ─── Client-Side Variables ─────────────────────────────────────────────────
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),

    // Analytics (PostHog)
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

    // Feature flags
    NEXT_PUBLIC_FEATURE_DASHBOARD_CHARTS: z.enum(['true', 'false']).optional(),
  },

  // ─── Runtime Environment ───────────────────────────────────────────────────
  // Map process.env to the schema above. Required by t3-env to support
  // tree-shaking (Next.js inlines NEXT_PUBLIC_* at build time).
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
    API_URL: process.env.API_URL,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    STANDALONE: process.env.STANDALONE,
    ANALYZE: process.env.ANALYZE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_NEON_AUTH_URL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_FEATURE_DASHBOARD_CHARTS: process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_CHARTS,
  },

  // Skip validation during Docker builds or CI where env vars aren't available
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  // Treat empty strings as undefined (common .env pitfall)
  emptyStringAsUndefined: true,
});
