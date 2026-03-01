/**
 * Global setup — runs once before the entire test suite.
 *
 * Responsibilities:
 *  1. Seed a test user (idempotent) by calling:
 *       a. Neon Auth directly (NEON_AUTH_BASE_URL/sign-up/email), OR
 *       b. The web app's /api/auth/sign-up/email proxy (fallback)
 *  2. Obtain a session token by calling Neon Auth sign-in directly.
 *  3. Inject the session cookie into a browser context and save storageState.
 *
 * Strategy: calling Neon Auth directly avoids the localhost CSRF check that
 * blocks browser-level sign-in via POST /api/auth/sign-in/email at localhost.
 *
 * Credentials are supplied via env vars:
 *  - NEON_AUTH_BASE_URL  — direct Neon Auth service URL
 *  - TEST_USER_EMAIL     (default: e2e-user@afenda-test.local)
 *  - TEST_USER_PASSWORD  (default: E2eTestP@ss1!)
 *  - TEST_USER_NAME      (default: E2E User)
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DIR = path.resolve(__dirname, 'playwright/.auth');
const AUTH_FILE = path.resolve(AUTH_DIR, 'state.json');
const SEED_LOCK = path.resolve(AUTH_DIR, 'seeded');

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'e2e-user@afenda-test.local';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'E2eTestP@ss1!';
const TEST_NAME = process.env.TEST_USER_NAME ?? 'E2E User';

// Neon Auth service URL (used to call auth API directly, bypassing localhost CSRF)
const NEON_AUTH_URL = process.env.NEON_AUTH_BASE_URL ?? '';
const WEB_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

// Direct database URL for verifying test user email (Neon HTTP SQL API)
const DATABASE_URL_DIRECT = process.env.DATABASE_URL_DIRECT ?? '';

// Cookie name written by Neon Auth on sign-in
const SESSION_COOKIE = '__Secure-neon-auth.session_token';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Directly update neon_auth.user to set emailVerified=true for the test user.
 *
 * Neon Auth requires email verification before sign-in is permitted.
 * In E2E tests, we skip the email verification flow and set this directly
 * via the Neon HTTP SQL API (no npm package needed — uses built-in fetch).
 *
 * API docs: https://neon.tech/docs/serverless/serverless-driver#http-fetch-handler
 */
async function verifyTestUserEmail(): Promise<void> {
  if (!DATABASE_URL_DIRECT) {
    console.warn('[globalSetup] DATABASE_URL_DIRECT not set — skipping email verification.');
    return;
  }

  // Parse the host from the connection string for the Neon HTTP SQL endpoint
  const dbUrl = new URL(DATABASE_URL_DIRECT);
  const neonHost = dbUrl.hostname; // e.g. ep-fancy-wildflower-a1o82bpk.ap-southeast-1.aws.neon.tech

  const sqlEndpoint = `https://${neonHost}/sql`;
  const res = await fetch(sqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': DATABASE_URL_DIRECT,
    },
    body: JSON.stringify({
      query:
        'UPDATE neon_auth."user" SET "emailVerified" = true WHERE email = $1 RETURNING id, email, "emailVerified"',
      params: [TEST_EMAIL],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(
      `[globalSetup] Failed to verify test user email via HTTP SQL API (${res.status}): ${text}`
    );
    return;
  }

  const result = (await res.json()) as { rows: unknown[] };
  if (result.rows?.length) {
    console.log(`[globalSetup] Test user email verified in neon_auth.user — ${TEST_EMAIL}`);
  } else {
    console.log(`[globalSetup] Test user not found in neon_auth.user yet (will retry on re-seed).`);
  }
}

/**
 * Call an endpoint directly on the Neon Auth service for sign-up/sign-in.
 * Returns { status, body, setCookieHeader }.
 * Using the direct Neon Auth URL bypasses the Next.js CSRF proxy check.
 */
async function neonAuthPost(
  path: string,
  body: Record<string, string>,
  existingCookies?: string
): Promise<{ status: number; body: unknown; rawCookies: string[] }> {
  if (!NEON_AUTH_URL) {
    throw new Error('[globalSetup] NEON_AUTH_BASE_URL is not set — cannot authenticate directly.');
  }
  const url = `${NEON_AUTH_URL}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: NEON_AUTH_URL, // Use the Neon Auth URL itself as origin (trusted)
      ...(existingCookies ? { Cookie: existingCookies } : {}),
    },
    body: JSON.stringify(body),
  });
  const rawCookies: string[] = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') rawCookies.push(value);
  });
  const responseBody = await res.json().catch(() => null);
  return { status: res.status, body: responseBody, rawCookies };
}

async function seedTestUser(): Promise<void> {
  if (!NEON_AUTH_URL) {
    // Fallback: try via web proxy (may get 422 if user exists, which is fine)
    const res = await fetch(`${WEB_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
    });
    const alreadyExists = res.status === 409 || res.status === 422;
    if (!res.ok && !alreadyExists) {
      const body = await res.text().catch(() => '');
      throw new Error(`[globalSetup] Failed to seed test user. Status ${res.status}: ${body}`);
    }
    console.log(
      `[globalSetup] Test user seeded via web proxy — ${TEST_EMAIL} (status: ${res.status})`
    );
    return;
  }

  const { status } = await neonAuthPost('sign-up/email', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: TEST_NAME,
  });

  // 200 = created, 422 = already exists (Better Auth)
  const alreadyExists = status === 409 || status === 422;
  if (status >= 400 && !alreadyExists) {
    throw new Error(`[globalSetup] Failed to seed test user via Neon Auth. Status: ${status}`);
  }
  console.log(`[globalSetup] Test user seeded via Neon Auth — ${TEST_EMAIL} (status: ${status})`);

  // Always verify email — Neon Auth requires it before sign-in
  await verifyTestUserEmail();
}

