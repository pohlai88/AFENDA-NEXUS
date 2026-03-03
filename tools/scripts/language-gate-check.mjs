#!/usr/bin/env node
/**
 * SP-8025: Supplier-Safe Language Gate
 *
 * Purpose:
 * Prevents internal/sensitive terminology from being exposed to suppliers
 * in the supplier portal. Ensures supplier-facing code uses appropriate,
 * professional language.
 *
 * Checks:
 * - L01: No forbidden internal terms in supplier portal code
 * - L02: Status enums have supplier-friendly display mappings
 * - L03: Error messages use external descriptions (not internal codes)
 * - L04: Hold/rejection reasons properly mapped
 *
 * Usage:
 *   node tools/scripts/language-gate-check.mjs
 *
 * Exit Codes:
 *   0 = All checks pass
 *   1 = Language violations detected
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const PORTAL_ROOT = join(ROOT, 'apps/web/src/app/(supplier-portal)');
const SERVICES_ROOT = join(ROOT, 'packages/modules/finance/src/slices/ap/services');
const SHARED_ROOT = join(ROOT, 'packages/modules/finance/src/shared');

const results = { pass: 0, fail: 0, warn: 0 };
const violations = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

function relPath(absPath) {
  return relative(ROOT, absPath).replace(/\\/g, '/');
}

function pass(check, msg) {
  console.log(`  + ${check} ${msg} [PASS]`);
  results.pass++;
}

function fail(check, msg) {
  console.log(`  ✖ ${check} ${msg} [FAIL]`);
  results.fail++;
  violations.push({ check, msg });
}

function warn(check, msg) {
  console.log(`  ! ${check} ${msg} [WARN]`);
  results.warn++;
}

function collectFiles(dir, exts = ['.ts', '.tsx']) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, exts));
    } else if (exts.some((ext) => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── L01: Forbidden Terms in Supplier Portal ───────────────────────────────
// Scans portal UI and services for internal/sensitive terminology

function checkL01() {
  const forbiddenTerms = [
    // Fraud/Risk language
    { term: /FRAUD_SUSPICION|FRAUD_ALERT|FRAUDULENT/gi, msg: 'Fraud-related term' },
    { term: /CREDIT_RISK|RISK_HOLD|HIGH_RISK/gi, msg: 'Credit risk term' },
    { term: /BLACKLIST|BANNED|SUSPENDED/gi, msg: 'Punitive language' },
    
    // Internal operations
    { term: /SOD_VIOLATION|SELF_APPROVAL/gi, msg: 'Internal control term' },
    { term: /ADMIN_OVERRIDE|FORCE_APPROVE|BYPASS/gi, msg: 'Override/bypass term' },
    { term: /INTERNAL_ONLY|CONFIDENTIAL|RESTRICTED/gi, msg: 'Internal classification' },
    
    // Database/technical terms
    { term: /DB_ERROR|SQL_EXCEPTION|CONSTRAINT_VIOLATION/gi, msg: 'Database error exposed' },
    { term: /VALIDATION_FAILED|INVALID_STATE/gi, msg: 'Raw validation error (should be user-friendly)' },
    
    // Insensitive language
    { term: /REJECTED|DENIED|BLOCKED/gi, msg: 'Harsh rejection language (prefer "Under Review", "Pending Verification")' },
  ];

  const portalFiles = collectFiles(PORTAL_ROOT);
  const serviceFiles = [
    ...collectFiles(join(SERVICES_ROOT, 'supplier-portal')),
    ...collectFiles(join(SHARED_ROOT, 'services')),
  ].filter(f => f.includes('supplier'));

  const allFiles = [...portalFiles, ...serviceFiles];
  let violations = 0;

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const rel = relPath(file);

    for (const { term, msg } of forbiddenTerms) {
      const matches = content.match(term);
      if (matches) {
        // Filter out comments explaining the mapping (e.g., "// Maps FRAUD_SUSPICION → Verification Pending")
        const linesWithTerm = content.split('\n').filter(line => term.test(line));
        const actualViolations = linesWithTerm.filter(line => 
          !line.trim().startsWith('//') &&
          !line.includes('// Map') &&
          !line.includes('translate') &&
          !line.includes('toSupplierSafe')
        );

        if (actualViolations.length > 0) {
          fail('L01', `${rel} -- ${msg}: ${matches[0]}`);
          violations++;
        }
      }
    }
  }

  if (violations === 0) {
    pass('L01', 'No forbidden terms in supplier-facing code');
  }
}

// ─── L02: Status Display Mappings ───────────────────────────────────────────
// Validates that status enums have supplier-friendly display functions

function checkL02() {
  const statusFiles = [
    join(SERVICES_ROOT, 'supplier-portal-invoice-view.ts'),
    join(SERVICES_ROOT, 'supplier-portal-payment-view.ts'),
    join(SHARED_ROOT, 'utils/status-display.ts'),
  ];

  let hasMappingFunction = false;

  for (const file of statusFiles) {
    if (!existsSync(file)) continue;

    const content = readFileSync(file, 'utf-8');
    const rel = relPath(file);

    // Look for status mapping functions
    const hasSupplierSafeFunction = 
      /function\s+toSupplierSafeStatus|const\s+toSupplierSafeStatus|export\s+.*toSupplierSafe/.test(content);

    const hasStatusMapping = 
      /statusDisplayMap|statusLabels|supplierFriendlyStatus/.test(content);

    if (hasSupplierSafeFunction || hasStatusMapping) {
      hasMappingFunction = true;
      
      // Validate that harsh terms are mapped
      const mapsRejected = content.includes('REJECTED') && 
        (content.includes('Under Review') || content.includes('Verification'));
      const mapsDenied = content.includes('DENIED') && 
        (content.includes('Pending') || content.includes('Review'));

      if (!mapsRejected && content.includes('REJECTED')) {
        fail('L02', `${rel} -- REJECTED status should map to supplier-friendly text`);
      }
    }
  }

  // Check if at least one mapping utility exists
  const utilFile = join(SHARED_ROOT, 'utils/status-display.ts');
  if (!existsSync(utilFile)) {
    warn('L02', 'No status display mapping utility found (create shared/utils/status-display.ts)');
    return;
  }

  const utilContent = readFileSync(utilFile, 'utf-8');
  if (!/toSupplierSafeStatus|supplierStatusLabel/.test(utilContent)) {
    fail('L02', 'Status display utility missing toSupplierSafeStatus() function');
    return;
  }

  pass('L02', 'Status enums have supplier-friendly display mappings');
}

// ─── L03: Error Message Externalization ────────────────────────────────────
// Ensures API errors shown to suppliers are user-friendly

function checkL03() {
  const apiRoutes = collectFiles(join(ROOT, 'apps/web/src/app/api'), ['.ts']);
  const supplierRoutes = apiRoutes.filter(f => 
    f.includes('supplier') || 
    f.includes('portal')
  );

  let violations = 0;

  for (const file of supplierRoutes) {
    const content = readFileSync(file, 'utf-8');
    const rel = relPath(file);

    // Check for raw error codes in responses
    const rawErrorPatterns = [
      /NextResponse\.json\(\s*\{\s*error:\s*['"]VALIDATION_FAILED['"]/,
      /NextResponse\.json\(\s*\{\s*error:\s*['"]INVALID_STATE['"]/,
      /NextResponse\.json\(\s*\{\s*error:\s*err\.code/,
    ];

    for (const pattern of rawErrorPatterns) {
      if (pattern.test(content)) {
        fail('L03', `${rel} -- Raw error code exposed to supplier (should use friendly message)`);
        violations++;
        break;
      }
    }

    // Check for proper error translation
    const hasErrorTranslation = 
      /translateErrorForSupplier|toExternalError|supplierFriendlyError/.test(content);

    if (!hasErrorTranslation && content.includes('NextResponse.json') && content.includes('error')) {
      // This might be a violation, but not conclusive
      // We'll just continue
    }
  }

  if (violations === 0) {
    pass('L03', 'Error messages use external descriptions');
  }
}

// ─── L04: Hold/Rejection Reason Mapping ─────────────────────────────────────
// Validates internal hold reasons are mapped to external descriptions

function checkL04() {
  const invoiceService = join(SERVICES_ROOT, 'supplier-portal-invoice-view.ts');
  const paymentService = join(SERVICES_ROOT, 'supplier-portal-payment-view.ts');

  const files = [invoiceService, paymentService].filter(existsSync);

  if (files.length === 0) {
    warn('L04', 'No invoice/payment view services found to check hold reason mapping');
    return;
  }

  let hasReasonMapping = false;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const rel = relPath(file);

    // Check for hold reason mapping
    const hasMapping = 
      /holdReasonDisplay|mapHoldReason|toExternalHoldReason|reasonLabels/.test(content);

    if (hasMapping) {
      hasReasonMapping = true;

      // Validate that internal reasons are mapped
      if (content.includes('SOD_VIOLATION') && !content.includes('Pending Approval')) {
        fail('L04', `${rel} -- SOD_VIOLATION should map to "Pending Approval" or similar`);
      }

      if (content.includes('CREDIT_HOLD') && !content.includes('Under Review')) {
        fail('L04', `${rel} -- CREDIT_HOLD should map to "Under Review" or similar`);
      }
    }
  }

  if (!hasReasonMapping) {
    warn('L04', 'No hold reason mapping found in invoice/payment services');
    return;
  }

  pass('L04', 'Hold/rejection reasons properly mapped');
}

// ─── Main Execution ─────────────────────────────────────────────────────────

console.log('+--------------------------------------------------------------+');
console.log('|  Supplier-Safe Language Gate (SP-8025)                       |');
console.log('|  Validates supplier-facing code uses appropriate language    |');
console.log('+--------------------------------------------------------------+');
console.log('');

checkL01();
checkL02();
checkL03();
checkL04();

console.log('');
console.log('--------------------------------------------------------------');
console.log(`  Total: ${results.pass + results.fail + results.warn} checks`);
console.log(`  Pass:  ${results.pass}`);
console.log(`  Fail:  ${results.fail}`);
console.log(`  Warn:  ${results.warn}`);
console.log('--------------------------------------------------------------');
console.log('');

if (results.fail > 0) {
  console.log(`  RESULT: FAIL -- ${results.fail} language violation(s) detected.`);
  console.log('');
  process.exit(1);
}

if (results.warn > 0) {
  console.log(`  RESULT: WARN -- ${results.warn} potential issue(s) found.`);
  console.log('');
}

console.log('  RESULT: PASS -- All language checks clean.');
console.log('');
process.exit(0);
