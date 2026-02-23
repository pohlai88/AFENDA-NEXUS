import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { FiscalPeriod } from "../entities/fiscal-period.js";
import type { IJournalRepo } from "../../../slices/gl/ports/journal-repo.js";
import type { IFiscalPeriodRepo } from "../../../slices/gl/ports/fiscal-period-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { IPeriodAuditRepo } from "../../../slices/gl/ports/period-audit-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";

export async function closePeriod(
  input: { tenantId: string; periodId: string; userId: string; reason?: string; correlationId?: string },
  deps: {
    periodRepo: IFiscalPeriodRepo;
    journalRepo: IJournalRepo;
    outboxWriter: IOutboxWriter;
    periodAuditRepo?: IPeriodAuditRepo;
  },
  ctx?: FinanceContext,
): Promise<Result<FiscalPeriod>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const periodResult = await deps.periodRepo.findById(input.periodId);
  if (!periodResult.ok) return periodResult;

  const period = periodResult.value;
  if (period.status !== "OPEN") {
    return err(new AppError("INVALID_STATE", `Period ${period.id} is ${period.status}, expected OPEN`));
  }

  // Ensure no DRAFT journals remain in this period
  const draftsResult = await deps.journalRepo.findByPeriod(input.periodId, "DRAFT", { page: 1, limit: 1 });
  if (!draftsResult.ok) return err(new AppError("VALIDATION", "Failed to check draft journals"));
  if (draftsResult.value.total > 0) {
    return err(
      new AppError(
        "VALIDATION",
        `Cannot close period — ${draftsResult.value.total} DRAFT journal(s) remain. Post or void them first.`,
      ),
    );
  }

  const closeResult = await deps.periodRepo.close(input.periodId);
  if (!closeResult.ok) return closeResult;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.PERIOD_CLOSED,
    payload: { periodId: input.periodId, userId: input.userId, reason: input.reason },
  });

  // A-07: Period audit trail
  await deps.periodAuditRepo?.log({
    tenantId,
    periodId: input.periodId,
    fromStatus: "OPEN",
    toStatus: "CLOSED",
    userId: input.userId,
    reason: input.reason,
    correlationId: input.correlationId,
  });

  return closeResult;
}
