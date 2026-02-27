#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// Parallel Gate Runner
// ──────────────────────────────────────────────────────────────────────────────
// Executes all independent CI gate scripts concurrently for ~5-10x speedup
// over the previous sequential approach.
//
// Usage:
//   node tools/scripts/run-gates-parallel.mjs                    # all gates
//   node tools/scripts/run-gates-parallel.mjs --group arch       # architecture & drift
//   node tools/scripts/run-gates-parallel.mjs --group module     # module boundary gates
//   node tools/scripts/run-gates-parallel.mjs --group domain     # domain invariant gates
//   node tools/scripts/run-gates-parallel.mjs --group compliance # audit & security gates
//   node tools/scripts/run-gates-parallel.mjs --concurrency 4    # limit parallelism
//
// Environment:
//   CI=true        → enables GitHub Actions error annotations
//   GITHUB_STEP_SUMMARY → writes markdown summary table
// ──────────────────────────────────────────────────────────────────────────────

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { appendFileSync, existsSync } from 'node:fs';

const ROOT = resolve(import.meta.dirname, '../..');

// ── Gate Definitions ────────────────────────────────────────────────────────
// Each gate is a self-contained script that exits 0 (pass) or non-zero (fail).
// All gates are side-effect-free (read-only file scanning) and safe to run
// concurrently.

/** @typedef {{ id: string; name: string; cmd: string[]; group: string }} Gate */

