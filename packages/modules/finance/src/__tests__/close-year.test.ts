import { describe, it, expect } from "vitest";
import { closeYear } from "../app/services/close-year.js";
import type { CloseYearDeps, CloseYearInput } from "../app/services/close-year.js";
import {
  IDS,
  makePeriod,
  makeJournal,
  mockJournalRepo,
  mockPeriodRepo,
  mockLedgerRepo,
  mockOutboxWriter,
} from "./helpers.js";
import { ok, money, companyId, ledgerId, dateRange } from "@afenda/core";
import type { TrialBalance, TrialBalanceRow } from "../domain/index.js";
import type { IGlBalanceRepo } from "../app/ports/gl-balance-repo.js";
import type { Result } from "@afenda/core";

const PERIOD_IDS = {
  p01: "00000000-0000-4000-8000-000000000201",
  p02: "00000000-0000-4000-8000-000000000202",
  p03: "00000000-0000-4000-8000-000000000203",
} as const;

const RE_ACCOUNT_ID = "00000000-0000-4000-8000-000000000050";

function makeClosedPeriods() {
  return [
    makePeriod({ id: PERIOD_IDS.p01, name: "2025-P01", status: "CLOSED", range: dateRange(new Date("2025-01-01"), new Date("2025-01-31")) }),
    makePeriod({ id: PERIOD_IDS.p02, name: "2025-P02", status: "CLOSED", range: dateRange(new Date("2025-02-01"), new Date("2025-02-28")) }),
    makePeriod({ id: PERIOD_IDS.p03, name: "2025-P03", status: "CLOSED", range: dateRange(new Date("2025-03-01"), new Date("2025-03-31")) }),
  ];
}

