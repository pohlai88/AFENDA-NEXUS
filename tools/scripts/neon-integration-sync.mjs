#!/usr/bin/env node
/**
 * neon-integration-sync.mjs — Validate NEON-INTEGRATION.md sync.
 *
 * Runs checks from packages/db/docs/NEON-INTEGRATION.md:
 *   1. db:check — Drizzle snapshot ↔ migrations consistency
 *   2. db:ci — No pending schema changes
 *   3. Optional: env validation (DATABASE_URL pooler, NEON_AUTH_BASE_URL format)
 *
 * Usage:
 *   node tools/scripts/neon-integration-sync.mjs
 *   node tools/scripts/neon-integration-sync.mjs --env   # also validate env vars
 *   pnpm neon:sync       # from monorepo root
 */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Load .env from monorepo root for --env validation
try {
  const envPath = resolve(ROOT, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
} catch {
  /* ignore */
}

const args = process.argv.slice(2);
const values = { env: args.includes('--env') };

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd ?? ROOT,
    stdio: opts.silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    ...opts,
  });
}

console.log('> NEON Integration Sync (packages/db/docs/NEON-INTEGRATION.md)\n');

// 1. db:check
console.log('1. drizzle-kit check (snapshot ↔ migrations)...');
try {
  run('pnpm --filter @afenda/db db:check', { cwd: ROOT });
  console.log('   ✓ Passed\n');
} catch (e) {
  console.error('   ✗ Failed');
  process.exit(1);
}

// 2. db:ci (check + generate dry-run)
console.log('2. db:ci (no pending schema changes)...');
try {
  run('pnpm db:ci', { cwd: ROOT });
  console.log('   ✓ Passed\n');
} catch (e) {
  console.error('   ✗ Failed');
  process.exit(1);
}

// 3. Optional env validation
if (values.env) {
  console.log('3. Env validation...');
  const dbUrl = process.env.DATABASE_URL ?? '';
  const dbDirect = process.env.DATABASE_URL_DIRECT ?? '';
  const authUrl = process.env.NEON_AUTH_BASE_URL ?? '';

  let ok = true;
  if (dbUrl && !dbUrl.includes('pooler')) {
    console.warn('   ⚠ DATABASE_URL should use -pooler endpoint for pooled connections');
    ok = false;
  }
  if (dbDirect && dbDirect.includes('pooler')) {
    console.warn('   ⚠ DATABASE_URL_DIRECT should NOT use -pooler (use direct for migrations)');
    ok = false;
  }
  if (authUrl && !authUrl.includes('neonauth')) {
    console.warn('   ⚠ NEON_AUTH_BASE_URL should match pattern ...neonauth....aws.neon.tech/...');
    ok = false;
  }
  // SSL: prefer verify-full to avoid pg-connection-string deprecation warning
  for (const [name, url] of [
    ['DATABASE_URL', dbUrl],
    ['DATABASE_URL_DIRECT', dbDirect],
  ]) {
    if (url && url.includes('sslmode=require') && !url.includes('uselibpqcompat')) {
      console.warn(
        `   ⚠ ${name}: use sslmode=verify-full to avoid pg-connection-string deprecation`
      );
      ok = false;
    }
  }
  if (ok) {
    console.log('   ✓ Env vars OK\n');
  }
}

console.log('✓ NEON integration sync validated');
