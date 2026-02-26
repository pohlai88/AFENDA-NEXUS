import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { DunningRun } from '../entities/dunning.js';
import type { IArInvoiceRepo } from '../ports/ar-invoice-repo.js';
import type { IDunningRepo } from '../ports/dunning-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';
import { computeDunningScores, type DunningInput } from '../calculators/dunning-score.js';

export interface RunDunningInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly runDate: Date;
  readonly correlationId?: string;
}

export async function runDunning(
  input: RunDunningInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    dunningRepo: IDunningRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext
): Promise<Result<DunningRun>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const unpaid = await deps.arInvoiceRepo.findUnpaid();
  const overdue = unpaid.filter((inv) => inv.dueDate < input.runDate);

  if (overdue.length === 0) {
    return err(new AppError('VALIDATION', 'No overdue invoices found for dunning'));
  }

  const dunningInputs: DunningInput[] = overdue.map((inv) => ({
    customerId: inv.customerId,
    invoiceId: inv.id,
    outstandingAmount: inv.totalAmount.amount - inv.paidAmount.amount,
    dueDate: inv.dueDate,
    asOfDate: input.runDate,
    previousDunningLevel: null,
  }));

  const scores = computeDunningScores(dunningInputs);

  // Create dunning run
  const runResult = await deps.dunningRepo.create({
    tenantId,
    runDate: input.runDate,
  });
  if (!runResult.ok) return runResult;

  // Group by customer and create letters
  const byCustomer = new Map<string, (typeof scores)[number][]>();
  for (const score of scores) {
    const existing = byCustomer.get(score.customerId) ?? [];
    existing.push(score);
    byCustomer.set(score.customerId, existing);
  }

  for (const [customerId, customerScores] of byCustomer) {
    const maxLevel = Math.max(...customerScores.map((s) => s.level)) as 1 | 2 | 3 | 4;
    const invoiceIds = customerScores.map((s) => s.invoiceId);
    const totalOverdue = overdue
      .filter((inv) => invoiceIds.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.totalAmount.amount - inv.paidAmount.amount), 0n);

    await deps.dunningRepo.addLetter(runResult.value.id, {
      customerId,
      level: maxLevel,
      invoiceIds,
      totalOverdue,
      currencyCode: overdue[0]!.totalAmount.currency,
    });
  }

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AR_DUNNING_RUN_CREATED,
    payload: {
      dunningRunId: runResult.value.id,
      letterCount: byCustomer.size,
      userId,
      correlationId: input.correlationId,
    },
  });

  return deps.dunningRepo.findById(runResult.value.id);
}