function makeTbRows(): TrialBalanceRow[] {
  return [
    { accountCode: "1000", accountName: "Cash", accountType: "ASSET", debitTotal: money(100000n, "USD"), creditTotal: money(0n, "USD") },
    { accountCode: "2000", accountName: "AP", accountType: "LIABILITY", debitTotal: money(0n, "USD"), creditTotal: money(30000n, "USD") },
    { accountCode: "3000", accountName: "Retained Earnings", accountType: "EQUITY", debitTotal: money(0n, "USD"), creditTotal: money(20000n, "USD") },
    { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", debitTotal: money(0n, "USD"), creditTotal: money(80000n, "USD") },
    { accountCode: "5000", accountName: "COGS", accountType: "EXPENSE", debitTotal: money(25000n, "USD"), creditTotal: money(0n, "USD") },
    { accountCode: "6000", accountName: "OpEx", accountType: "EXPENSE", debitTotal: money(5000n, "USD"), creditTotal: money(0n, "USD") },
  ];
}

function mockBalanceRepoWithRows(rows: TrialBalanceRow[]): IGlBalanceRepo & { upserts: unknown[] } {
  const upserts: unknown[] = [];
  return {
    upserts,
    async getTrialBalance(): Promise<Result<TrialBalance>> {
      const totalDebits = rows.reduce((s, r) => s + r.debitTotal.amount, 0n);
      const totalCredits = rows.reduce((s, r) => s + r.creditTotal.amount, 0n);
      return ok({
        companyId: companyId(IDS.company),
        ledgerId: ledgerId(IDS.ledger),
        periodId: "2025",
        rows,
        totalDebits: money(totalDebits, "USD"),
        totalCredits: money(totalCredits, "USD"),
        isBalanced: totalDebits === totalCredits,
      });
    },
    async upsertForJournal(input: unknown): Promise<void> {
      upserts.push(input);
    },
  };
}

function makeInput(overrides: Partial<CloseYearInput> = {}): CloseYearInput {
  return {
    tenantId: "t1",
    ledgerId: IDS.ledger,
    fiscalYear: "2025",
    retainedEarningsAccountId: RE_ACCOUNT_ID,
    periodIds: [PERIOD_IDS.p01, PERIOD_IDS.p02, PERIOD_IDS.p03],
    ...overrides,
  };
}

function makeDeps(overrides: Partial<CloseYearDeps> = {}): CloseYearDeps {
  return {
    periodRepo: mockPeriodRepo(makeClosedPeriods()),
    journalRepo: mockJournalRepo(),
    balanceRepo: mockBalanceRepoWithRows(makeTbRows()),
    ledgerRepo: mockLedgerRepo(),
    outboxWriter: mockOutboxWriter(),
    ...overrides,
  };
}

describe("closeYear()", () => {
  it("closes a fiscal year with all periods CLOSED", async () => {
    const deps = makeDeps();
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fiscalYear).toBe("2025");
    expect(result.value.periodsLocked).toBe(3);
    expect(result.value.closingJournalId).toBeTruthy();
    expect(result.value.currency).toBe("USD");
    expect(result.value.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it("computes net income correctly from P&L accounts", async () => {
    const deps = makeDeps();
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Revenue: 80000 credit → net = 0 - 80000 = -80000
    // COGS: 25000 debit → net = 25000
    // OpEx: 5000 debit → net = 5000
    // classifyIncomeStatement: revenue.total = 80000, expenses.total = 30000
    // netIncome = 80000 - 30000 = 50000
    expect(result.value.netIncome).toBe(50000n);
  });

  it("generates evidence pack with trial balance and income statement", async () => {
    const deps = makeDeps();
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const types = result.value.evidence.map((e) => e.type);
    expect(types).toContain("trial_balance");
    expect(types).toContain("income_statement");
    expect(types).toContain("closing_journal");
    expect(types).toContain("periods_locked");
  });

  it("creates closing journal that zeros P&L to Retained Earnings", async () => {
    const journalRepo = mockJournalRepo();
    const deps = makeDeps({ journalRepo });
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Should have created a journal
    expect(journalRepo.journals.size).toBe(1);
    const [journal] = [...journalRepo.journals.values()];
    expect(journal.description).toContain("Year-end closing");
    // Lines: 3 P&L accounts + 1 Retained Earnings = 4 lines
    expect(journal.lines.length).toBe(4);
  });

  it("skips closing journal when net income is zero", async () => {
    const zeroRows: TrialBalanceRow[] = [
      { accountCode: "1000", accountName: "Cash", accountType: "ASSET", debitTotal: money(50000n, "USD"), creditTotal: money(0n, "USD") },
      { accountCode: "2000", accountName: "AP", accountType: "LIABILITY", debitTotal: money(0n, "USD"), creditTotal: money(50000n, "USD") },
    ];
    const journalRepo = mockJournalRepo();
    const deps = makeDeps({
      balanceRepo: mockBalanceRepoWithRows(zeroRows),
      journalRepo,
    });
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.closingJournalId).toBeNull();
    expect(result.value.netIncome).toBe(0n);
    expect(journalRepo.journals.size).toBe(0);
  });

  it("rejects when periods are still OPEN", async () => {
    const periods = [
      makePeriod({ id: PERIOD_IDS.p01, name: "2025-P01", status: "CLOSED", range: dateRange(new Date("2025-01-01"), new Date("2025-01-31")) }),
      makePeriod({ id: PERIOD_IDS.p02, name: "2025-P02", status: "OPEN", range: dateRange(new Date("2025-02-01"), new Date("2025-02-28")) }),
      makePeriod({ id: PERIOD_IDS.p03, name: "2025-P03", status: "CLOSED", range: dateRange(new Date("2025-03-01"), new Date("2025-03-31")) }),
    ];
    const deps = makeDeps({ periodRepo: mockPeriodRepo(periods) });
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_STATE");
    expect(result.error.message).toContain("2025-P02");
  });

  it("rejects when DRAFT journals remain in any period", async () => {
    const draft = makeJournal({ fiscalPeriodId: PERIOD_IDS.p01, status: "DRAFT" });
    const journalRepo = mockJournalRepo(new Map([[draft.id, draft]]));
    const deps = makeDeps({ journalRepo });
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION");
    expect(result.error.message).toContain("DRAFT");
  });

  it("rejects empty periodIds", async () => {
    const deps = makeDeps();
    const result = await closeYear(makeInput({ periodIds: [] }), deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION");
  });

  it("emits YEAR_CLOSED outbox event", async () => {
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ outboxWriter: outbox });
    await closeYear(makeInput(), deps);
    expect(outbox.events.some((e) => e.eventType === "YEAR_CLOSED")).toBe(true);
    const event = outbox.events.find((e) => e.eventType === "YEAR_CLOSED")!;
    expect(event.payload).toHaveProperty("fiscalYear", "2025");
    expect(event.payload).toHaveProperty("netIncome");
  });

  it("does not re-lock already LOCKED periods", async () => {
    const periods = [
      makePeriod({ id: PERIOD_IDS.p01, name: "2025-P01", status: "LOCKED", range: dateRange(new Date("2025-01-01"), new Date("2025-01-31")) }),
      makePeriod({ id: PERIOD_IDS.p02, name: "2025-P02", status: "CLOSED", range: dateRange(new Date("2025-02-01"), new Date("2025-02-28")) }),
      makePeriod({ id: PERIOD_IDS.p03, name: "2025-P03", status: "CLOSED", range: dateRange(new Date("2025-03-01"), new Date("2025-03-31")) }),
    ];
    const deps = makeDeps({ periodRepo: mockPeriodRepo(periods) });
    const result = await closeYear(makeInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Only 2 periods should be locked (p02 and p03), p01 was already LOCKED
    expect(result.value.periodsLocked).toBe(2);
  });

  it("uses ctx.tenantId when FinanceContext provided", async () => {
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ outboxWriter: outbox });
    const { createFinanceContext } = await import("../domain/finance-context.js");
    const ctx = createFinanceContext({ tenantId: "ctx-tenant", userId: "u1", companyId: IDS.company });
    await closeYear(makeInput(), deps, ctx);
    expect(outbox.events[0].tenantId).toBe("ctx-tenant");
  });
});
