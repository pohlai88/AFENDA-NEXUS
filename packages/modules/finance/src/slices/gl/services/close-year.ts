/**
 * @see FC-01 — Financial close task dependency resolution
 * @see FC-02 — Close evidence validation
 * @see FC-03 — Multi-company close sequencing
 * @see FC-04 — Year-end closing journal (zero P&L to retained earnings)
 *
 * Year-end close service — orchestrates the full fiscal year close:
 * 1. Validates all periods in the year are CLOSED
 * 2. Checks no DRAFT journals remain
 * 3. Generates evidence pack (trial balance snapshot, P&L summary)
 * 4. Creates closing journal (zero out Revenue/Expense → Retained Earnings)
 * 5. Locks all periods in the year
 * 6. Emits YEAR_CLOSED outbox event
 */
import type { Result } from "@afenda/core";
import { ok, err, AppError } from "@afenda/core";
import type { FiscalPeriod } from "../entities/fiscal-period.js";
import type { Journal } from "../entities/journal.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";
import type { IJournalRepo, CreateJournalInput } from "../../../slices/gl/ports/journal-repo.js";
import type { IFiscalPeriodRepo } from "../../../slices/gl/ports/fiscal-period-repo.js";
import type { IGlBalanceRepo } from "../../../slices/gl/ports/gl-balance-repo.js";
import type { ILedgerRepo } from "../../../slices/gl/ports/ledger-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import { classifyIncomeStatement } from "../../../shared/ports/close-readiness-hook.js";
import type { ClassifiableRow } from "../../../shared/ports/close-readiness-hook.js";
import { resolveCloseReadiness } from "../../../shared/ports/close-readiness-hook.js";
import type { CloseTask } from "../../../shared/ports/close-readiness-hook.js";

export interface CloseYearInput {
  readonly tenantId: string;
  readonly ledgerId: string;
  readonly fiscalYear: string;
  readonly retainedEarningsAccountId: string;
  readonly periodIds: readonly string[];
}

export interface CloseEvidenceItem {
  readonly type: string;
  readonly label: string;
  readonly data: Record<string, unknown>;
}

export interface CloseYearResult {
  readonly fiscalYear: string;
  readonly ledgerId: string;
  readonly periodsLocked: number;
  readonly closingJournalId: string | null;
  readonly netIncome: bigint;
  readonly currency: string;
  readonly evidence: readonly CloseEvidenceItem[];
  readonly closedAt: Date;
}

export interface CloseYearDeps {
  readonly periodRepo: IFiscalPeriodRepo;
  readonly journalRepo: IJournalRepo;
  readonly balanceRepo: IGlBalanceRepo;
  readonly ledgerRepo: ILedgerRepo;
  readonly outboxWriter: IOutboxWriter;
}

