import { describe, it, expect, vi } from "vitest";
import { ok, err, AppError } from "@afenda/core";
import { settleIcDocuments } from "../slices/ic/services/settle-ic-documents.js";
import type { IIcSettlementRepo } from "../app/ports/ic-settlement-repo.js";
import type { IIcTransactionRepo } from "../app/ports/ic-repo.js";
import type { IOutboxWriter } from "../app/ports/outbox-writer.js";
import type { IcSettlement } from "../domain/entities/ic-settlement.js";
import type { IntercompanyDocument } from "../slices/ic/entities/intercompany.js";
import type { CompanyId, TenantId } from "@afenda/core";

function makeDocument(overrides: Partial<IntercompanyDocument> = {}): IntercompanyDocument {
  return {
    id: "doc-1",
    tenantId: "t-1" as TenantId,
    relationshipId: "rel-1",
    sourceCompanyId: "co-seller" as CompanyId,
    mirrorCompanyId: "co-buyer" as CompanyId,
    sourceJournalId: "j-1",
    mirrorJournalId: "j-2",
    status: "PAIRED",
    createdAt: new Date("2025-01-15"),
    ...overrides,
  };
}

function makeSettlement(overrides: Partial<IcSettlement> = {}): IcSettlement {
  return {
    id: "settle-1",
    tenantId: "t-1" as TenantId,
    sellerCompanyId: "co-seller" as CompanyId,
    buyerCompanyId: "co-buyer" as CompanyId,
    documentIds: ["doc-1"],
    settlementMethod: "NETTING",
    settlementAmount: 50000n,
    currency: "USD",
    fxGainLoss: 0n,
    status: "DRAFT",
    settledBy: "user-1",
    settledAt: new Date(),
    ...overrides,
  };
}

function makeDeps() {
  const icSettlementRepo: IIcSettlementRepo = {
    create: vi.fn().mockResolvedValue(ok(makeSettlement())),
    findById: vi.fn().mockResolvedValue(ok(makeSettlement())),
    confirm: vi.fn().mockResolvedValue(ok(makeSettlement({ status: "CONFIRMED" }))),
    cancel: vi.fn().mockResolvedValue(ok(makeSettlement({ status: "CANCELLED" }))),
  };
  const icTransactionRepo: IIcTransactionRepo = {
    create: vi.fn().mockResolvedValue(ok(makeDocument())),
    findById: vi.fn().mockResolvedValue(ok(makeDocument())),
  };
  const outboxWriter: IOutboxWriter = {
    write: vi.fn().mockResolvedValue(undefined),
  };
  return { icSettlementRepo, icTransactionRepo, outboxWriter };
}

const BASE_INPUT = {
  tenantId: "t-1",
  userId: "user-1",
  sellerCompanyId: "co-seller",
  buyerCompanyId: "co-buyer",
  documentIds: ["doc-1"],
  settlementMethod: "NETTING" as const,
  settlementAmount: 50000n,
  currency: "USD",
  fxGainLoss: 0n,
};

describe("settleIcDocuments (A-22)", () => {
  it("creates and confirms a settlement for PAIRED documents", async () => {
    const deps = makeDeps();
    const result = await settleIcDocuments(BASE_INPUT, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("CONFIRMED");
    }
    expect(deps.icSettlementRepo.create).toHaveBeenCalledOnce();
    expect(deps.icSettlementRepo.confirm).toHaveBeenCalledOnce();
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "IC_SETTLEMENT_CONFIRMED" }),
    );
  });

  it("rejects settlement with zero documents", async () => {
    const deps = makeDeps();
    const result = await settleIcDocuments({ ...BASE_INPUT, documentIds: [] }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejects settlement when document is not found", async () => {
    const deps = makeDeps();
    (deps.icTransactionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      err(new AppError("NOT_FOUND", "not found")),
    );

    const result = await settleIcDocuments(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("rejects settlement when document is not in PAIRED status", async () => {
    const deps = makeDeps();
    (deps.icTransactionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ok(makeDocument({ status: "PENDING" })),
    );

    const result = await settleIcDocuments(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE");
      expect(result.error.message).toContain("PENDING");
    }
  });

  it("rejects already reconciled documents", async () => {
    const deps = makeDeps();
    (deps.icTransactionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ok(makeDocument({ status: "RECONCILED" })),
    );

    const result = await settleIcDocuments(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE");
    }
  });

  it("handles multiple documents in a single settlement", async () => {
    const deps = makeDeps();
    const input = { ...BASE_INPUT, documentIds: ["doc-1", "doc-2", "doc-3"] };

    const result = await settleIcDocuments(input, deps);
    expect(result.ok).toBe(true);
    expect(deps.icTransactionRepo.findById).toHaveBeenCalledTimes(3);
  });

  it("propagates create failure", async () => {
    const deps = makeDeps();
    (deps.icSettlementRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      err(new AppError("INTERNAL_ERROR", "DB error")),
    );

    const result = await settleIcDocuments(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
  });

  it("does not write outbox event if confirm fails", async () => {
    const deps = makeDeps();
    (deps.icSettlementRepo.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(
      err(new AppError("INTERNAL_ERROR", "confirm failed")),
    );

    const result = await settleIcDocuments(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    expect(deps.outboxWriter.write).not.toHaveBeenCalled();
  });
});
