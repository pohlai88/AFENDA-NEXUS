import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { IArInvoiceRepo } from "../ports/ar-invoice-repo.js";
import { computeArAging, type ArAgingReport } from "../calculators/ar-aging.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export interface GetArAgingInput {
  readonly tenantId: string;
  readonly asOfDate?: Date;
}

export async function getArAging(
  input: GetArAgingInput,
  deps: { arInvoiceRepo: IArInvoiceRepo },
  _ctx?: FinanceContext,
): Promise<Result<ArAgingReport>> {
  const asOfDate = input.asOfDate ?? new Date();
  const invoices = await deps.arInvoiceRepo.findUnpaid();
  const report = computeArAging(invoices, asOfDate);
  return ok(report);
}
