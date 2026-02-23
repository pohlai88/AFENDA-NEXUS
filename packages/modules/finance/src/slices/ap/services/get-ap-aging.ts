import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { IApInvoiceRepo } from "../ports/ap-invoice-repo.js";
import { computeApAging, type AgingReport } from "../calculators/ap-aging.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export interface GetApAgingInput {
  readonly tenantId: string;
  readonly asOfDate?: Date;
}

export async function getApAging(
  input: GetApAgingInput,
  deps: { apInvoiceRepo: IApInvoiceRepo },
  _ctx?: FinanceContext,
): Promise<Result<AgingReport>> {
  const asOfDate = input.asOfDate ?? new Date();
  const invoices = await deps.apInvoiceRepo.findUnpaid();
  const report = computeApAging(invoices, asOfDate);
  return ok(report);
}
