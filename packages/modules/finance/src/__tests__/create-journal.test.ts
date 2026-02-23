import { describe, it, expect } from "vitest";
import { createJournal } from "../app/services/create-journal.js";
import {
  makeAccount,
  makePeriod,
  mockJournalRepo,
  mockAccountRepo,
  mockPeriodRepo,
  mockOutboxWriter,
  mockJournalAuditRepo,
  mockFxRateRepo,
  mockDocumentNumberGenerator,
} from "./helpers.js";

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    journalRepo: mockJournalRepo(),
    accountRepo: mockAccountRepo([
      makeAccount({ id: "acc-001", code: "1000" }),
      makeAccount({ id: "acc-002", code: "2000" }),
    ]),
    periodRepo: mockPeriodRepo([makePeriod()]),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    fxRateRepo: mockFxRateRepo(),
    documentNumberGenerator: mockDocumentNumberGenerator(),
    ...overrides,
  };
}

describe("createJournal()", () => {
  it("rejects journals with < 2 lines", async () => {
    const deps = makeDeps();
    const result = await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Test",
        postingDate: new Date("2025-06-15"),
        lines: [{ accountCode: "1000", debit: 100n, credit: 0n, currency: "USD" }],
      },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_LINES");
  });

  it("rejects unknown account codes", async () => {
    const deps = makeDeps({ accountRepo: mockAccountRepo([makeAccount({ code: "1000" })]) });
    const result = await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Test",
        postingDate: new Date("2025-06-15"),
        lines: [
          { accountCode: "1000", debit: 100n, credit: 0n, currency: "USD" },
          { accountCode: "UNKNOWN", debit: 0n, credit: 100n, currency: "USD" },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects posting date with no open period", async () => {
    const deps = makeDeps({ periodRepo: mockPeriodRepo([makePeriod({ status: "CLOSED" })]) });
    const result = await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Test",
        postingDate: new Date("2025-06-15"),
        lines: [
          { accountCode: "1000", debit: 100n, credit: 0n, currency: "USD" },
          { accountCode: "2000", debit: 0n, credit: 100n, currency: "USD" },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PERIOD_NOT_OPEN");
  });

  it("creates a DRAFT journal with resolved accountIds", async () => {
    const deps = makeDeps();
    const result = await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Test journal",
        postingDate: new Date("2025-06-15"),
        lines: [
          { accountCode: "1000", debit: 10000n, credit: 0n, currency: "USD" },
          { accountCode: "2000", debit: 0n, credit: 10000n, currency: "USD" },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("DRAFT");
      expect(result.value.lines.length).toBe(2);
    }
  });

  it("emits JOURNAL_CREATED outbox event", async () => {
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ outboxWriter: outbox });
    await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Test",
        postingDate: new Date("2025-06-15"),
        lines: [
          { accountCode: "1000", debit: 100n, credit: 0n, currency: "USD" },
          { accountCode: "2000", debit: 0n, credit: 100n, currency: "USD" },
        ],
      },
      deps,
    );
    expect(outbox.events.some((e) => e.eventType === "JOURNAL_CREATED")).toBe(true);
  });

  it("rejects cross-company account lines when FinanceContext is provided (A-05)", async () => {
    const { companyId } = await import("@afenda/core");
    const { createFinanceContext } = await import("../domain/finance-context.js");
    const otherCompany = "00000000-0000-4000-8000-000000000099";
    const deps = makeDeps({
      accountRepo: mockAccountRepo([
        makeAccount({ id: "acc-001", code: "1000", companyId: companyId(otherCompany) }),
        makeAccount({ id: "acc-002", code: "2000", companyId: companyId(otherCompany) }),
      ]),
    });
    const ctx = createFinanceContext({
      tenantId: "t1",
      userId: "u1",
      companyId: "00000000-0000-4000-8000-000000000030",
    });
    const result = await createJournal(
      {
        tenantId: "t1",
        userId: "u1",
        ledgerId: "led-001",
        description: "Cross-company test",
        postingDate: new Date("2025-06-15"),
        lines: [
          { accountCode: "1000", debit: 100n, credit: 0n, currency: "USD" },
          { accountCode: "2000", debit: 0n, credit: 100n, currency: "USD" },
        ],
      },
      deps,
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("COMPANY_MISMATCH");
  });
});
