import type { CompanyId, TenantId } from "@afenda/core";

export interface IntercompanyRelationship {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly sellerCompanyId: CompanyId;
  readonly buyerCompanyId: CompanyId;
  readonly pricingRule: "COST" | "MARKUP" | "MARKET";
  readonly markupPercent: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface IntercompanyDocument {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly relationshipId: string;
  readonly sourceCompanyId: CompanyId;
  readonly mirrorCompanyId: CompanyId;
  readonly sourceJournalId: string;
  readonly mirrorJournalId: string;
  readonly amount: bigint;
  readonly currency: string;
  readonly status: "PENDING" | "PAIRED" | "RECONCILED";
  readonly createdAt: Date;
}
