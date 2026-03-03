#!/usr/bin/env node
/**
 * sod-gate-check.mjs — Separation of Duties (SoD) Enforcement Gate
 *
 * SP-8020: Validates that critical workflows enforce SoD: proposer ≠ approver.
 *
 * Checks:
 *   S01  Bank account changes require distinct proposer and approver
 *   S02  Approval workflow checks proposer/requester ≠ approver
 *   S03  No self-approval bypass routes in code
 *   S04  Critical financial operations require 4-eyes principle
 *
 * Usage:
 *   node tools/scripts/sod-gate-check.mjs
 *   pnpm sod:check
 *
 * Exit codes: 0 = pass, 1 = failures found
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const PACKAGES_ROOT = join(ROOT, 'packages');
const MODULES_ROOT = join(PACKAGES_ROOT, 'modules');

// ─── Result Accumulator ─────────────────────────────────────────────────────

const results = { pass: [], fail: [], warn: [] };
let totalChecks = 0;

function pass(check, msg) {
  totalChecks++;
  results.pass.push({ check, msg });
  console.log(`  + ${check} ${msg} [PASS]`);
}
function fail(check, msg) {
  totalChecks++;
  results.fail.push({ check, msg });
  console.log(`  ✖ ${check} ${msg} [FAIL]`);
}
function warn(check, msg) {
  totalChecks++;
  results.warn.push({ check, msg });
  console.log(`  ! ${check} ${msg} [WARN]`);
}

function relPath(absPath) {
  return relative(ROOT, absPath).replace(/\\/g, '/');
}

// ─── S01: Bank Account SoD ──────────────────────────────────────────────────
// Validates that bank account propose/approve functions enforce proposer ≠ approver

function checkS01() {
  const bankAccountService = join(
    MODULES_ROOT,
    'finance/src/slices/ap/services/supplier-portal-bank-account.ts'
  );

  if (!existsSync(bankAccountService)) {
    warn('S01', 'Bank account service not found');
    return;
  }

  const content = readFileSync(bankAccountService, 'utf-8');
  const rel = relPath(bankAccountService);

  // Check for propose/approve functions
  const hasProposeFunction = /export\s+(async\s+)?function\s+proposeBankAccount/.test(content);
  const hasApproveFunction = /export\s+(async\s+)?function\s+approveBankAccount/.test(content);

  if (!hasProposeFunction || !hasApproveFunction) {
    fail(
      'S01',
      `${rel} -- Missing propose/approve workflow functions. Required: proposeBankAccount() and approveBankAccount()`
    );
    return;
  }

  // Check for SoD enforcement in approve function
  const approveMatch = content.match(
    /export\s+async\s+function\s+approveBankAccount\s*\([^)]+\)\s*:\s*[^{]+\{([\s\S]+?)(?=\nexport|$)/
  );

  if (!approveMatch) {
    fail('S01', `${rel} -- Cannot parse approveBankAccount() function`);
    return;
  }

  const approveFunctionBody = approveMatch[1];

  // Check for proposer ≠ approver validation
  const hasSoDCheck =
    /proposedBy|requestedBy/.test(approveFunctionBody) &&
    (/proposedBy\s*===\s*approverId|approverId\s*===\s*proposedBy/.test(approveFunctionBody) ||
      /requestedBy\s*===\s*approverId|approverId\s*===\s*requestedBy/.test(approveFunctionBody));

  const hasSoDError =
    /SELF_APPROVAL|SOD_VIOLATION|FORBIDDEN/.test(approveFunctionBody) && hasSoDCheck;

  if (!hasSoDError) {
    fail(
      'S01',
      `${rel} -- approveBankAccount() must enforce proposer ≠ approver with SOD_VIOLATION or SELF_APPROVAL error`
    );
    return;
  }

  pass('S01', 'Bank account workflow enforces SoD (proposer ≠ approver)');
}

// ─── S02: Approval Workflow Service SoD ────────────────────────────────────
// Validates general approval workflow enforces requester ≠ approver

function checkS02() {
  const approvalService = join(
    MODULES_ROOT,
    'finance/src/shared/services/approval-workflow-service.ts'
  );

  if (!existsSync(approvalService)) {
    warn('S02', 'Approval workflow service not found');
    return;
  }

  const content = readFileSync(approvalService, 'utf-8');
  const rel = relPath(approvalService);

  // Check approve method for SoD enforcement
  const approveMatch = content.match(
    /async\s+approve\s*\([^)]+\)\s*:\s*[^{]+\{([\s\S]+?)(?=\n\s+async\s+|$)/
  );

  if (!approveMatch) {
    warn('S02', `${rel} -- Cannot find approve() method`);
    return;
  }

  const approveBody = approveMatch[1];

  // Check if approve method validates approver is in the approval chain (not self-approval)
  const hasApproverValidation =
    /approverId\s*===\s*request\.requestedBy/.test(approveBody) ||
    /request\.requestedBy\s*===\s*approverId/.test(approveBody) ||
    /steps\.find/.test(approveBody);

  if (!hasApproverValidation) {
    fail(
      'S02',
      `${rel} -- approve() method should validate approver is in approval chain, not requester`
    );
    return;
  }

  pass('S02', 'Approval workflow validates approver assignment');
}

// ─── S03: No Self-Approval Bypasses ─────────────────────────────────────────
// Scans for dangerous patterns that could bypass SoD

function checkS03() {
  const serviceDirs = [
    join(MODULES_ROOT, 'finance/src/slices/ap/services'),
    join(MODULES_ROOT, 'finance/src/shared/services'),
  ];

  const violations = [];

  for (const dir of serviceDirs) {
    if (!existsSync(dir)) continue;

    const files = collectFiles(dir, ['.ts']);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const rel = relPath(file);

      // Dangerous patterns
      const patterns = [
        {
          regex: /\/\/\s*@sod-skip|\/\/\s*skip.*sod/i,
          msg: 'SoD skip comment found',
        },
        {
          regex: /autoApprove\s*:\s*true|auto-approve|bypassApproval/i,
          msg: 'Auto-approval bypass pattern detected',
        },
        {
          regex: /if\s*\(\s*process\.env\.NODE_ENV.*test.*\)\s*{\s*\/\/.*skip.*sod/i,
          msg: 'SoD skipped in test environment (should use proper mocks)',
        },
      ];

      for (const { regex, msg } of patterns) {
        if (regex.test(content)) {
          violations.push({ file: rel, msg });
        }
      }
    }
  }

  if (violations.length > 0) {
    for (const { file, msg } of violations) {
      fail('S03', `${file} -- ${msg}`);
    }
    return;
  }

  pass('S03', 'No SoD bypass patterns detected');
}

// ─── S04: Critical Operations Require Approval ─────────────────────────────
// Ensures high-risk operations don't have direct execution paths

function checkS04() {
  const criticalPatterns = [
    {
      file: 'supplier-portal-bank-account.ts',
      operation: 'deleteBankAccount|removeBankAccount',
      requiresApproval: 'should require approval workflow, not direct deletion',
    },
    {
      file: 'supplier-portal-profile.ts',
      operation: 'updateTaxId|changeTaxIdentification',
      requiresApproval: 'tax ID changes should require approval',
    },
  ];

  let hasViolations = false;

  for (const { file, operation, requiresApproval } of criticalPatterns) {
    const filePath = join(MODULES_ROOT, `finance/src/slices/ap/services/${file}`);

    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf-8');
    const rel = relPath(filePath);
    const regex = new RegExp(`export\\s+async\\s+function\\s+(${operation})`, 'i');

    if (regex.test(content)) {
      // Check if function uses approval workflow
      const functionMatch = content.match(
        new RegExp(`export\\s+async\\s+function\\s+${operation}[^{]+\\{([\\s\\S]+?)(?=\\nexport|$)`, 'i')
      );

      if (functionMatch) {
        const functionBody = functionMatch[1];
        const usesApprovalWorkflow =
          /approvalWorkflow/.test(functionBody) || /createApprovalRequest/.test(functionBody);

        if (!usesApprovalWorkflow) {
          fail('S04', `${rel} -- ${requiresApproval}`);
          hasViolations = true;
        }
      }
    }
  }

  if (!hasViolations) {
    pass('S04', 'Critical operations properly gated');
  }
}

// ─── File Helpers ───────────────────────────────────────────────────────────

function collectFiles(dir, extensions = ['.ts', '.tsx'], collected = []) {
  if (!existsSync(dir)) return collected;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.turbo', '__tests__'].includes(entry.name)) continue;
      collectFiles(full, extensions, collected);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      collected.push(full);
    }
  }
  return collected;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('+--------------------------------------------------------------+');
  console.log('|  SoD Enforcement Gate (SP-8020)                               |');
  console.log('|  Validates Separation of Duties in approval workflows        |');
  console.log('+--------------------------------------------------------------+\n');

  checkS01();
  checkS02();
  checkS03();
 checkS04();

  console.log('\n' + '-'.repeat(62));
  console.log(`  Total: ${totalChecks} checks`);
  console.log(`  Pass:  ${results.pass.length}`);
  console.log(`  Fail:  ${results.fail.length}`);
  console.log(`  Warn:  ${results.warn.length}`);
  console.log('-'.repeat(62));

  if (results.fail.length > 0) {
    console.log(`\n  RESULT: FAIL -- ${results.fail.length} SoD violation(s) detected.\n`);
    process.exit(1);
  } else if (results.warn.length > 0) {
    console.log(`\n  RESULT: PASS (with ${results.warn.length} warning(s))\n`);
  } else {
    console.log(`\n  RESULT: PASS -- All SoD checks clean.\n`);
  }

  process.exit(0);
}

main();

