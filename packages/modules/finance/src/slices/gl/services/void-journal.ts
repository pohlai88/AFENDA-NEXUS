import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { Journal } from '../entities/journal.js';
import type { IJournalRepo } from '../../../slices/gl/ports/journal-repo.js';
import type { IJournalAuditRepo } from '../../../slices/gl/ports/journal-audit-repo.js';
import type { ISoDActionLogRepo } from '../../../shared/ports/sod-action-log-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export async function voidJournal(
  input: {
    tenantId: string;
    journalId: string;
    userId: string;
    reason: string;
    correlationId?: string;
  },
  deps: {
    journalRepo: IJournalRepo;
    journalAuditRepo: IJournalAuditRepo;
    sodActionLogRepo?: ISoDActionLogRepo;
  },
  ctx?: FinanceContext
): Promise<Result<Journal>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;
  const found = await deps.journalRepo.findById(input.journalId);
  if (!found.ok) return found;

  const journal = found.value;
  if (journal.status !== 'DRAFT') {
    // A-12: Log rejected mutation attempt for audit observability
    await deps.journalAuditRepo.log({
      tenantId,
      journalId: journal.id,
      fromStatus: journal.status as 'POSTED' | 'REVERSED' | 'VOIDED',
      toStatus: 'VOIDED',
      userId,
      reason: `REJECTED: ${input.reason} (status was ${journal.status}, expected DRAFT)`,
      correlationId: input.correlationId,
    });
    return err(
      new AppError(
        'INVALID_STATE',
        `Cannot void journal ${journal.id} — status is ${journal.status}, expected DRAFT. POSTED journals must be reversed.`
      )
    );
  }

  const voided: Journal = { ...journal, status: 'VOIDED' };
  const result = await deps.journalRepo.save(voided);

  if (result.ok) {
    await deps.journalAuditRepo.log({
      tenantId,
      journalId: journal.id,
      fromStatus: 'DRAFT',
      toStatus: 'VOIDED',
      userId,
      reason: input.reason,
      correlationId: input.correlationId,
    });

    await deps.sodActionLogRepo?.logAction({
      tenantId,
      entityType: 'journal',
      entityId: journal.id,
      actorId: userId,
      action: 'journal:void',
    });
  }

  return result;
}
