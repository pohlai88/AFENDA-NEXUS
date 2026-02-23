import { describe, it, expect, vi } from "vitest";
import { ok, err, AppError } from "@afenda/core";
import { recognizeRevenue } from "../slices/hub/services/recognize-revenue.js";
import type { IRevenueContractRepo } from "../app/ports/revenue-contract-repo.js";
import type { RevenueContract } from "../slices/hub/entities/revenue-recognition.js";
import type { TenantId, CompanyId } from "@afenda/core";
import {
  IDS,
  mockJournalRepo,
  mockLedgerRepo,
  makeLedger,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockJournalAuditRepo,
} from "./helpers.js";
import { companyId } from "@afenda/core";

function makeContract(overrides: Partial<RevenueContract> = {}): RevenueContract {
  return {
    id: "contract-1",
    tenantId: "t-1" as TenantId,
    companyId: IDS.company as unknown as CompanyId,
    contractNumber: "RC-001",
    customerName: "Acme Corp",
    totalAmount: 120000n,
    currency: "USD",
    recognitionMethod: "STRAIGHT_LINE",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    deferredAccountId: IDS.account1,
    revenueAccountId: IDS.account2,
    status: "ACTIVE",
    recognizedToDate: 0n,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function mockRevenueContractRepo(
  contract: RevenueContract = makeContract(),
): IRevenueContractRepo {
  let current = { ...contract };
  return {
    create: vi.fn().mockResolvedValue(ok(current)),
    findById: vi.fn().mockImplementation(async () => ok(current)),
    findAll: vi.fn().mockResolvedValue(ok({ data: [current], total: 1, page: 1, limit: 20 })),
    updateRecognized: vi.fn().mockImplementation(async (_id: string, amount: bigint) => {
      current = { ...current, recognizedToDate: amount };
      return ok(current);
    }),
    findMilestones: vi.fn().mockResolvedValue(ok([])),
  };
}

function makeDeps(contract?: RevenueContract) {
  return {
    revenueContractRepo: mockRevenueContractRepo(contract),
    journalRepo: mockJournalRepo(),
    ledgerRepo: mockLedgerRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
  };
}

const BASE_INPUT = {
  tenantId: "t-1",
  userId: "user-1",
  contractId: "contract-1",
  periodId: IDS.period,
  ledgerId: IDS.ledger,
  idempotencyKey: "ik-rev-rec-1",
};

describe("recognizeRevenue (AH-04)", () => {
  it("recognizes straight-line revenue for one period", async () => {
    const deps = makeDeps();
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // 120000 / 12 months = 10000 per period
      expect(result.value.recognizedAmount).toBe(10000n);
      expect(result.value.totalRecognizedToDate).toBe(10000n);
      expect(result.value.remainingToRecognize).toBe(110000n);
      expect(result.value.contractId).toBe("contract-1");
      expect(result.value.journalId).toBeDefined();
    }
  });

  it("creates a journal with deferred debit and revenue credit", async () => {
    const deps = makeDeps();
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(true);
    expect(deps.journalRepo.journals.size).toBe(1);
    const journal = [...(deps.journalRepo as ReturnType<typeof mockJournalRepo>).journals.values()][0]!;
    expect(journal.lines).toHaveLength(2);
    expect(journal.lines[0]!.debit.amount).toBe(10000n);
    expect(journal.lines[0]!.credit.amount).toBe(0n);
    expect(journal.lines[1]!.debit.amount).toBe(0n);
    expect(journal.lines[1]!.credit.amount).toBe(10000n);
  });

  it("emits REVENUE_RECOGNIZED outbox event", async () => {
    const deps = makeDeps();
    await recognizeRevenue(BASE_INPUT, deps);

    const outbox = deps.outboxWriter as ReturnType<typeof mockOutboxWriter>;
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe("REVENUE_RECOGNIZED");
    expect(outbox.events[0]!.payload).toHaveProperty("contractId", "contract-1");
  });

  it("updates recognizedToDate on the contract", async () => {
    const deps = makeDeps();
    await recognizeRevenue(BASE_INPUT, deps);

    expect(deps.revenueContractRepo.updateRecognized).toHaveBeenCalledWith(
      "contract-1",
      10000n,
    );
  });

  it("rejects duplicate idempotency key", async () => {
    const claimed = new Set(["t-1:ik-rev-rec-1:RECOGNIZE_REVENUE"]);
    const deps = makeDeps();
    deps.idempotencyStore = mockIdempotencyStore(claimed);

    const result = await recognizeRevenue(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("rejects non-ACTIVE contract", async () => {
    const deps = makeDeps(makeContract({ status: "COMPLETED" }));
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE");
      expect(result.error.message).toContain("COMPLETED");
    }
  });

  it("rejects fully recognized contract", async () => {
    const deps = makeDeps(makeContract({ recognizedToDate: 120000n }));
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("caps recognition at remaining amount", async () => {
    // 115000 already recognized, only 5000 remaining (less than per-period 10000)
    const deps = makeDeps(makeContract({ recognizedToDate: 115000n }));
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recognizedAmount).toBe(5000n);
      expect(result.value.totalRecognizedToDate).toBe(120000n);
      expect(result.value.remainingToRecognize).toBe(0n);
    }
  });

  it("rejects cancelled contract", async () => {
    const deps = makeDeps(makeContract({ status: "CANCELLED" }));
    const result = await recognizeRevenue(BASE_INPUT, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_STATE");
  });

  it("propagates contract not found", async () => {
    const deps = makeDeps();
    (deps.revenueContractRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      err(new AppError("NOT_FOUND", "Contract not found")),
    );

    const result = await recognizeRevenue(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("logs audit entry for recognition journal", async () => {
    const deps = makeDeps();
    await recognizeRevenue(BASE_INPUT, deps);

    const audit = deps.journalAuditRepo as ReturnType<typeof mockJournalAuditRepo>;
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]!.reason).toContain("RC-001");
  });

  it("rejects when ledger company does not match contract company", async () => {
    const deps = makeDeps();
    // Override ledgerRepo to return a ledger with a different companyId
    deps.ledgerRepo = mockLedgerRepo([makeLedger({ companyId: companyId(IDS.company2) })]);

    const result = await recognizeRevenue(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("COMPANY_MISMATCH");
    }
  });
});
