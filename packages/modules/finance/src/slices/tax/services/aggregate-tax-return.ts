/**
 * TX-04: Tax return aggregation by period.
 * Aggregates tax entries for a jurisdiction and period, creates a tax return record.
 */

import type { Result } from '@afenda/core';
import type { TaxReturnPeriod } from '../entities/tax-return.js';
import type { ITaxReturnRepo } from '../ports/tax-return-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import { computeVatNetting, type TaxEntry } from '../calculators/vat-netting.js';

export interface AggregateTaxReturnInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly taxType: string;
  readonly jurisdictionCode: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly entries: readonly TaxEntry[];
  readonly currencyCode: string;
}

export async function aggregateTaxReturn(
  input: AggregateTaxReturnInput,
  deps: { taxReturnRepo: ITaxReturnRepo; outboxWriter: IOutboxWriter }
): Promise<Result<TaxReturnPeriod>> {
  const netting = computeVatNetting(input.entries, input.periodStart, input.periodEnd);

  const jurisdictionResult = netting.jurisdictions.find(
    (j) => j.jurisdictionCode === input.jurisdictionCode
  );

  const outputTax = jurisdictionResult?.outputTax ?? 0n;
  const inputTax = jurisdictionResult?.inputTax ?? 0n;
  const netPayable = outputTax - inputTax;

  const taxReturn = await deps.taxReturnRepo.create(input.tenantId, {
    taxType: input.taxType,
    jurisdictionCode: input.jurisdictionCode,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    outputTax,
    inputTax,
    netPayable,
    currencyCode: input.currencyCode,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.TAX_RETURN_CALCULATED,
    payload: {
      taxReturnId: taxReturn.id,
      jurisdictionCode: input.jurisdictionCode,
      userId: input.userId,
    },
  });

  return { ok: true, value: taxReturn };
}
