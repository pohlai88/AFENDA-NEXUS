import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { postJournal } from "../slices/gl/services/post-journal.js";
import {
  IDS,
  makeJournal,
  makePeriod,
  mockJournalRepo,
  mockPeriodRepo,
  mockBalanceRepo,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockJournalAuditRepo,
  mockFxRateRepo,
  mockLedgerRepo,
  mockIcAgreementRepo,
  mockIcTransactionRepo,
} from "./helpers.js";

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    journalRepo: mockJournalRepo(),
    periodRepo: mockPeriodRepo(),
    balanceRepo: mockBalanceRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    fxRateRepo: mockFxRateRepo(),
    ledgerRepo: mockLedgerRepo(),
    icAgreementRepo: mockIcAgreementRepo(),
    icTransactionRepo: mockIcTransactionRepo(),
    ...overrides,
  };
}

describe("postJournal()", () => {
  it("rejects unbalanced journals", async () => {
    const journal = makeJournal({
      lines: [
        { accountId: "a1", accountCode: "1000", debit: money(100n, "USD"), credit: money(0n, "USD") },
        { accountId: "a2", accountCode: "2000", debit: money(0n, "USD"), credit: money(50n, "USD") },
      ],
    });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNBALANCED_JOURNAL");
  });

  it("rejects journals with < 2 lines", async () => {
    const journal = makeJournal({
      lines: [{ accountId: "a1", accountCode: "1000", debit: money(100n, "USD"), credit: money(0n, "USD") }],
    });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_LINES");
  });

  it("rejects non-DRAFT journals", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_STATE");
  });

  it("rejects duplicate idempotency key", async () => {
    const journal = makeJournal();
    const claimed = new Set(["t1:k1:POST_JOURNAL"]);
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      idempotencyStore: mockIdempotencyStore(claimed),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("rejects posting to CLOSED period", async () => {
    const journal = makeJournal();
    const closedPeriod = makePeriod({ status: "CLOSED" });
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      periodRepo: mockPeriodRepo([closedPeriod]),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_STATE");
  });

  it("rejects posting date outside period range", async () => {
    const journal = makeJournal({ date: new Date("2025-07-15") }); // outside June period
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("posts a valid balanced DRAFT journal", async () => {
    const journal = makeJournal();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("POSTED");
  });

  it("UPSERTs GL balances on successful post", async () => {
    const journal = makeJournal();
    const balanceRepo = mockBalanceRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      balanceRepo,
    });
    await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(balanceRepo.upserts.length).toBe(1);
  });

  it("emits JOURNAL_POSTED and GL_BALANCE_CHANGED outbox events", async () => {
    const journal = makeJournal();
    const outbox = mockOutboxWriter();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      outboxWriter: outbox,
    });
    await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    const types = outbox.events.map((e) => e.eventType);
    expect(types).toContain("JOURNAL_POSTED");
    expect(types).toContain("GL_BALANCE_CHANGED");
  });

  it("posts same-currency journal without FX rate", async () => {
    const journal = makeJournal();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects foreign-currency journal without FX rate", async () => {
    const journal = makeJournal({
      lines: [
        { accountId: "a1", accountCode: "1000", debit: money(100n, "EUR"), credit: money(0n, "EUR") },
        { accountId: "a2", accountCode: "2000", debit: money(0n, "EUR"), credit: money(100n, "EUR") },
      ],
    });
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      fxRateRepo: mockFxRateRepo([]),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("No FX rate found");
  });

  it("posts foreign-currency journal when FX rate exists", async () => {
    const journal = makeJournal({
      lines: [
        { accountId: "a1", accountCode: "1000", debit: money(100n, "EUR"), credit: money(0n, "EUR") },
        { accountId: "a2", accountCode: "2000", debit: money(0n, "EUR"), credit: money(100n, "EUR") },
      ],
    });
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      fxRateRepo: mockFxRateRepo([
        {
          id: "rate-1",
          companyId: "" as never,
          fromCurrency: "EUR",
          toCurrency: "USD",
          rate: 1.08,
          effectiveDate: new Date("2025-01-01"),
          source: "MANUAL",
        },
      ]),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(true);
  });

  it("converts foreign-currency amounts to base-currency in GL balance upsert", async () => {
    const journal = makeJournal({
      lines: [
        { accountId: "a1", accountCode: "1000", debit: money(10000n, "EUR"), credit: money(0n, "EUR") },
        { accountId: "a2", accountCode: "2000", debit: money(0n, "EUR"), credit: money(10000n, "EUR") },
      ],
    });
    const balanceRepo = mockBalanceRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      balanceRepo,
      fxRateRepo: mockFxRateRepo([
        {
          id: "rate-1",
          companyId: "" as never,
          fromCurrency: "EUR",
          toCurrency: "USD",
          rate: 1.08,
          effectiveDate: new Date("2025-01-01"),
          source: "MANUAL",
        },
      ]),
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(balanceRepo.upserts.length).toBe(1);
    const upsert = balanceRepo.upserts[0] as { lines: { accountId: string; debit: bigint; credit: bigint }[] };
    // EUR 10000 * 1.08 = 10800 USD (base currency)
    expect(upsert.lines[0]!.debit).toBe(10800n);
    expect(upsert.lines[0]!.credit).toBe(0n);
    expect(upsert.lines[1]!.debit).toBe(0n);
    expect(upsert.lines[1]!.credit).toBe(10800n);
  });

  it("does not convert same-currency amounts in GL balance upsert", async () => {
    const journal = makeJournal(); // default USD lines
    const balanceRepo = mockBalanceRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      balanceRepo,
    });
    const result = await postJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1" },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(balanceRepo.upserts.length).toBe(1);
    const upsert = balanceRepo.upserts[0] as { lines: { accountId: string; debit: bigint; credit: bigint }[] };
    // USD amounts pass through unchanged (10000n from default makeJournal)
    expect(upsert.lines[0]!.debit).toBe(10000n);
    expect(upsert.lines[1]!.credit).toBe(10000n);
  });
});
