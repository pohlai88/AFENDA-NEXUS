import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { FiscalPeriod } from '../entities/fiscal-period.js';
import type { IFiscalPeriodRepo } from '../../../slices/gl/ports/fiscal-period-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IPeriodAuditRepo } from '../../../slices/gl/ports/period-audit-repo.js';
import type { ISoDActionLogRepo } from '../../../shared/ports/sod-action-log-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export async function reopenPeriod(
  input: {
    tenantId: string;
    periodId: string;
    userId: string;
    reason?: string;
    correlationId?: string;
  },
  deps: {
    periodRepo: IFiscalPeriodRepo;
    outboxWriter: IOutboxWriter;
    periodAuditRepo?: IPeriodAuditRepo;
    sodActionLogRepo?: ISoDActionLogRepo;
  },
  ctx?: FinanceContext
): Promise<Result<FiscalPeriod>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const periodResult = await deps.periodRepo.findById(input.periodId);
  if (!periodResult.ok) return periodResult;

  const period = periodResult.value;
  if (period.status === 'LOCKED') {
    return err(
      new AppError('INVALID_STATE', `Period ${period.id} is LOCKED and cannot be reopened`)
    );
  }
  if (period.status !== 'CLOSED') {
    return err(
      new AppError('INVALID_STATE', `Period ${period.id} is ${period.status}, expected CLOSED`)
    );
  }

  const reopenResult = await deps.periodRepo.reopen(input.periodId);
  if (!reopenResult.ok) return reopenResult;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.PERIOD_REOPENED,
    payload: { periodId: input.periodId, userId: input.userId, reason: input.reason },
  });

  // A-07: Period audit trail
  await deps.periodAuditRepo?.log({
    tenantId,
    periodId: input.periodId,
    fromStatus: 'CLOSED',
    toStatus: 'OPEN',
    userId: input.userId,
    reason: input.reason,
    correlationId: input.correlationId,
  });

  await deps.sodActionLogRepo?.logAction({
    tenantId,
    entityType: 'fiscalPeriod',
    entityId: input.periodId,
    actorId: input.userId,
    action: 'period:reopen',
  });

  return reopenResult;
}
