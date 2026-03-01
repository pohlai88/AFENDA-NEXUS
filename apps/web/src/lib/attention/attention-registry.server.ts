import 'server-only';

import type {
  AttentionItem,
  AttentionSummary,
} from './attention.types';
import { SEVERITY_ORDER } from './attention.types';
import { routes } from '@/lib/constants';
import { getPendingApprovalCount } from '@/features/finance/approvals/queries/approvals.queries';

// ─── Attention Registry (Server-Only) ────────────────────────────────────────
//
// Error-isolated resolvers — a failing resolver produces null (empty stack).
// No hardcoded mock data. Wire to real APIs when available.
//
// ─────────────────────────────────────────────────────────────────────────────

interface RequestContextLike {
  tenantId: string;
  userId: string;
  token: string;
  [key: string]: unknown;
}

export type AttentionResolver = (
  ctx: RequestContextLike,
) => Promise<AttentionItem | null>;

// ─── Resolvers ──────────────────────────────────────────────────────────────
//
// All resolvers use real API or return null (empty stack).
// No hardcoded counts or mock data.
//

const ATTENTION_RESOLVERS: Record<string, AttentionResolver> = {
  /**
   * Pending approvals — count from /approvals/pending API.
   */
  pendingApprovals: async (ctx) => {
    const result = await getPendingApprovalCount(ctx);
    if (!result.ok) return null;
    const count = result.data;
    if (count === 0) return null;
    return {
      id: 'pending-approvals',
      severity: 'warning',
      title: 'Pending Approvals',
      count,
      href: routes.finance.approvals,
      reason: `${count} approval request${count > 1 ? 's' : ''} awaiting your review`,
      evidence: { pendingCount: count },
      lastComputedAt: new Date(),
    };
  },

  /**
   * Overdue payables — AP invoices past due date.
   * Returns null until real count API is available (empty stack).
   */
  overduePayables: async () => null,

  /**
   * Overdue receivables — AR invoices past due date.
   * Returns null until real count API is available (empty stack).
   */
  overdueReceivables: async () => null,

  /**
   * Unreconciled bank lines.
   * Returns null until real count API is available (empty stack).
   */
  unreconciled: async () => null,

  /**
   * Unclosed periods — fiscal periods past end date that aren't closed.
   */
  unclosedPeriods: async () => null,

  /**
   * Budget breaches — accounts exceeding budget threshold.
   */
  budgetBreaches: async () => null,
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
