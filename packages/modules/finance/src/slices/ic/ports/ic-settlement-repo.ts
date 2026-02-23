import type { Result } from "@afenda/core";
import type { IcSettlement } from "../../ic/entities/ic-settlement.js";

export interface CreateIcSettlementInput {
  readonly tenantId: string;
  readonly sellerCompanyId: string;
  readonly buyerCompanyId: string;
  readonly documentIds: readonly string[];
  readonly settlementMethod: "NETTING" | "CASH" | "JOURNAL";
  readonly settlementAmount: bigint;
  readonly currency: string;
  readonly fxGainLoss: bigint;
  readonly settledBy: string;
  readonly reason?: string;
}

export interface IIcSettlementRepo {
  create(input: CreateIcSettlementInput): Promise<Result<IcSettlement>>;
  findById(id: string): Promise<Result<IcSettlement>>;
  confirm(id: string): Promise<Result<IcSettlement>>;
  cancel(id: string, reason: string): Promise<Result<IcSettlement>>;
}
