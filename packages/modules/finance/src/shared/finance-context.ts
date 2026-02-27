/**
 * @see FIN-BL-ISO-01 — Tenant isolation enforced on all finance tables via RLS
 * @see GL-01 — Multi-entity chart of accounts with hierarchical structure
 * @see FX-10 — Functional currency determination per entity
 *
 * FinanceContext carries the multi-tenant, multi-company, multi-currency
 * context through every service call. Modeled after AFENDA-NEXUS DomainContext.
 *
 * Every finance service should accept this context to ensure:
 * - Tenant isolation (orgId)
 * - Company-scoped operations (companyId)
 * - Functional currency awareness (currency)
 * - Audit trail (actor)
 * - Point-in-time queries (asOf)
 */
import type { CompanyId } from '@afenda/core';

export interface FinanceActor {
  readonly userId: string;
  readonly roles: readonly string[];
}

export interface FinanceContext {
  readonly tenantId: string;
  readonly companyId: CompanyId;
  readonly currency: string;
  readonly actor: FinanceActor;
  readonly asOf: Date;
}

/**
 * Creates a FinanceContext from the raw request headers/params.
 * This is the single point where context is assembled.
 */
export function createFinanceContext(input: {
  tenantId: string;
  userId: string;
  companyId: string;
  currency?: string;
  roles?: readonly string[];
  asOf?: Date;
}): FinanceContext {
  return {
    tenantId: input.tenantId,
    companyId: input.companyId as CompanyId,
    // G11: Callers MUST pass currency from company.baseCurrency or tenantSettings.defaultCurrency.
    // 'USD' fallback is kept only for backward-compat tests; new code must never rely on it.
    currency: input.currency ?? 'USD',
    actor: {
      userId: input.userId,
      roles: input.roles ?? [],
    },
    asOf: input.asOf ?? new Date(),
  };
}
