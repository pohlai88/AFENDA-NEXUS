#!/usr/bin/env node
/**
 * gen-openapi.mjs — Offline OpenAPI spec generation.
 *
 * 1. Builds the API app (tsup) so build-app.js is available
 * 2. Imports buildApp() from the built ESM output
 * 3. Creates a Fastify instance with mock deps (no DB needed)
 * 4. Extracts the @fastify/swagger spec via app.swagger()
 * 5. Writes sorted JSON to docs/openapi.json
 *
 * Usage:
 *   node tools/scripts/gen-openapi.mjs                       # writes docs/openapi.json
 *   node tools/scripts/gen-openapi.mjs --output /tmp/o.json  # custom output path
 *
 * No running server or database needed.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DEFAULT_OUTPUT = join(ROOT, 'docs', 'openapi.json');

// Parse --output flag
const args = process.argv.slice(2);
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx >= 0 && args[outputIdx + 1]
  ? resolve(args[outputIdx + 1])
  : DEFAULT_OUTPUT;

// ── Step 1: Build the API so dist/build-app.js exists ──────────────────────
console.log('📦 Building @afenda/api...');
execSync('pnpm --filter @afenda/api build', { cwd: ROOT, stdio: 'inherit' });

// ── Step 2: Stub env vars so loadConfig() / plugins don't crash ────────────
process.env.DATABASE_URL ??= 'postgresql://localhost:5432/afenda_openapi';
process.env.PORT_API ??= '0';
process.env.PORT_WEB ??= '3000';
process.env.NODE_ENV ??= 'development';

// ── Step 3: Import buildApp from the built ESM bundle ──────────────────────
const buildAppPath = pathToFileURL(join(ROOT, 'apps', 'api', 'dist', 'build-app.js')).href;
const { buildApp } = await import(buildAppPath);

// ── Step 4: Create app with mock deps ──────────────────────────────────────
const noop = () => { };
const mockLogger = { info: noop, warn: noop, error: noop, debug: noop, child: () => mockLogger };
const mockSession = { withTenant: () => Promise.resolve({ ok: true, value: null }) };

const app = await buildApp({
  config: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL_MODE: 'disable',
    PORT_API: 0,
    PORT_WEB: 3000,
    APP_URL: 'http://localhost:3000',
  },
  db: {},
  session: mockSession,
  readOnlySession: null,
  healthCheck: async () => { },
  logger: mockLogger,
});

await app.ready();
const spec = app.swagger();

// ── Step 5: Write spec ─────────────────────────────────────────────────────
const sorted = JSON.stringify(spec, null, 2);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sorted + '\n', 'utf-8');

const pathCount = Object.keys(spec.paths ?? {}).length;
console.log(`✅ OpenAPI spec written to ${outputPath}`);
console.log(`   ${pathCount} path(s) documented`);

await app.close();
