/**
 * Global teardown — runs once after the entire test suite.
 *
 * Cleans up:
 *  - The seed-lock file (allows fresh seed on next run if needed)
 *  - Optionally deletes the test tenant/user from the DB via a cleanup
 *    endpoint. This keeps the test DB tidy across CI runs.
 *
 * The actual auth state file (playwright/.auth/state.json) is intentionally
 * NOT deleted here — Playwright's `--update-snapshots` and report commands
 * may need it after the run. It's gitignored and ephemeral in CI anyway.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DIR = path.resolve(__dirname, 'playwright/.auth');
const SEED_LOCK = path.resolve(AUTH_DIR, 'seeded');

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'e2e-user@afenda-test.local';
const API_URL = 'http://localhost:3001';

export default async function globalTeardown(): Promise<void> {
  // Remove seed lock — next run will re-seed cleanly
  if (fs.existsSync(SEED_LOCK)) {
    fs.rmSync(SEED_LOCK);
  }

  // Best-effort cleanup: delete the test user via an internal test endpoint.
  // This endpoint only exists when NODE_ENV=test to prevent misuse.
  // It's not a fatal failure if it 404s (the endpoint may not be implemented yet).
  if (process.env.NODE_ENV === 'test') {
    try {
      const res = await fetch(`${API_URL}/api/test/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL }),
      });

      if (res.ok) {
        console.log(`[globalTeardown] Test user cleaned up — ${TEST_EMAIL}`);
      } else if (res.status === 404) {
        // Cleanup endpoint not yet implemented — ignore
      } else {
        console.warn(`[globalTeardown] Cleanup returned status ${res.status} — continuing.`);
      }
    } catch {
      // Server may have already stopped — ignore
    }
  }

  console.log('[globalTeardown] ✓ Complete.');
}
