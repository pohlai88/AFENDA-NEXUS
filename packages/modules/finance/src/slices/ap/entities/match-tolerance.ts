/**
 * W3-8: Tolerance rules per org/company/site.
 *
 * MatchTolerance entity with scope hierarchy.
 * Resolution order: site → company → org (most specific wins).
 */

export type ToleranceScope = 'ORG' | 'COMPANY' | 'SITE';

export interface MatchTolerance {
  readonly id: string;
  readonly tenantId: string;
  readonly scope: ToleranceScope;
  /** For ORG scope: null. For COMPANY: companyId. For SITE: siteId. */
  readonly scopeEntityId: string | null;
  /** Company ID — set for COMPANY and SITE scopes; null for ORG. */
  readonly companyId: string | null;
  /** Tolerance in basis points (100 = 1%). */
  readonly toleranceBps: number;
  /** Optional: match tolerance on quantity (percent). */
  readonly quantityTolerancePercent: number;
  /** Whether to auto-hold invoices over tolerance (vs. warn only). */
  readonly autoHold: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Resolve the most specific active tolerance rule.
 * Priority: SITE > COMPANY > ORG.
 *
 * Pure calculator — no DB access, works on pre-fetched rules.
 */
export function resolveMatchTolerance(
  rules: readonly MatchTolerance[],
  context: {
    readonly companyId?: string;
    readonly siteId?: string;
  }
): MatchTolerance | null {
  const active = rules.filter((r) => r.isActive);
  if (active.length === 0) return null;

  // Try site-level first
  if (context.siteId) {
    const siteRule = active.find((r) => r.scope === 'SITE' && r.scopeEntityId === context.siteId);
    if (siteRule) return siteRule;
  }

  // Try company-level
  if (context.companyId) {
    const companyRule = active.find(
      (r) => r.scope === 'COMPANY' && r.scopeEntityId === context.companyId
    );
    if (companyRule) return companyRule;
  }

  // Fall back to org-level
  const orgRule = active.find((r) => r.scope === 'ORG');
  return orgRule ?? null;
}