/** @type {Gate[]} */
const GATES = [
  // ── Architecture & Drift (group: arch) ──────────────────────────────────
  {
    id: 'arch-guard',
    name: 'Architecture guard (E1–E16)',
    cmd: ['node', 'tools/drift-check/src/arch-guard.mjs'],
    group: 'arch',
  },
  {
    id: 'drift',
    name: 'Monorepo drift check',
    cmd: ['node', 'tools/drift-check/src/index.mjs'],
    group: 'arch',
  },
  {
    id: 'agents-drift',
    name: 'Agent drift check',
    cmd: ['node', '.agents/tools/agents-drift.mjs'],
    group: 'arch',
  },
  {
    id: 'web-drift',
    name: 'Web drift check (W01–W16)',
    cmd: ['node', 'tools/scripts/web-drift-check.mjs'],
    group: 'arch',
  },
  {
    id: 'unused-exports',
    name: 'Unused exports gate',
    cmd: ['node', 'tools/drift-check/src/unused-exports.mjs'],
    group: 'arch',
  },

  // ── Compliance (group: compliance) ──────────────────────────────────────
  {
    id: 'neon-sync',
    name: 'Neon integration sync',
    cmd: ['node', 'tools/scripts/neon-integration-sync.mjs'],
    group: 'compliance',
  },
  {
    id: 'audit-ais',
    name: 'AIS benchmark audit',
    cmd: ['node', 'tools/scripts/audit-ais.mjs'],
    group: 'compliance',
  },
  {
    id: 'audit-sox',
    name: 'SOX ITGC audit (strict)',
    cmd: ['node', 'tools/scripts/audit-sox.mjs', '--fail'],
    group: 'compliance',
  },
  {
    id: 'check-test-dir',
    name: 'Test directory convention',
    cmd: ['node', 'tools/scripts/check-test-directory.mjs', '--fail'],
    group: 'compliance',
  },
  {
    id: 'dep-audit',
    name: 'Dependency audit (high+crit)',
    cmd: ['pnpm', 'audit', '--audit-level=high'],
    group: 'compliance',
  },
  {
    id: 'api-smoke-ci',
    name: 'API smoke CI (SMOKE-01–04)',
    cmd: ['node', 'tools/scripts/gate-api-smoke-ci.mjs'],
    group: 'compliance',
  },

  // ── Module Boundary Gates (group: module) ───────────────────────────────
  {
    id: 'identity-sot',
    name: 'Identity SoT gate',
    cmd: ['node', 'tools/scripts/gate-identity-sot.mjs'],
    group: 'module',
  },
  {
    id: 'api-module',
    name: 'API module gate',
    cmd: ['node', 'tools/scripts/gate-api-module.mjs'],
    group: 'module',
  },
  {
    id: 'worker-module',
    name: 'Worker module gate',
    cmd: ['node', 'tools/scripts/gate-worker-module.mjs'],
    group: 'module',
  },
  {
    id: 'web-module',
    name: 'Web module gate',
    cmd: ['node', 'tools/scripts/gate-web-module.mjs'],
    group: 'module',
  },
  {
    id: 'db-module',
    name: 'DB module gate',
    cmd: ['node', 'tools/scripts/gate-db-module.mjs'],
    group: 'module',
  },
  {
    id: 'schema-conventions',
    name: 'Schema conventions (SC-01–08)',
    cmd: ['node', 'tools/scripts/gate-schema-conventions.mjs'],
    group: 'module',
  },
  {
    id: 'openapi-drift',
    name: 'OpenAPI drift gate',
    cmd: ['node', 'tools/scripts/gate-openapi-drift.mjs'],
    group: 'module',
  },
  {
    id: 'contract-response-drift',
    name: 'Contract response drift (CRD-01–02)',
    cmd: ['node', 'tools/scripts/gate-contract-response-drift.mjs'],
    group: 'module',
  },
  {
    id: 'response-type-sot',
    name: 'Response type SoT (RST-01–03)',
    cmd: ['node', 'tools/scripts/gate-response-type-sot.mjs'],
    group: 'module',
  },
  {
    id: 'contract-completeness',
    name: 'Contract completeness (CC-01–03)',
    cmd: ['node', 'tools/scripts/gate-contract-completeness.mjs'],
    group: 'module',
  },
  {
    id: 'schema-entity-alignment',
    name: 'Schema↔entity alignment (SEA-01–02)',
    cmd: ['node', 'tools/scripts/gate-schema-entity-alignment.mjs'],
    group: 'module',
  },

  // ── Domain Invariants (group: domain) ───────────────────────────────────
  {
    id: 'frontend-quality',
    name: 'Frontend quality (FE-01–05)',
    cmd: ['node', 'tools/scripts/gate-frontend-quality.mjs'],
    group: 'domain',
  },
  {
    id: 'money-safety',
    name: 'Money safety gate',
    cmd: ['node', 'tools/scripts/gate-money-safety.mjs'],
    group: 'domain',
  },
  {
    id: 'currency-safety',
    name: 'Currency safety gate',
    cmd: ['node', 'tools/scripts/gate-currency-safety.mjs'],
    group: 'domain',
  },
  {
    id: 'kernel-invariants',
    name: 'Kernel invariants (G-KRN-01–05)',
    cmd: ['node', 'tools/scripts/gate-kernel-invariants.mjs'],
    group: 'domain',
  },
  {
    id: 'status-types',
    name: 'Status types gate',
    cmd: ['node', 'tools/scripts/gate-status-types.mjs'],
    group: 'domain',
  },
  {
    id: 'loading-skeleton',
    name: 'Loading skeleton (LS-01–05)',
    cmd: ['node', 'tools/scripts/gate-loading-skeleton.mjs'],
    group: 'domain',
  },
  {
    id: 'icon-integrity',
    name: 'Icon integrity (ICON-01–05)',
    cmd: ['node', 'tools/scripts/gate-icon-integrity.mjs'],
    group: 'domain',
  },
  {
    id: 'kpi-stub-tracker',
    name: 'KPI stub tracker (KPI-STUB-01–03)',
    cmd: ['node', 'tools/scripts/gate-kpi-stub-tracker.mjs'],
    group: 'domain',
  },
  {
    id: 'e2e-coverage-map',
    name: 'E2E coverage map (E2E-MAP-01–03)',
    cmd: ['node', 'tools/scripts/gate-e2e-coverage-map.mjs'],
    group: 'domain',
  },
];

// ── CLI Parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VALID_GROUPS = ['arch', 'compliance', 'module', 'domain'];
const isCI = !!process.env.CI;

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const selectedGroup = getFlag('--group');
const concurrencyLimit = Number(getFlag('--concurrency')) || 0; // 0 = unlimited

