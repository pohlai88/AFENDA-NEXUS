import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { Journal } from "../../domain/index.js";
import type { IJournalRepo, CreateJournalInput } from "../ports/journal-repo.js";
import type { IAccountRepo } from "../ports/account-repo.js";
import type { IFiscalPeriodRepo } from "../ports/fiscal-period-repo.js";
import type { IOutboxWriter } from "../ports/outbox-writer.js";
import type { IJournalAuditRepo } from "../ports/journal-audit-repo.js";
import type { IDocumentNumberGenerator } from "../ports/document-number-generator.js";
import type { FinanceContext } from "../../domain/finance-context.js";
import { FinanceEventType } from "../../domain/events.js";

export interface CreateJournalRequest {
  readonly tenantId: string;
  readonly userId: string;
  readonly ledgerId: string;
  readonly description: string;
  readonly postingDate: Date;
  readonly lines: readonly {
    readonly accountCode: string;
    readonly debit: bigint;
    readonly credit: bigint;
    readonly currency: string;
    readonly description?: string;
  }[];
}

export async function createJournal(
  request: CreateJournalRequest,
  deps: {
    journalRepo: IJournalRepo;
    accountRepo: IAccountRepo;
    periodRepo: IFiscalPeriodRepo;
    outboxWriter: IOutboxWriter;
    journalAuditRepo: IJournalAuditRepo;
    documentNumberGenerator: IDocumentNumberGenerator;
  },
  ctx?: FinanceContext,
): Promise<Result<Journal>> {
  const tenantId = ctx?.tenantId ?? request.tenantId;
  const userId = ctx?.actor.userId ?? request.userId;
  if (request.lines.length < 2) {
    return err(new AppError("INSUFFICIENT_LINES", "Journal must have at least 2 lines"));
  }

  // Validate period is OPEN for postingDate
  const periodResult = await deps.periodRepo.findOpenByDate(ctx?.companyId ?? "", request.postingDate);
  if (!periodResult.ok) {
    return err(new AppError("PERIOD_NOT_OPEN", `No open period for date ${request.postingDate.toISOString()}`));
  }

  // Resolve accountCode → accountId for each line
  // A-03: Verify every account belongs to the journal's company (INF-02 company boundary)
  const resolvedLines: CreateJournalInput["lines"][number][] = [];
  const journalCompanyId = ctx?.companyId ?? "";
  for (const line of request.lines) {
    const accountResult = await deps.accountRepo.findByCode(journalCompanyId, line.accountCode);
    if (!accountResult.ok) {
      return err(new AppError("ACCOUNT_NOT_FOUND", `Account code '${line.accountCode}' not found`));
    }
    const account = accountResult.value;
    // A-03: When companyId is known (via FinanceContext), enforce company boundary
    if (journalCompanyId && String(account.companyId) !== journalCompanyId) {
      return err(
        new AppError(
          "COMPANY_MISMATCH",
          `Account '${line.accountCode}' belongs to company ${String(account.companyId)}, expected ${journalCompanyId}. Cross-company lines are not allowed — use intercompany transactions instead.`,
        ),
      );
    }
    resolvedLines.push({
      accountId: account.id,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    });
  }

  // GAP-02: Audit-grade sequential document numbering via controlled generator
  const numResult = await deps.documentNumberGenerator.next(tenantId, "JV");
  if (!numResult.ok) {
    return err(new AppError("INTERNAL", "Failed to generate journal number"));
  }
  const journalNumber = numResult.value;

  const result = await deps.journalRepo.create({
    tenantId,
    ledgerId: request.ledgerId,
    fiscalPeriodId: periodResult.value.id,
    journalNumber,
    description: request.description,
    postingDate: request.postingDate,
    lines: resolvedLines,
  });

  if (result.ok) {
    await deps.outboxWriter.write({
      tenantId,
      eventType: FinanceEventType.JOURNAL_CREATED,
      payload: {
        journalId: result.value.id,
        ledgerId: request.ledgerId,
        companyId: ctx?.companyId,
      },
    });

    await deps.journalAuditRepo.log({
      tenantId,
      journalId: result.value.id,
      fromStatus: null,
      toStatus: "DRAFT",
      userId,
    });
  }

  return result;
}
