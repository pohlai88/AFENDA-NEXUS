import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { reverseJournal } from "../app/services/reverse-journal.js";
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

describe("reverseJournal()", () => {
  it("rejects non-POSTED journals", async () => {
    const journal = makeJournal({ status: "DRAFT" });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "test" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_STATE");
  });

  it("rejects duplicate idempotency key", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const claimed = new Set(["t1:k1:REVERSE_JOURNAL"]);
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      idempotencyStore: mockIdempotencyStore(claimed),
    });
    const result = await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "test" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("rejects reversal into CLOSED period (A-14)", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      periodRepo: mockPeriodRepo([makePeriod({ status: "CLOSED" })]),
    });
    const result = await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "error correction" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_STATE");
  });

  it("creates a mirror journal with swapped debits/credits", async () => {
    const journal = makeJournal({
      status: "POSTED",
      lines: [
        { accountId: "a1", accountCode: "1000", debit: money(500n, "USD"), credit: money(0n, "USD") },
        { accountId: "a2", accountCode: "2000", debit: money(0n, "USD"), credit: money(500n, "USD") },
      ],
    });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "error correction" },
      deps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toContain("Reversal of");
    }
  });

  it("marks original journal as REVERSED with linkage (A-13)", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const repo = mockJournalRepo(new Map([[IDS.journal, journal]]));
    const deps = makeDeps({ journalRepo: repo });
    await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "error correction" },
      deps,
    );
    const original = repo.journals.get(IDS.journal);
    expect(original?.status).toBe("REVERSED");
    expect(original?.reversedById).toBeDefined();
  });

  it("UPSERTs GL balances with reversed amounts", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const balanceRepo = mockBalanceRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      balanceRepo,
    });
    await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "error correction" },
      deps,
    );
    expect(balanceRepo.upserts.length).toBe(1);
  });

  it("emits JOURNAL_REVERSED and GL_BALANCE_CHANGED outbox events", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const outbox = mockOutboxWriter();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      outboxWriter: outbox,
    });
    await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "error correction" },
      deps,
    );
    const types = outbox.events.map((e) => e.eventType);
    expect(types).toContain("JOURNAL_REVERSED");
    expect(types).toContain("GL_BALANCE_CHANGED");
  });

  it("passes reason to audit log (A-11)", async () => {
    const journal = makeJournal({ status: "POSTED" });
    const auditRepo = mockJournalAuditRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      journalAuditRepo: auditRepo,
    });
    await reverseJournal(
      { tenantId: "t1", userId: "u1", journalId: IDS.journal, idempotencyKey: "k1", reason: "duplicate entry" },
      deps,
    );
    expect(auditRepo.entries.length).toBe(2);
    // First entry: reversal journal DRAFT → POSTED (auto-posted)
    expect(auditRepo.entries[0].toStatus).toBe("POSTED");
    // Second entry: original journal POSTED → REVERSED with user reason
    expect(auditRepo.entries[1].reason).toBe("duplicate entry");
    expect(auditRepo.entries[1].toStatus).toBe("REVERSED");
  });
});
