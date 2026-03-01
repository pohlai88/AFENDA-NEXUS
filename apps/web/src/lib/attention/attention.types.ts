// ─── Attention Types ──────────────────────────────────────────────────────────
//
// Platform-level "Needs Attention" items — explainable, auditable, testable.
// Each item includes a human-readable reason, machine-readable evidence,
// and a timestamp for staleness detection.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Severity levels for attention items. */
export type AttentionSeverity = 'critical' | 'warning' | 'info';

/**
 * A single attention item surfaced in the shell's "Needs Attention" panel.
 *
 * Each item is:
 * - **Explainable**: `reason` is a user-facing sentence.
 * - **Evidenced**: `evidence` carries the query summary or relevant IDs.
 * - **Timestamped**: `lastComputedAt` enables staleness detection.
 */
export interface AttentionItem {
  /** Unique identifier (e.g. "overdue-payables"). */
  id: string;
  /** Feature/module ID for grouping (e.g. 'ap', 'banking', 'tax'). */
  featureId?: string;
  /** Visual severity — drives icon color and sort order. */
  severity: AttentionSeverity;
  /** Short title (e.g. "Overdue Payables"). */
  title: string;
  /** Count of affected entities. */
  count: number;
  /** Deep link to the relevant page. */
  href: string;
  /**
   * User-facing explanation.
   * Example: "3 AP invoices are past due date"
   */
  reason: string;
  /**
   * Machine-readable evidence for auditing / debugging.
   * Example: `{ overdueIds: ['INV-001', 'INV-003'], oldestDueDate: '2026-01-15' }`
   */
  evidence: string | Record<string, unknown>;
  /** When this resolver last computed this item. */
  lastComputedAt: Date;
}

/** Aggregated attention summary for the shell badge + panel. */
export interface AttentionSummary {
  /** Total count across all items. */
  total: number;
  /** Count of critical items. */
  critical: number;
  /** Count of warning items. */
  warning: number;
  /** Count of info items. */
  info: number;
  /** Individual attention items, sorted by severity (critical first). */
  items: AttentionItem[];
}

/** Severity sort order: critical → warning → info. */
export const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};
