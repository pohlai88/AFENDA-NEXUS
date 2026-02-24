import type { Result } from "@afenda/core";
import { ok } from "@afenda/core";
import type { Journal } from "../entities/journal.js";
import type { RecurringTemplate } from "../../../shared/ports/recurring-template-port.js";
import type { IRecurringTemplateRepo } from "../../../shared/ports/recurring-template-port.js";
import type { IJournalRepo, CreateJournalInput } from "../../../slices/gl/ports/journal-repo.js";
import type { IAccountRepo } from "../../../slices/gl/ports/account-repo.js";
import type { IFiscalPeriodRepo } from "../../../slices/gl/ports/fiscal-period-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { IJournalAuditRepo } from "../../../slices/gl/ports/journal-audit-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface ProcessRecurringInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly asOfDate: Date;
}

export interface ProcessRecurringResult {
  readonly processed: number;
  readonly failed: number;
  readonly journals: readonly Journal[];
}

function advanceDate(
  from: Date,
  frequency: RecurringTemplate["frequency"],
): Date {
  const next = new Date(from);
  switch (frequency) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function processRecurringJournals(
  input: ProcessRecurringInput,
  deps: {
    recurringTemplateRepo: IRecurringTemplateRepo;
    journalRepo: IJournalRepo;
    accountRepo: IAccountRepo;
    periodRepo: IFiscalPeriodRepo;
    outboxWriter: IOutboxWriter;
    journalAuditRepo: IJournalAuditRepo;
  },
  ctx?: FinanceContext,
): Promise<Result<ProcessRecurringResult>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;
  const templates = await deps.recurringTemplateRepo.findDue(input.asOfDate);

  if (templates.length === 0) {
    return ok({ processed: 0, failed: 0, journals: [] });
  }

  const journals: Journal[] = [];
  let failed = 0;

  for (const template of templates) {
    try {
      // Resolve accountCode → accountId for each template line
      const resolvedLines: CreateJournalInput["lines"][number][] = [];
      let resolutionFailed = false;

      for (const line of template.lines) {
        const accountResult = await deps.accountRepo.findByCode(ctx?.companyId ?? "", line.accountCode);
        if (!accountResult.ok) {
          resolutionFailed = true;
          break;
        }
        resolvedLines.push({
          accountId: accountResult.value.id,
          description: line.description,
          debit: line.debit.amount,
          credit: line.credit.amount,
        });
      }

      if (resolutionFailed) {
        failed++;
        continue;
      }

      // Find open period for the template's nextRunDate
      const periodResult = await deps.periodRepo.findOpenByDate(ctx?.companyId ?? "", template.nextRunDate);
      if (!periodResult.ok) {
        failed++;
        continue;
      }

      const journalNumber = `RJ-${template.id.slice(0, 8)}-${Date.now()}`;

      const journalResult = await deps.journalRepo.create({
        tenantId,
        ledgerId: template.ledgerId as string,
        fiscalPeriodId: periodResult.value.id,
        journalNumber,
        description: `[Recurring] ${template.description}`,
        postingDate: template.nextRunDate,
        lines: resolvedLines,
      });

      if (!journalResult.ok) {
        failed++;
        continue;
      }

      // Audit + outbox
      await deps.journalAuditRepo.log({
        tenantId,
        journalId: journalResult.value.id,
        fromStatus: null,
        toStatus: "DRAFT",
        userId,
      });

      await deps.outboxWriter.write({
        tenantId,
        eventType: FinanceEventType.RECURRING_JOURNAL_CREATED,
        payload: {
          journalId: journalResult.value.id,
          templateId: template.id,
        },
      });

      // Advance next run date
      const nextRunDate = advanceDate(template.nextRunDate, template.frequency);
      await deps.recurringTemplateRepo.updateNextRunDate(template.id, nextRunDate);

      journals.push(journalResult.value);
    } catch {
      failed++;
    }
  }

  return ok({ processed: journals.length, failed, journals });
}