export async function closeYear(
  input: CloseYearInput,
  deps: CloseYearDeps,
  ctx?: FinanceContext,
): Promise<Result<CloseYearResult>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;

  if (input.periodIds.length === 0) {
    return err(new AppError("VALIDATION", "At least one period ID required for year-end close"));
  }

  // ── Step 1: Load ledger for currency ─────────────────────────────
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult;
  const currency = ledgerResult.value.baseCurrency;

  // ── Step 2: Load and validate all periods (GAP-14: batch load) ──
  const periodsResult = await deps.periodRepo.findByIds(input.periodIds);
  if (!periodsResult.ok) return periodsResult;
  const periods: FiscalPeriod[] = periodsResult.value;

  if (periods.length !== input.periodIds.length) {
    const foundIds = new Set(periods.map((p) => p.id));
    const missing = input.periodIds.filter((id) => !foundIds.has(id));
    return err(new AppError("NOT_FOUND", `Fiscal period(s) not found: ${missing.join(", ")}`));
  }

  // Build close tasks from periods for readiness check
  const closeTasks: CloseTask[] = periods.map((p, i) => ({
    id: p.id,
    name: p.name,
    status: p.status === "CLOSED" || p.status === "LOCKED" ? "completed" as const : "pending" as const,
    dependsOn: i > 0 ? [periods[i - 1]!.id] : [],
    companyId: String(p.companyId),
  }));

  const readiness = resolveCloseReadiness(closeTasks);
  if (!readiness.result.ready) {
    const pendingNames = periods
      .filter((p) => p.status === "OPEN")
      .map((p) => p.name);
    return err(
      new AppError(
        "INVALID_STATE",
        `Year-end close blocked: ${pendingNames.length} period(s) still OPEN — ${pendingNames.join(", ")}. Close all periods first.`,
      ),
    );
  }

  // ── Step 3: Check no DRAFT journals in any period ────────────────
  for (const period of periods) {
    const draftsResult = await deps.journalRepo.findByPeriod(period.id, "DRAFT", { page: 1, limit: 1 });
    if (!draftsResult.ok) {
      return err(new AppError("VALIDATION", `Failed to check drafts for period ${period.name}`));
    }
    if (draftsResult.value.total > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Cannot close year — ${draftsResult.value.total} DRAFT journal(s) in period ${period.name}. Post or void them first.`,
        ),
      );
    }
  }

  // ── Step 4: Generate evidence pack ───────────────────────────────
  const evidence: CloseEvidenceItem[] = [];

  // Trial balance snapshot
  const tbResult = await deps.balanceRepo.getTrialBalance(input.ledgerId, input.fiscalYear);
  if (!tbResult.ok) return tbResult as Result<never>;

  evidence.push({
    type: "trial_balance",
    label: `Trial Balance — FY${input.fiscalYear}`,
    data: {
      rowCount: tbResult.value.rows.length,
      totalDebits: tbResult.value.totalDebits.amount.toString(),
      totalCredits: tbResult.value.totalCredits.amount.toString(),
      isBalanced: tbResult.value.isBalanced,
    },
  });

  // Income statement summary via pure calculator
  const classifiableRows: ClassifiableRow[] = tbResult.value.rows.map((row) => ({
    accountCode: row.accountCode,
    accountName: row.accountName,
    accountType: row.accountType,
    netBalance: row.debitTotal.amount - row.creditTotal.amount,
  }));

  const { result: incomeResult } = classifyIncomeStatement(classifiableRows, currency);
  const netIncome = incomeResult.netIncome.amount;

  evidence.push({
    type: "income_statement",
    label: `Income Statement — FY${input.fiscalYear}`,
    data: {
      revenue: incomeResult.revenue.total.amount.toString(),
      expenses: incomeResult.expenses.total.amount.toString(),
      netIncome: netIncome.toString(),
    },
  });

  // ── Step 5: Create closing journal (zero P&L → Retained Earnings) ─
  let closingJournalId: string | null = null;

  if (netIncome !== 0n) {
    // Collect P&L account balances
    const plLines: { accountId: string; accountCode: string; accountType: string; net: bigint }[] = [];
    for (const row of tbResult.value.rows) {
      if (row.accountType === "REVENUE" || row.accountType === "EXPENSE") {
        const net = row.debitTotal.amount - row.creditTotal.amount;
        if (net !== 0n) {
          plLines.push({
            accountId: row.accountCode, // Will be resolved by repo
            accountCode: row.accountCode,
            accountType: row.accountType,
            net,
          });
        }
      }
    }

    // Build closing journal lines:
    // For each P&L account, reverse its balance (debit if credit-normal, credit if debit-normal)
    // Then offset to Retained Earnings
    const journalLines: CreateJournalInput["lines"][number][] = [];

    for (const pl of plLines) {
      if (pl.net > 0n) {
        // Debit-normal balance → credit to zero it out
        journalLines.push({
          accountId: pl.accountId,
          description: `Close ${pl.accountCode} to Retained Earnings`,
          debit: 0n,
          credit: pl.net,
        });
      } else {
        // Credit-normal balance → debit to zero it out
        journalLines.push({
          accountId: pl.accountId,
          description: `Close ${pl.accountCode} to Retained Earnings`,
          debit: -pl.net,
          credit: 0n,
        });
      }
    }

    // Retained Earnings offset line
    if (netIncome > 0n) {
      // Net profit → credit Retained Earnings
      journalLines.push({
        accountId: input.retainedEarningsAccountId,
        description: `FY${input.fiscalYear} net income to Retained Earnings`,
        debit: 0n,
        credit: netIncome,
      });
    } else {
      // Net loss → debit Retained Earnings
      journalLines.push({
        accountId: input.retainedEarningsAccountId,
        description: `FY${input.fiscalYear} net loss to Retained Earnings`,
        debit: -netIncome,
        credit: 0n,
      });
    }

    const lastPeriodId = input.periodIds[input.periodIds.length - 1]!;
    const closingJournalResult = await deps.journalRepo.create({
      tenantId,
      ledgerId: input.ledgerId,
      fiscalPeriodId: lastPeriodId,
      journalNumber: `YEC-${input.fiscalYear}`,
      description: `Year-end closing entry — FY${input.fiscalYear}`,
      postingDate: new Date(),
      lines: journalLines,
    });

    if (!closingJournalResult.ok) return closingJournalResult;

    // DEFECT-02 fix: Post the closing journal so it becomes a posted fact.
    // GL balances must reflect the closing entry before periods are locked.
    const postedClosing: Journal = { ...closingJournalResult.value, status: "POSTED" };
    const postResult = await deps.journalRepo.save(postedClosing);
    if (!postResult.ok) return postResult;
    closingJournalId = postedClosing.id;

    // GL balance upsert for the closing entry
    await deps.balanceRepo.upsertForJournal({
      tenantId,
      ledgerId: input.ledgerId,
      fiscalYear: input.fiscalYear,
      fiscalPeriod: input.periodIds.length,
      lines: journalLines.map((l) => ({
        accountId: l.accountId,
        debit: l.debit ?? 0n,
        credit: l.credit ?? 0n,
      })),
    });

    evidence.push({
      type: "closing_journal",
      label: `Closing Journal — FY${input.fiscalYear}`,
      data: {
        journalId: closingJournalId,
        journalNumber: `YEC-${input.fiscalYear}`,
        lineCount: journalLines.length,
        netIncome: netIncome.toString(),
        status: "POSTED",
      },
    });
  }

  // ── Step 6: Lock all periods ─────────────────────────────────────
  let periodsLocked = 0;
  for (const period of periods) {
    if (period.status === "LOCKED") continue;
    const lockResult = await deps.periodRepo.lock(period.id);
    if (!lockResult.ok) return lockResult;
    periodsLocked++;
  }

  evidence.push({
    type: "periods_locked",
    label: `Periods Locked — FY${input.fiscalYear}`,
    data: {
      periodsLocked,
      totalPeriods: periods.length,
      periodNames: periods.map((p) => p.name),
    },
  });

  // ── Step 7: Emit outbox event ────────────────────────────────────
  const closedAt = new Date();
  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.YEAR_CLOSED,
    payload: {
      fiscalYear: input.fiscalYear,
      ledgerId: input.ledgerId,
      closingJournalId,
      netIncome: netIncome.toString(),
      periodsLocked,
      closedAt: closedAt.toISOString(),
    },
  });

  return ok({
    fiscalYear: input.fiscalYear,
    ledgerId: input.ledgerId,
    periodsLocked,
    closingJournalId,
    netIncome,
    currency,
    evidence,
    closedAt,
  });
}