if (selectedGroup && !VALID_GROUPS.includes(selectedGroup)) {
  console.error(
    `\n  ❌ Invalid group: "${selectedGroup}"\n  Valid groups: ${VALID_GROUPS.join(', ')}\n`,
  );
  process.exit(1);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Parallel Gate Runner — Execute CI gates concurrently

  Usage:
    node tools/scripts/run-gates-parallel.mjs [options]

  Options:
    --group <name>       Run only gates in this group (${VALID_GROUPS.join(', ')})
    --concurrency <n>    Limit concurrent gates (default: unlimited)
    --help, -h           Show this help

  Groups:
    arch        Architecture & drift checks (5 gates)
    compliance  Audit, security & convention checks (6 gates)
    module      Module boundary enforcement (10 gates)
    domain      Domain invariant enforcement (9 gates)

  Total: ${GATES.length} gates
  `);
  process.exit(0);
}

const gates = selectedGroup ? GATES.filter((g) => g.group === selectedGroup) : GATES;

// ── Gate Execution ──────────────────────────────────────────────────────────

/**
 * Run a single gate as a child process and capture all output.
 * @param {Gate} gate
 * @returns {Promise<{ gate: Gate; ok: boolean; duration: number; output: string }>}
 */
function runGate(gate) {
  return new Promise((res) => {
    const start = performance.now();
    const [cmd, ...cmdArgs] = gate.cmd;
    const child = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: process.platform === 'win32', // required for pnpm on Windows
    });

    let output = '';
    child.stdout.on('data', (d) => {
      output += d;
    });
    child.stderr.on('data', (d) => {
      output += d;
    });

    child.on('close', (code) => {
      res({ gate, ok: code === 0, duration: performance.now() - start, output: output.trim() });
    });

    child.on('error', (err) => {
      res({
        gate,
        ok: false,
        duration: performance.now() - start,
        output: `spawn error: ${err.message}`,
      });
    });
  });
}

/**
 * Run gates with optional concurrency limit.
 * @param {Gate[]} gates
 * @param {number} limit — 0 = no limit (all concurrent)
 */
async function runGatesWithLimit(gates, limit) {
  if (!limit || limit >= gates.length) {
    return Promise.all(gates.map(runGate));
  }

  /** @type {Awaited<ReturnType<typeof runGate>>[]} */
  const results = [];
  const queue = [...gates];

  async function worker() {
    while (queue.length > 0) {
      const gate = queue.shift();
      if (gate) results.push(await runGate(gate));
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format milliseconds to a human-readable duration.
 * @param {number} ms
 */
function fmt(ms) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Pad or truncate a string to a fixed width.
 * @param {string} str
 * @param {number} len
 */
function pad(str, len) {
  return str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const totalStart = performance.now();
  const label = selectedGroup ? `group: ${selectedGroup}` : 'all groups';
  const concLabel = concurrencyLimit ? `, max ${concurrencyLimit} concurrent` : '';

  console.log();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Parallel Gate Runner                                        ║`);
  console.log(
    `║  ${pad(`${gates.length} gates (${label}${concLabel})`, 58)}║`,
  );
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  // ── Execute ───────────────────────────────────────────────────────────
  const results = await runGatesWithLimit(gates, concurrencyLimit);

  // Sort by duration (fastest first) for readability
  results.sort((a, b) => a.duration - b.duration);

  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const totalDuration = performance.now() - totalStart;

  // ── Results Table ─────────────────────────────────────────────────────
  console.log('── Results ───────────────────────────────────────────────────');
  console.log();

  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    const name = pad(r.gate.name, 44);
    const group = pad(`[${r.gate.group}]`, 14);
    const time = fmt(r.duration).padStart(8);
    console.log(`  ${icon} ${name} ${group} ${time}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log();
  console.log('── Summary ───────────────────────────────────────────────────');
  console.log(
    `  Total: ${results.length} gates | ✅ ${passed.length} passed | ❌ ${failed.length} failed | ⏱  ${fmt(totalDuration)}`,
  );
  console.log();

  // ── Failure Details ───────────────────────────────────────────────────
  if (failed.length > 0) {
    console.log('── Failure Details ───────────────────────────────────────────');
    console.log();

    for (const r of failed) {
      console.log(`  ╭─ ${r.gate.name} (${r.gate.id}) [${r.gate.group}]`);

      // Show last 30 lines of output to keep CI logs manageable
      const lines = r.output.split('\n').slice(-30);
      for (const line of lines) {
        console.log(`  │ ${line}`);
      }
      console.log('  ╰───────────────────────────────────────────────────────────');
      console.log();

      // GitHub Actions error annotations
      if (isCI) {
        const title = `${r.gate.name} failed`;
        const msg = r.output.split('\n').slice(-5).join('%0A');
        console.log(`::error title=${title}::${msg}`);
      }
    }
  }

  // ── GitHub Actions Job Summary ────────────────────────────────────────
  if (isCI && process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      '## 🛡️ Gate Results',
      '',
      '| Status | Gate | Group | Duration |',
      '|:------:|------|-------|----------|',
      ...results.map((r) => {
        const icon = r.ok ? '✅' : '❌';
        return `| ${icon} | ${r.gate.name} | \`${r.gate.group}\` | ${fmt(r.duration)} |`;
      }),
      '',
      `> **Total:** ${results.length} gates — ✅ ${passed.length} passed, ❌ ${failed.length} failed — ⏱ ${fmt(totalDuration)}`,
      '',
    ];

    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
    } catch {
      // Non-fatal: summary file may not be writable in all environments
    }
  }

  // ── Exit ──────────────────────────────────────────────────────────────
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Gate runner crashed:', err);
  process.exit(2);
});
