import type { TenantId, CompanyId } from "@afenda/core";

/**
 * @see IC-04 — Settlement tracking
 * @see AIS A-22 — IC settlement service
 *
 * Represents a settlement event that reconciles one or more IC documents.
 * A settlement transitions paired IC documents to RECONCILED status,
 * recording the settlement method, amount, and any FX gain/loss.
 */

export type SettlementMethod = "NETTING" | "CASH" | "JOURNAL";
export type SettlementStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface IcSettlement {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly sellerCompanyId: CompanyId;
  readonly buyerCompanyId: CompanyId;
  readonly documentIds: readonly string[];
  readonly settlementMethod: SettlementMethod;
  readonly settlementAmount: bigint;
  readonly currency: string;
  readonly fxGainLoss: bigint;
  readonly status: SettlementStatus;
  readonly settledBy: string;
  readonly settledAt: Date;
  readonly reason?: string;
}
