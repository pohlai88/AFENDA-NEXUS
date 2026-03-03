#!/usr/bin/env node
/**
 * gate:security-headers — Validate security configurations and headers
 *
 * Checks:
 *   SEC-01: API routes must verify authentication
 *   SEC-02: Server actions must validate authorization
 *   SEC-03: Environment variables must not be exposed to client
 *   SEC-04: Sensitive data must not be logged
 *   SEC-05: Database queries must use parameterized statements
 *   SEC-06: Next.js config must have security headers
 *
 * Usage: node tools/scripts/gate-security-headers.mjs
 *
 * Reference: OWASP Top 10, Next.js Security Best Practices
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const WEB_DIR = join(ROOT, 'apps', 'web');
const API_DIR = join(ROOT, 'apps', 'api');

const failures = [];

function walkFiles(dir, pattern, out = []) {
  try {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walkFiles(full, pattern, out);
      } else if (pattern.test(name)) {
        out.push(full);
      }
    }
  } catch (_) {}
  return out;
}

function rel(p) {
  return p.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

// ─── SEC-01: API Routes Must Verify Authentication ───────────────────────────

const apiRoutes = [
  ...walkFiles(join(WEB_DIR, 'src', 'app'), /route\.ts$/),
  ...walkFiles(join(API_DIR, 'src'), /-routes\.ts$/),
];

for (const file of apiRoutes) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  // Skip if file has auth check exemption comment
  if (content.includes('@gate-allow-unauth')) continue;

  // Check for GET/POST/PUT/PATCH/DELETE exports
  const hasExport =
    /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|get|post|put|patch|delete)/g.test(
      content
    );

  if (!hasExport) continue;

  // Verify auth check exists
  const hasAuthCheck =
    /getServerSession|await auth\(|requireAuth|verifyToken|checkAuth/.test(content) ||
    /getAuth|auth\(\)|session/.test(content);

  if (!hasAuthCheck) {
    failures.push({
      gate: 'SEC-01',
      file: r,
      issue: 'API route handler missing authentication check',
      fix: 'Add auth verification: const session = await getServerSession(); if (!session) return Response.json({error: "Unauthorized"}, {status: 401});',
    });
  }
}

// ─── SEC-02: Server Actions Must Validate Authorization ──────────────────────

const serverActionFiles = [
  ...walkFiles(join(WEB_DIR, 'src'), /\.server\.ts$/),
  ...walkFiles(join(WEB_DIR, 'src'), /actions\.ts$/),
];

for (const file of serverActionFiles) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  // Skip if no "use server" directive
  if (!content.includes('"use server"') && !content.includes("'use server'")) continue;

  // Skip if file has auth check exemption comment
  if (content.includes('@gate-allow-unauth')) continue;

  // Check for exported async functions
  const hasServerAction = /export\s+async\s+function\s+\w+/.test(content);

  if (!hasServerAction) continue;

  // Verify auth check exists
  const hasAuthCheck =
    /getServerSession|await auth\(|auth\.|requireAuth|verifyToken|checkAuth|getRequestContext/.test(
      content
    );

  if (!hasAuthCheck) {
    failures.push({
      gate: 'SEC-02',
      file: r,
      issue: 'Server action missing authorization check',
      fix: 'Add auth at function start: const session = await getServerSession(); if (!session) throw new Error("Unauthorized");',
    });
  }
}

// ─── SEC-03: Environment Variables Must Not Be Exposed ───────────────────────

const clientFiles = walkFiles(join(WEB_DIR, 'src'), /\.(ts|tsx)$/);

for (const file of clientFiles) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  // Skip server-only files
  if (file.includes('.server.') || file.includes('/app/api/')) continue;

  // Skip Server Components (files without "use client" are server-side in App Router)
  if (!content.includes('"use client"') && !content.includes("'use client'")) continue;

  // Check for process.env access without NEXT_PUBLIC_ prefix
  const envMatches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);

  for (const match of envMatches) {
    const varName = match[1];
    // NODE_ENV and NEXT_RUNTIME are inlined by Next.js at build time — safe in client code
    if (varName === 'NODE_ENV' || varName === 'NEXT_RUNTIME') continue;
    if (!varName.startsWith('NEXT_PUBLIC_')) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      failures.push({
        gate: 'SEC-03',
        file: r,
        line: lineNum,
        issue: `Non-public env var "${varName}" accessed in client code`,
        fix: `Rename to NEXT_PUBLIC_${varName} or move logic to server component/action`,
      });
    }
  }
}

// ─── SEC-04: Sensitive Data Must Not Be Logged ───────────────────────────────

const allTsFiles = [
  ...walkFiles(join(WEB_DIR, 'src'), /\.(ts|tsx)$/),
  ...walkFiles(join(API_DIR, 'src'), /\.(ts|tsx)$/),
];

const SENSITIVE_PATTERNS = [
  /console\.log\([^)]*password[^)]*\)/gi,
  /console\.log\([^)]*token[^)]*\)/gi,
  /console\.log\([^)]*secret[^)]*\)/gi,
  /console\.log\([^)]*apiKey[^)]*\)/gi,
  /console\.log\([^)]*creditCard[^)]*\)/gi,
];

for (const file of allTsFiles) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  for (const pattern of SENSITIVE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      failures.push({
        gate: 'SEC-04',
        file: r,
        line: lineNum,
        issue: 'Potentially sensitive data logged',
        fix: 'Remove or redact sensitive data from logs',
      });
    }
  }
}

// ─── SEC-05: Database Queries Must Use Parameterized Statements ──────────────

const dbFiles = [
  ...walkFiles(join(API_DIR, 'src'), /\.(ts|tsx)$/),
  ...walkFiles(join(WEB_DIR, 'src'), /\.server\.ts$/),
];

for (const file of dbFiles) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  // Check for string concatenation in SQL queries (basic check)
  const sqlConcatPatterns = [
    /sql`[^`]*\$\{[^}]+\}[^`]*`/g, // Template literals in sql tags
    /query\(['"](SELECT|INSERT|UPDATE|DELETE)[^'"]*\+/gi, // String concatenation
  ];

  for (const pattern of sqlConcatPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      // Skip if using proper parameterization (drizzle patterns)
      if (match[0].includes('${sql.placeholder(') || match[0].includes('eq(')) continue;

      const lineNum = content.substring(0, match.index).split('\n').length;
      failures.push({
        gate: 'SEC-05',
        file: r,
        line: lineNum,
        issue: 'Possible SQL injection risk - use parameterized queries',
        fix: 'Use Drizzle query builder or parameterized SQL: db.select().from(table).where(eq(column, value))',
      });
    }
  }
}

// ─── SEC-06: Next.js Config Must Have Security Headers ───────────────────────

const nextConfigPath = join(WEB_DIR, 'next.config.mjs');
if (existsSync(nextConfigPath)) {
  const content = readFileSync(nextConfigPath, 'utf-8');

  const requiredHeaders = [
    { key: 'X-Frame-Options', pattern: /X-Frame-Options/i },
    { key: 'X-Content-Type-Options', pattern: /X-Content-Type-Options/i },
    { key: 'Referrer-Policy', pattern: /Referrer-Policy/i },
    { key: 'Content-Security-Policy', pattern: /Content-Security-Policy/i, optional: true },
  ];

  for (const { key, pattern, optional } of requiredHeaders) {
    if (!pattern.test(content) && !optional) {
      failures.push({
        gate: 'SEC-06',
        file: rel(nextConfigPath),
        issue: `Missing security header: ${key}`,
        fix: `Add to next.config.mjs headers: { key: '${key}', value: '...' }`,
      });
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:security-headers FAILED\n');
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }

  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate}: ${items.length} violation(s)`);
    for (const v of items.slice(0, 3)) {
      const loc = v.line ? `:${v.line}` : '';
      console.error(`    ${v.file}${loc}`);
      console.error(`      Issue: ${v.issue}`);
      console.error(`      Fix: ${v.fix}`);
    }
    if (items.length > 3) {
      console.error(`    ... and ${items.length - 3} more`);
    }
    console.error();
  }

  console.error(
    '  Reference: https://nextjs.org/docs/app/building-your-application/configuring/security-headers'
  );
  process.exit(1);
}

console.log('✅ gate:security-headers PASSED');
console.log(`  Scanned ${apiRoutes.length} API routes`);
console.log(`  Scanned ${serverActionFiles.length} server action files`);
console.log('  No security violations found');
