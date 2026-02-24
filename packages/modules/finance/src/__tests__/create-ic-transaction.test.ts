import { describe, it, expect } from "vitest";
import { ok, err, NotFoundError, companyId } from "@afenda/core";
import type { Result } from "@afenda/core";
import { createIcTransaction } from "../slices/ic/services/create-ic-transaction.js";
import type { IntercompanyRelationship, IntercompanyDocument } from "../slices/ic/entities/intercompany.js";
import type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "../app/ports/ic-repo.js";
import { IDS, mockJournalRepo, mockOutboxWriter } from "./helpers.js";

const AGREEMENT_ID = "00000000-0000-4000-8000-000000000099";
const SELLER = "00000000-0000-4000-8000-000000000030";
const BUYER = "00000000-0000-4000-8000-000000000031";

function makeAgreement(overrides: Partial<IntercompanyRelationship> = {}): IntercompanyRelationship {
  return {
    id: AGREEMENT_ID,
    tenantId: "t1" as never,
    sellerCompanyId: companyId(SELLER),
    buyerCompanyId: companyId(BUYER),
    pricingRule: "COST",
    markupPercent: null,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function mockIcAgreementRepo(agreement?: IntercompanyRelationship): IIcAgreementRepo {
  return {
    async findById(id: string): Promise<Result<IntercompanyRelationship>> {
      if (agreement && agreement.id === id) return ok(agreement);
      return err(new NotFoundError("IcAgreement", id));
    },
    async findByCompanyPair(): Promise<Result<IntercompanyRelationship>> {
      if (agreement) return ok(agreement);
      return err(new NotFoundError("IcAgreement", "pair"));
    },
  };
}

function mockIcTransactionRepo(): IIcTransactionRepo & { docs: CreateIcDocumentInput[] } {
  const docs: CreateIcDocumentInput[] = [];
  return {
    docs,
    async create(input: CreateIcDocumentInput): Promise<Result<IntercompanyDocument>> {
      docs.push(input);
      return ok({
        id: "ic-doc-001",
        tenantId: "t1" as never,
        relationshipId: input.relationshipId,
        sourceCompanyId: input.sourceCompanyId as never,
        mirrorCompanyId: input.mirrorCompanyId as never,
        sourceJournalId: input.sourceJournalId,
        mirrorJournalId: input.mirrorJournalId,
        status: "PAIRED",
        createdAt: new Date(),
      });
    },
    async findById(): Promise<Result<IntercompanyDocument>> {
      return err(new NotFoundError("IcDocument", "not-impl"));
    },
  };
}

const BASE_INPUT = {
  tenantId: "t1",
  userId: "u1",
  agreementId: AGREEMENT_ID,
  sourceLedgerId: IDS.ledger,
  mirrorLedgerId: "00000000-0000-4000-8000-000000000041",
  fiscalPeriodId: IDS.period,
  description: "IC Sale Q1",
  postingDate: new Date("2025-01-15"),
  sourceLines: [{ accountId: "a1", debit: 1000n, credit: 0n }],
  mirrorLines: [{ accountId: "a2", debit: 0n, credit: 1000n }],
};

describe("createIcTransaction()", () => {
  it("creates paired journals and IC document", async () => {
    const icTxRepo = mockIcTransactionRepo();
    const outbox = mockOutboxWriter();
    const deps = {
      icAgreementRepo: mockIcAgreementRepo(makeAgreement()),
      icTransactionRepo: icTxRepo,
      journalRepo: mockJournalRepo(),
      outboxWriter: outbox,
    };
    const result = await createIcTransaction(BASE_INPUT, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("PAIRED");
      expect(result.value.relationshipId).toBe(AGREEMENT_ID);
    }
    expect(icTxRepo.docs.length).toBe(1);
    expect(outbox.events.some((e) => e.eventType === "IC_TRANSACTION_CREATED")).toBe(true);
  });

  it("rejects when agreement not found", async () => {
    const deps = {
      icAgreementRepo: mockIcAgreementRepo(),
      icTransactionRepo: mockIcTransactionRepo(),
      journalRepo: mockJournalRepo(),
      outboxWriter: mockOutboxWriter(),
    };
    const result = await createIcTransaction(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
  });

  it("rejects inactive agreement", async () => {
    const deps = {
      icAgreementRepo: mockIcAgreementRepo(makeAgreement({ isActive: false })),
      icTransactionRepo: mockIcTransactionRepo(),
      journalRepo: mockJournalRepo(),
      outboxWriter: mockOutboxWriter(),
    };
    const result = await createIcTransaction(BASE_INPUT, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("inactive");
  });

  it("rejects when source lines are empty", async () => {
    const deps = {
      icAgreementRepo: mockIcAgreementRepo(makeAgreement()),
      icTransactionRepo: mockIcTransactionRepo(),
      journalRepo: mockJournalRepo(),
      outboxWriter: mockOutboxWriter(),
    };
    const result = await createIcTransaction(
      { ...BASE_INPUT, sourceLines: [] },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_LINES");
  });

  it("rejects when mirror lines are empty", async () => {
    const deps = {
      icAgreementRepo: mockIcAgreementRepo(makeAgreement()),
      icTransactionRepo: mockIcTransactionRepo(),
      journalRepo: mockJournalRepo(),
      outboxWriter: mockOutboxWriter(),
    };
    const result = await createIcTransaction(
      { ...BASE_INPUT, mirrorLines: [] },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_LINES");
  });
});
