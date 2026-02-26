import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotenv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env first (contains DATABASE_URL, NEON_AUTH_BASE_URL, etc.)
loadDotenv({ path: path.resolve(__dirname, '../../.env') });
// Load e2e-specific overrides (TEST_USER_EMAIL, TEST_USER_PASSWORD, etc.)
loadDotenv({ path: path.resolve(__dirname, '.env'), override: true });

// Legacy: DATABASE_URL_UNPOOLED was old name; prefer DATABASE_URL_DIRECT
if (!process.env.DATABASE_URL_DIRECT && process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL_DIRECT = process.env.DATABASE_URL_UNPOOLED;
}

const isCI = !!process.env.CI;

// Resolved paths to sibling apps
const apiDir = path.resolve(__dirname, '../api');
const webDir = path.resolve(__dirname, '../web');

// Auth state written by globalSetup, consumed by all tests
export const STORAGE_STATE = path.resolve(__dirname, 'playwright/.auth/state.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // ─── Reporters ──────────────────────────────────────────────────────────
  reporter: isCI
    ? [['blob'], ['github'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  outputDir: 'test-results',

  // ─── Shared test settings ───────────────────────────────────────────────
  use: {
    baseURL: 'http://localhost:3000',

    // Session state written once by globalSetup
    storageState: STORAGE_STATE,

    // Artifacts — only collected on failure / retry
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // Generous navigation timeout for prod server cold boot
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },

  // ─── Projects ───────────────────────────────────────────────────────────
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // ─── Web servers (BUILT, not dev) ───────────────────────────────────────
  webServer: [
    {
      // Fastify API — built via `pnpm build` → dist/index.js
      command: 'node dist/index.js',
      cwd: apiDir,
      port: 3001,
      timeout: 30_000,
      reuseExistingServer: !isCI,
      env: {
        NODE_ENV: 'test',
        PORT_API: '3001',
        // Forward all required vars explicitly — playwright replaces childenv, so parent vars aren't inherited automatically.
        // loadConfig (platform) validates DATABASE_URL + DATABASE_URL_DIRECT via Zod (required, URL).
        // Do NOT set NEON_AUTH_BASE_URL here — let find-up load root .env so Zod gets the real value.
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT ?? '',
      },
    },
    {
      // Next.js web — built with output:standalone.
      // In a pnpm monorepo, Next.js places the entry at apps/web/server.js inside standalone.
      command: 'pnpm start:standalone',
      cwd: webDir,
      port: 3000,
      timeout: 60_000,
      reuseExistingServer: !isCI,
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'http://localhost:3001',
        // Forward DB + auth vars that Next.js server actions / middleware may need
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT ?? '',
        NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL ?? '',
        NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET ?? '',
      },
    },
  ],
});
