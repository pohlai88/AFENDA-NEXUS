/**
 * Shared evidence schema for all audit tools (AIS, SOX, ARCH_GUARD).
 *
 * Every audit script MUST output this shape when invoked with --json.
 * Human-readable text is the default output mode.
 */

// ─── Core Types ──────────────────────────────────────────────────────────────

export type CheckStatus = 'PASS' | 'FAIL' | 'WARN';

export type EvidenceLevel =
  | 'L1' // Structure: files/exports present
  | 'L2' // Static semantics: types/unions/ports present
  | 'L3' // Test evidence: unit/integration test exists and passes
  | 'L4' // DB invariant: constraint/trigger + integration test
  | 'L5'; // Runtime evidence: worker/outbox flow, migration history, sample run logs

export interface EvidenceCheck {
  /** Unique check ID, e.g. "AIS-GL-03", "SOX-AC-01", "E13" */
  readonly id: string;
  /** Human-readable description */
  readonly description: string;
  /** Pass/fail/warn status */
  readonly status: CheckStatus;
  /** Highest evidence level achieved for this check */
  readonly evidenceLevel?: EvidenceLevel;
  /** Confidence score 0-100 (100 = deterministic check, lower = heuristic) */
  readonly confidence: number;
  /** Evidence pointers: file paths, grep hits, test names, query outputs */
  readonly evidence: readonly string[];
}

export interface AuditSummary {
  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly total: number;
  /** Distribution by evidence level (only for tools that track levels) */
  readonly byLevel?: Readonly<Record<EvidenceLevel, number>>;
}

export interface AuditReport {
  /** Tool identifier: "AIS", "SOX", "ARCH_GUARD" */
  readonly toolId: string;
  /** Schema version for forward compatibility */
  readonly schemaVersion: '1.0';
  /** Tool version or commit SHA */
  readonly version: string;
  /** ISO 8601 timestamp */
  readonly timestamp: string;
  /** Aggregate scores */
  readonly summary: AuditSummary;
  /** Individual check results */
  readonly checks: readonly EvidenceCheck[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createReport(
  toolId: string,
  version: string,
  checks: EvidenceCheck[]
): AuditReport {
  const summary: AuditSummary = {
    pass: checks.filter((c) => c.status === 'PASS').length,
    fail: checks.filter((c) => c.status === 'FAIL').length,
    warn: checks.filter((c) => c.status === 'WARN').length,
    total: checks.length,
  };

  const byLevel = checks.reduce(
    (acc, c) => {
      if (c.evidenceLevel) acc[c.evidenceLevel] = (acc[c.evidenceLevel] ?? 0) + 1;
      return acc;
    },
    {} as Record<EvidenceLevel, number>
  );

  if (Object.keys(byLevel).length > 0) {
    (summary as { byLevel?: Record<EvidenceLevel, number> }).byLevel = byLevel;
  }

  return {
    toolId,
    schemaVersion: '1.0',
    version,
    timestamp: new Date().toISOString(),
    summary,
    checks,
  };
}

export function printReport(report: AuditReport): void {
  console.log(`\n  ${report.toolId} Audit (v${report.version})\n`);
  console.log('  %-12s %-45s %-6s %s', 'ID', 'Description', 'Status', 'Evidence Level');
  console.log('  ' + '\u2500'.repeat(80));

  for (const c of report.checks) {
    const icon = c.status === 'PASS' ? '\u2705' : c.status === 'WARN' ? '\u26A0\uFE0F' : '\u274C';
    const level = c.evidenceLevel ?? '';
    console.log('  %-12s %-45s %s %-4s  %s', c.id, c.description, icon, c.status, level);
  }

  const { pass, fail, warn, total } = report.summary;
  console.log('\n  ' + '\u2500'.repeat(80));
  console.log(`  Total: ${pass}/${total} pass, ${fail} fail, ${warn} warn`);

  if (report.summary.byLevel) {
    const levels = Object.entries(report.summary.byLevel)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('  ');
    console.log(`  Evidence levels: ${levels}`);
  }

  console.log();
}
