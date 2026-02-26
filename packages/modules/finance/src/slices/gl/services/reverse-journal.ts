import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { Journal } from '../entities/journal.js';
import type { IJournalRepo } from '../../../slices/gl/ports/journal-repo.js';
import type { IFiscalPeriodRepo } from '../../../slices/gl/ports/fiscal-period-repo.js';
import type { IGlBalanceRepo } from '../../../slices/gl/ports/gl-balance-repo.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IJournalAuditRepo } from '../../../slices/gl/ports/journal-audit-repo.js';
import type { ISoDActionLogRepo } from '../../../shared/ports/sod-action-log-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ReverseJournalInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly journalId: string;
  readonly idempotencyKey: string;
  readonly reason: string;
  readonly correlationId?: string;
}

export async function reverseJournal(
  input: ReverseJournalInput,
  deps: {
    journalRepo: IJournalRepo;
    periodRepo: IFiscalPeriodRepo;
    balanceRepo: IGlBalanceRepo;
    idempotencyStore: IIdempotencyStore;
    outboxWriter: IOutboxWriter;
    journalAuditRepo: IJournalAuditRepo;
    sodActionLogRepo?: ISoDActionLogRepo;
  },
  ctx?: FinanceContext
): Promise<Result<Journal>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;
  // Atomic idempotency claim
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId,
    key: input.idempotencyKey,
    commandType: 'REVERSE_JOURNAL',
  });
  if (!claim.claimed) {
    return err(
      new AppError('IDEMPOTENCY_CONFLICT', `Request ${input.idempotencyKey} already processed`)
    );
  }

  const found = await deps.journalRepo.findById(input.journalId);
  if (!found.ok) return found;

  const journal = found.value;
  if (journal.status !== 'POSTED') {
    // A-12: Log rejected mutation attempt for audit observability
    await deps.journalAuditRepo.log({
      tenantId,
      journalId: journal.id,
      fromStatus: journal.status as 'DRAFT' | 'REVERSED' | 'VOIDED',
      toStatus: 'REVERSED',
      userId,
      reason: `REJECTED: ${input.reason} (status was ${journal.status}, expected POSTED)`,
      correlationId: input.correlationId,
    });
    return err(
      new AppError('INVALID_STATE', `Journal ${journal.id} is ${journal.status}, expected POSTED`)
    );
  }

  // Resolve period from original journal for the mirror entry
  const periodResult = await deps.periodRepo.findById(journal.fiscalPeriodId);
  if (!periodResult.ok) {
    return err(new AppError('NOT_FOUND', `Fiscal period ${journal.fiscalPeriodId} not found`));
  }
  const period = periodResult.value;

  // A-14: Period must be OPEN to accept a reversal entry
  if (period.status !== 'OPEN') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Cannot reverse into ${period.status} period '${period.name}'. Period must be OPEN.`
      )
    );
  }

  // Create mirror journal with swapped debits/credits
  const reversalResult = await deps.journalRepo.create({
    tenantId,
    ledgerId: journal.ledgerId,
    fiscalPeriodId: journal.fiscalPeriodId,
    journalNumber: `REV-${journal.id.slice(0, 8)}-${Date.now()}`,
    description: `Reversal of ${journal.description}`,
    postingDate: journal.date,
    lines: journal.lines.map((line) => ({
      accountId: line.accountId,
      description: `Reversal: ${line.description ?? ''}`,
      debit: line.credit.amount,
      credit: line.debit.amount,
    })),
  });

  if (!reversalResult.ok) return reversalResult;

  // DEFECT-01 fix: Post the reversal journal so it becomes a posted fact.
  // GL balances must only reflect posted documents.
  const postedReversal: Journal = { ...reversalResult.value, status: 'POSTED' };
  const postReversalResult = await deps.journalRepo.save(postedReversal);
  if (!postReversalResult.ok) return postReversalResult;

  // A-13: Mark original as REVERSED with linkage to reversal journal
  const updated: Journal = { ...journal, status: 'REVERSED', reversedById: postedReversal.id };
  const saveResult = await deps.journalRepo.save(updated);
  if (!saveResult.ok) return saveResult;

  // GL balance UPSERT — negated amounts referencing the posted reversal
  const fiscalYear = period.name.split('-')[0] ?? period.name;
  const fiscalPeriod = parseInt(period.name.split('-P')[1] ?? '0', 10) || 1;

  await deps.balanceRepo.upsertForJournal({
    tenantId,
    ledgerId: String(journal.ledgerId),
    fiscalYear,
    fiscalPeriod,
    lines: journal.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.credit.amount,
      credit: l.debit.amount,
    })),
  });

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.JOURNAL_REVERSED,
    payload: {
      journalId: journal.id,
      reversalId: postedReversal.id,
      ledgerId: journal.ledgerId,
    },
  });

  // GL_BALANCE_CHANGED — notification-only for cache invalidation
  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.GL_BALANCE_CHANGED,
    payload: {
      ledgerId: journal.ledgerId,
      accountIds: journal.lines.map((l) => l.accountId),
      periodId: journal.fiscalPeriodId,
    },
  });

  // Audit trail for the reversal journal itself (DRAFT → POSTED)
  await deps.journalAuditRepo.log({
    tenantId,
    journalId: postedReversal.id,
    fromStatus: 'DRAFT',
    toStatus: 'POSTED',
    userId,
    reason: `Auto-posted reversal of journal ${journal.id}`,
    correlationId: input.correlationId,
  });

  // Audit trail for the original journal (POSTED → REVERSED)
  await deps.journalAuditRepo.log({
    tenantId,
    journalId: journal.id,
    fromStatus: 'POSTED',
    toStatus: 'REVERSED',
    userId,
    reason: input.reason,
    correlationId: input.correlationId,
  });

  // A-08: Record outcome reference for idempotency audit trail
  await deps.idempotencyStore.recordOutcome?.(
    tenantId,
    input.idempotencyKey,
    'REVERSE_JOURNAL',
    postedReversal.id
  );

  await deps.sodActionLogRepo?.logAction({
    tenantId,
    entityType: 'journal',
    entityId: journal.id,
    actorId: userId,
    action: 'journal:reverse',
  });

  return postReversalResult;
}
