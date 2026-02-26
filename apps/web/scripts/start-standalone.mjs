/**
 * start-standalone.mjs
 *
 * Prepares and starts the Next.js standalone server (output: 'standalone').
 *
 * In a pnpm monorepo, `next build` with `output: 'standalone'` emits:
 *   .next/standalone/apps/web/server.js
 *
 * But it does NOT copy:
 *   .next/static/   → .next/standalone/apps/web/.next/static/
 *   public/         → .next/standalone/apps/web/public/
 *
 * This script ensures those directories are present before starting.
 * Used by `apps/e2e` Playwright webServer in local + CI.
 */
import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

const standaloneDir = join(webRoot, '.next', 'standalone', 'apps', 'web');
const serverJs = join(standaloneDir, 'server.js');

// Copy .next/static → standalone/.next/static
const staticSrc = join(webRoot, '.next', 'static');
const staticDst = join(standaloneDir, '.next', 'static');
if (existsSync(staticSrc)) {
  mkdirSync(staticDst, { recursive: true });
  cpSync(staticSrc, staticDst, { recursive: true, force: false });
}

// Copy public/ → standalone/public/
const publicSrc = join(webRoot, 'public');
const publicDst = join(standaloneDir, 'public');
if (existsSync(publicSrc)) {
  mkdirSync(publicDst, { recursive: true });
  cpSync(publicSrc, publicDst, { recursive: true, force: false });
}

// Start the standalone server — inherit env + stdio
const child = spawn(process.execPath, [serverJs], {
  stdio: 'inherit',
  env: process.env,
  cwd: standaloneDir,
});

child.on('exit', (code) => process.exit(code ?? 0));
