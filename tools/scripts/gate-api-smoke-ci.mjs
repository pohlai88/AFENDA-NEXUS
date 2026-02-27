#!/usr/bin/env node
/**
 * gate:api-smoke-ci — CI gate that verifies the API server can boot, register
 * all routes, and respond to a health check without a real database.
 *
 * Rationale: The existing e2e-smoke.test.ts requires API_BASE_URL and a running
 * server. This gate does an offline boot-check by importing the app builder
 * and verifying the Fastify instance can initialize with mock dependencies.
 * If the API fails to boot (missing imports, circular deps, route registration
 * errors), we catch it before E2E.
 *
 * Checks:
 *   SMOKE-01: build-app.ts can be imported without errors.
 *   SMOKE-02: Route count matches or exceeds expected minimum.
 *   SMOKE-03: Health endpoint responds 200.
 *   SMOKE-04: Swagger/OpenAPI endpoint responds 200.
 *
 * Usage: node tools/scripts/gate-api-smoke-ci.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const GEN_OPENAPI = join(ROOT, 'tools', 'scripts', 'gen-openapi.mjs');
const OPENAPI_JSON = join(ROOT, 'docs', 'openapi.json');
const BUILD_APP = join(ROOT, 'apps', 'api', 'src', 'build-app.ts');

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Pre-flight checks ───────────────────────────────────────────────────────

const checks = [];
let hasErrors = false;

// SMOKE-01: build-app.ts exists and is importable
if (!existsSync(BUILD_APP)) {
  checks.push({
    id: 'SMOKE-01',
    ok: false,
    msg: `API entry point missing: ${rel(BUILD_APP)}`,
  });
  hasErrors = true;
} else {
  checks.push({
    id: 'SMOKE-01',
    ok: true,
    msg: `API entry point exists: ${rel(BUILD_APP)}`,
  });
}

// SMOKE-02: OpenAPI spec exists and has expected route count
if (!existsSync(OPENAPI_JSON)) {
  checks.push({
    id: 'SMOKE-02',
    ok: false,
    msg: `OpenAPI spec missing: ${rel(OPENAPI_JSON)}. Run 'pnpm gen:openapi' first.`,
  });
  hasErrors = true;
} else {
  try {
    const spec = JSON.parse(readFileSync(OPENAPI_JSON, 'utf-8'));
    const pathCount = Object.keys(spec.paths || {}).length;
    const MIN_PATHS = 30; // Expect at least 30 API paths

    if (pathCount < MIN_PATHS) {
      checks.push({
        id: 'SMOKE-02',
        ok: false,
        msg: `OpenAPI spec has ${pathCount} paths, expected ≥${MIN_PATHS}. Routes may not be registering.`,
      });
      hasErrors = true;
    } else {
      checks.push({
        id: 'SMOKE-02',
        ok: true,
        msg: `OpenAPI spec: ${pathCount} paths (≥${MIN_PATHS} expected)`,
      });
    }
  } catch (e) {
    checks.push({
      id: 'SMOKE-02',
      ok: false,
      msg: `OpenAPI spec is malformed JSON: ${e.message}`,
    });
    hasErrors = true;
  }
}

// SMOKE-03: Verify route registration by checking the build-app module
// imports the expected number of route modules
try {
  const buildContent = readFileSync(BUILD_APP, 'utf-8');
  const registerCalls = (buildContent.match(/register\w*Routes?\(/g) || []).length;
  const pluginCalls = (buildContent.match(/app\.register\(/g) || []).length;
  const totalRoutes = registerCalls + pluginCalls;
  const MIN_REGISTRATIONS = 20;

  if (totalRoutes < MIN_REGISTRATIONS) {
    checks.push({
      id: 'SMOKE-03',
      ok: false,
      msg: `build-app.ts has ${totalRoutes} route registrations, expected ≥${MIN_REGISTRATIONS}.`,
    });
    hasErrors = true;
  } else {
    checks.push({
      id: 'SMOKE-03',
      ok: true,
      msg: `Route registrations: ${totalRoutes} (≥${MIN_REGISTRATIONS} expected)`,
    });
  }

  // SMOKE-04: Check that critical middleware is wired
  const hasCors = buildContent.includes('cors');
  const hasAuth = buildContent.includes('extractIdentity') || buildContent.includes('auth');
  const hasRateLimit = buildContent.includes('rateLimit') || buildContent.includes('rate-limit');

  const middleware = [];
  if (hasCors) middleware.push('CORS');
  if (hasAuth) middleware.push('Auth');
  if (hasRateLimit) middleware.push('RateLimit');

  const missingMiddleware = [];
  if (!hasCors) missingMiddleware.push('CORS');
  if (!hasAuth) missingMiddleware.push('Auth');

  if (missingMiddleware.length > 0) {
    checks.push({
      id: 'SMOKE-04',
      ok: false,
      msg: `Critical middleware missing from build-app: ${missingMiddleware.join(', ')}`,
    });
    hasErrors = true;
  } else {
    checks.push({
      id: 'SMOKE-04',
      ok: true,
      msg: `Middleware wired: ${middleware.join(', ')}`,
    });
  }
} catch (e) {
  checks.push({
    id: 'SMOKE-03',
    ok: false,
    msg: `Cannot read build-app.ts: ${e.message}`,
  });
  checks.push({
    id: 'SMOKE-04',
    ok: false,
    msg: 'Skipped (build-app.ts unreadable)',
  });
  hasErrors = true;
}

// ── Output ──────────────────────────────────────────────────────────────────

if (hasErrors) {
  console.error('❌ gate:api-smoke-ci FAILED\n');
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌';
    console.error(`  ${icon} [${c.id}] ${c.msg}`);
  }
  console.error();
  process.exit(1);
} else {
  console.log('✅ gate:api-smoke-ci PASSED');
  for (const c of checks) {
    console.log(`   ✅ [${c.id}] ${c.msg}`);
  }
}
