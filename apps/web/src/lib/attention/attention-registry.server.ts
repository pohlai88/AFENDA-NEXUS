import 'server-only';

import type {
  AttentionItem,
  AttentionSummary,
} from './attention.types';
import { SEVERITY_ORDER } from './attention.types';

// ─── Attention Registry (Server-Only) ────────────────────────────────────────
//
// Error-isolated resolvers — a failing resolver produces a stub, never crashes
// the shell. Same architecture as kpi-registry.server.ts.
//
// ─────────────────────────────────────────────────────────────────────────────

interface RequestContextLike {
  token?: string;
  [key: string]: unknown;
}

export type AttentionResolver = (
  ctx: RequestContextLike,
) => Promise<AttentionItem | null>;

// ─── Resolvers ──────────────────────────────────────────────────────────────
//
// Initial resolvers return stub data. Wire to real DB queries via
// `createApiClient(ctx)` / `withTenant()` when the backends are ready.
//

const ATTENTION_RESOLVERS: Record<string, AttentionResolver> = {
  /**
   * Pending approvals — count of approval_request where status=PENDING.
   */
  pendingApprovals: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 2 as number;
    if (count === 0) return null;
    return {
      id: 'pending-approvals',
      severity: 'warning',
      title: 'Pending Approvals',
      count,
      href: '/finance/approvals',
      reason: `${count} approval request${count > 1 ? 's' : ''} awaiting your review`,
      evidence: { pendingCount: count },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Overdue payables — AP invoices past due date, status=POSTED.
   */
  overduePayables: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 3 as number;
    if (count === 0) return null;
    return {
      id: 'overdue-payables',
      severity: 'critical',
      title: 'Overdue Payables',
      count,
      href: '/finance/payables?filter=overdue',
      reason: `${count} AP invoice${count > 1 ? 's are' : ' is'} past due date`,
      evidence: {
        overdueCount: count,
        oldestDueDate: '2026-01-15',
      },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Overdue receivables — AR invoices past due date, status=POSTED.
   */
  overdueReceivables: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 1 as number;
    if (count === 0) return null;
    return {
      id: 'overdue-receivables',
      severity: 'warning',
      title: 'Overdue Receivables',
      count,
      href: '/finance/receivables?filter=overdue',
      reason: `${count} AR invoice${count > 1 ? 's are' : ' is'} past due date`,
      evidence: {
        overdueCount: count,
        oldestDueDate: '2026-02-10',
      },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Unreconciled bank lines.
   */
  unreconciled: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 5 as number;
    if (count === 0) return null;
    return {
      id: 'unreconciled',
      severity: 'info',
      title: 'Unreconciled Transactions',
      count,
      href: '/finance/banking/reconcile',
      reason: `${count} bank statement line${count > 1 ? 's' : ''} unmatched`,
      evidence: { unmatchedCount: count },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Unclosed periods — fiscal periods past end date that aren't closed.
   */
  unclosedPeriods: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 0;
    if (count === 0) return null;
    return {
      id: 'unclosed-periods',
      severity: 'warning',
      title: 'Unclosed Periods',
      count,
      href: '/finance/periods',
      reason: `${count} fiscal period${count > 1 ? 's have' : ' has'} ended but not closed`,
      evidence: { unclosedCount: count },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Budget breaches — accounts exceeding budget threshold.
   */
  budgetBreaches: async (_ctx) => {
    // TODO: Wire to real DB query
    const count = 0;
    if (count === 0) return null;
    return {
      id: 'budget-breaches',
      severity: 'critical',
      title: 'Budget Breaches',
      count,
      href: '/finance/budgets',
      reason: `${count} account${count > 1 ? 's exceed' : ' exceeds'} budget threshold`,
      evidence: { breachedCount: count },
      lastComputedAt: new Date(),
    };
  },
};

// ─── Resolve All ─────────────────────────────────────────────────────────────

/**
 * Resolve all attention items concurrently.
 * Uses `Promise.allSettled()` — a failing resolver never crashes navigation.
 */
export async function resolveAttentionSummary(
  ctx: RequestContextLike,
): Promise<AttentionSummary> {
  const resolvers = Object.entries(ATTENTION_RESOLVERS);

  const results = await Promise.allSettled(
    resolvers.map(async ([name, resolver]) => {
      try {
        return await resolver(ctx);
      } catch (err) {
        console.error(`[attention] resolver "${name}" failed:`, err);
        return null;
      }
    }),
  );

  const items: AttentionItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      items.push(result.value);
    }
    // Rejected promises are already logged above
  }

  // Sort by severity (critical first)
  items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    total: items.reduce((sum, item) => sum + item.count, 0),
    critical: items.filter((i) => i.severity === 'critical').length,
    warning: items.filter((i) => i.severity === 'warning').length,
    info: items.filter((i) => i.severity === 'info').length,
    items,
  };
}