/**
 * Sign in to Neon Auth directly, get session cookies, and inject them into
 * a browser context at localhost:3000. Then save storageState for all tests.
 *
 * This bypasses the localhost CSRF check in the Next.js auth proxy.
 */
async function loginAndSaveState(_config: FullConfig): Promise<void> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  if (!NEON_AUTH_URL) {
    // No direct Neon Auth URL — fall back to browser login
    console.warn(
      '[globalSetup] NEON_AUTH_BASE_URL not set — falling back to browser login (may fail with 403).'
    );
    await browserLogin();
    return;
  }

  // 1. Sign in via Neon Auth directly
  const { status, body, rawCookies } = await neonAuthPost('sign-in/email', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (status >= 400) {
    console.error('[globalSetup] Neon Auth sign-in failed:', status, body);
    console.warn('[globalSetup] Falling back to browser login...');
    await browserLogin();
    return;
  }

  console.log(`[globalSetup] Neon Auth sign-in succeeded (status: ${status})`);

  // 2. Parse session cookies from Set-Cookie headers
  // rawCookies may be in form: "name=value; Path=/; HttpOnly; SameSite=Lax"
  const parsedCookies = rawCookies.map((raw) => {
    const parts = raw.split(';').map((p) => p.trim());
    const nameValuePart = parts[0] ?? '';
    const attrs = parts.slice(1);
    const eqIdx = nameValuePart.indexOf('=');
    const name = nameValuePart.slice(0, eqIdx);
    const value = nameValuePart.slice(eqIdx + 1);
    const attrMap: Record<string, string | boolean> = {};
    for (const attr of attrs) {
      const eqPos = attr.indexOf('=');
      const attrKey = eqPos >= 0 ? attr.slice(0, eqPos) : attr;
      const attrVal = eqPos >= 0 ? attr.slice(eqPos + 1) : undefined;
      attrMap[attrKey.toLowerCase().trim()] = attrVal ?? true;
    }
    return { name, value, attrMap };
  });

  if (parsedCookies.length === 0) {
    console.warn(
      '[globalSetup] No Set-Cookie headers in Neon Auth response — falling back to browser login.'
    );
    await browserLogin();
    return;
  }

  // 3. Inject cookies into a browser context pointed at localhost:3000
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Visit the app first so cookies have a domain to attach to
    await context.clearCookies();
    const cookieObjects = parsedCookies.map(({ name, value }) => ({
      name,
      value,
      domain: 'localhost',
      path: '/',
      httpOnly: name.startsWith('__Host-') || name.startsWith('__Secure-'),
      secure: true, // Playwright allows secure cookies even on localhost via CDP
      sameSite: 'Lax' as const,
    }));
    await context.addCookies(cookieObjects);

    // Navigate to verify session is accepted
    const page = await context.newPage();
    page.on('pageerror', (err) => {
      console.warn(`[globalSetup] Page error: ${err.message}`);
    });

    await page.goto(`${WEB_URL}/`, { waitUntil: 'load', timeout: 30_000 });
    console.log(`[globalSetup] Injected session — URL after navigation: ${page.url()}`);

    // If redirected to onboarding (no org), create one so shell routes work
    if (page.url().includes('/onboarding')) {
      const orgSlug = `e2e-${Date.now().toString(36)}`;
      await page.getByLabel(/organization name/i).waitFor({ state: 'visible', timeout: 10_000 });
      await page.getByLabel(/organization name/i).fill('E2E Test Org');
      await page.locator('#orgSlug').fill(orgSlug);
      await page.getByRole('button', { name: /create organization|creating/i }).click();
      await page.waitForURL((u) => !u.pathname.includes('onboarding'), { timeout: 20_000 });
      console.log(`[globalSetup] Created org (slug: ${orgSlug}) — now on: ${page.url()}`);
    }

    // Navigate to /finance to ensure shell + tenant context are ready before saving
    await page.goto(`${WEB_URL}/finance`, { waitUntil: 'load', timeout: 15_000 });
    if (page.url().includes('/onboarding')) {
      throw new Error('[globalSetup] Still on onboarding after org creation — session may not have active org.');
    }
    console.log(`[globalSetup] Finance route OK — URL: ${page.url()}`);

    // Save storage state
    await context.storageState({ path: AUTH_FILE });
    console.log(`[globalSetup] Storage state saved → ${AUTH_FILE}`);
  } finally {
    await browser.close();
  }
}

async function browserLogin(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${WEB_URL}/login`, { waitUntil: 'load' });
    page.on('pageerror', (err) => {
      console.warn(`[globalSetup] Page error during login: ${err.message}`);
    });

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(
      (url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/register'),
      { timeout: 30_000, waitUntil: 'load' }
    );

    console.log(`[globalSetup] Browser login succeeded — URL: ${page.url()}`);
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({ path: AUTH_FILE });
    console.log(`[globalSetup] Storage state saved → ${AUTH_FILE}`);
  } finally {
    await browser.close();
  }
}

// ─── Exported setup function ──────────────────────────────────────────────────

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Skip seeding if we already did it this run (useful when re-running)
  if (!fs.existsSync(SEED_LOCK)) {
    await seedTestUser(); // seedTestUser also calls verifyTestUserEmail()
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    fs.writeFileSync(SEED_LOCK, new Date().toISOString());
  } else {
    console.log('[globalSetup] User already seeded this run — skipping.');
    // Still verify email in case it got reset (e.g., database restore)
    await verifyTestUserEmail();
  }

  await loginAndSaveState(config);

  console.log('[globalSetup] ✓ Complete — auth state ready for all tests.');
}
