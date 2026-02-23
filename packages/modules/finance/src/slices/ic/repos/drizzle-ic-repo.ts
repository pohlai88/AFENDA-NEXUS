import { eq, and, count } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { icAgreements, icTransactions, icTransactionLegs, currencies } from "@afenda/db";
import { ok, err, NotFoundError, type Result, type PaginationParams, type PaginatedResult } from "@afenda/core";
import type { IntercompanyRelationship, IntercompanyDocument } from "../entities/intercompany.js";
import type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "../../../slices/ic/ports/ic-repo.js";

export class DrizzleIcAgreementRepo implements IIcAgreementRepo {
  constructor(private readonly tx: TenantTx) { }

  async findById(id: string): Promise<Result<IntercompanyRelationship>> {
    const [row] = await this.tx
      .select()
      .from(icAgreements)
      .where(eq(icAgreements.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError("IcAgreement", id));

    return ok({
      id: row.id!,
      tenantId: row.tenantId as never,
      sellerCompanyId: row.sellerCompanyId as never,
      buyerCompanyId: row.buyerCompanyId as never,
      pricingRule: row.pricing as "COST" | "MARKUP" | "MARKET",
      markupPercent: row.markupPercent ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
    });
  }

  async findByCompanyPair(
    sellerCompanyId: string,
    buyerCompanyId: string,
  ): Promise<Result<IntercompanyRelationship>> {
    const [row] = await this.tx
      .select()
      .from(icAgreements)
      .where(
        and(
          eq(icAgreements.sellerCompanyId, sellerCompanyId),
          eq(icAgreements.buyerCompanyId, buyerCompanyId),
        ),
      )
      .limit(1);

    if (!row) return err(new NotFoundError("IcAgreement", `${sellerCompanyId}/${buyerCompanyId}`));

    return ok({
      id: row.id!,
      tenantId: row.tenantId as never,
      sellerCompanyId: row.sellerCompanyId as never,
      buyerCompanyId: row.buyerCompanyId as never,
      pricingRule: row.pricing as "COST" | "MARKUP" | "MARKET",
      markupPercent: row.markupPercent ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
    });
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<IntercompanyRelationship>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.tx
      .select({ total: count() })
      .from(icAgreements);

    const rows = await this.tx
      .select()
      .from(icAgreements)
      .limit(limit)
      .offset(offset);

    const data: IntercompanyRelationship[] = rows.map((row) => ({
      id: row.id!,
      tenantId: row.tenantId as never,
      sellerCompanyId: row.sellerCompanyId as never,
      buyerCompanyId: row.buyerCompanyId as never,
      pricingRule: row.pricing as "COST" | "MARKUP" | "MARKET",
      markupPercent: row.markupPercent ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
    }));

    return ok({ data, total: totalRow?.total ?? 0, page, limit });
  }
}

export class DrizzleIcTransactionRepo implements IIcTransactionRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(input: CreateIcDocumentInput): Promise<Result<IntercompanyDocument>> {
    // Resolve currencyId from currency code
    const [currencyRow] = await this.tx
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, input.currency))
      .limit(1);

    const currencyId = currencyRow?.id ?? "00000000-0000-0000-0000-000000000000";

    const [txRow] = await this.tx
      .insert(icTransactions)
      .values({
        tenantId: input.tenantId,
        agreementId: input.relationshipId,
        transactionDate: new Date(),
        amount: input.amount,
        currencyId,
        description: "IC Transaction",
      })
      .returning();

    if (!txRow) return err(new NotFoundError("IcTransaction", "create-failed"));

    // Create source leg
    await this.tx.insert(icTransactionLegs).values({
      tenantId: input.tenantId,
      transactionId: txRow.id!,
      companyId: input.sourceCompanyId,
      side: "SELLER",
      journalId: input.sourceJournalId,
    });

    // Create mirror leg
    await this.tx.insert(icTransactionLegs).values({
      tenantId: input.tenantId,
      transactionId: txRow.id!,
      companyId: input.mirrorCompanyId,
      side: "BUYER",
      journalId: input.mirrorJournalId,
    });

    return ok({
      id: txRow.id!,
      tenantId: input.tenantId as never,
      relationshipId: input.relationshipId,
      sourceCompanyId: input.sourceCompanyId as never,
      mirrorCompanyId: input.mirrorCompanyId as never,
      sourceJournalId: input.sourceJournalId,
      mirrorJournalId: input.mirrorJournalId,
      amount: input.amount,
      currency: input.currency,
      status: "PAIRED",
      createdAt: txRow.createdAt,
    });
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<IntercompanyDocument>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.tx
      .select({ total: count() })
      .from(icTransactions);

    const rows = await this.tx
      .select({
        id: icTransactions.id,
        tenantId: icTransactions.tenantId,
        agreementId: icTransactions.agreementId,
        amount: icTransactions.amount,
        settlementStatus: icTransactions.settlementStatus,
        createdAt: icTransactions.createdAt,
        currencyCode: currencies.code,
      })
      .from(icTransactions)
      .leftJoin(currencies, eq(icTransactions.currencyId, currencies.id))
      .limit(limit)
      .offset(offset);

    const data: IntercompanyDocument[] = [];
    for (const row of rows) {
      const legs = await this.tx
        .select()
        .from(icTransactionLegs)
        .where(eq(icTransactionLegs.transactionId, row.id!));

      const sellerLeg = legs.find((l) => l.side === "SELLER");
      const buyerLeg = legs.find((l) => l.side === "BUYER");

      data.push({
        id: row.id!,
        tenantId: row.tenantId as never,
        relationshipId: row.agreementId,
        sourceCompanyId: (sellerLeg?.companyId ?? "") as never,
        mirrorCompanyId: (buyerLeg?.companyId ?? "") as never,
        sourceJournalId: sellerLeg?.journalId ?? "",
        mirrorJournalId: buyerLeg?.journalId ?? "",
        amount: row.amount ?? 0n,
        currency: row.currencyCode ?? "USD",
        status: row.settlementStatus === "PENDING" ? "PENDING" : "PAIRED",
        createdAt: row.createdAt,
      });
    }

    return ok({ data, total: totalRow?.total ?? 0, page, limit });
  }

  async findById(id: string): Promise<Result<IntercompanyDocument>> {
    const [row] = await this.tx
      .select({
        id: icTransactions.id,
        tenantId: icTransactions.tenantId,
        agreementId: icTransactions.agreementId,
        amount: icTransactions.amount,
        settlementStatus: icTransactions.settlementStatus,
        createdAt: icTransactions.createdAt,
        currencyCode: currencies.code,
      })
      .from(icTransactions)
      .leftJoin(currencies, eq(icTransactions.currencyId, currencies.id))
      .where(eq(icTransactions.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError("IcTransaction", id));

    const legs = await this.tx
      .select()
      .from(icTransactionLegs)
      .where(eq(icTransactionLegs.transactionId, id));

    const sellerLeg = legs.find((l) => l.side === "SELLER");
    const buyerLeg = legs.find((l) => l.side === "BUYER");

    return ok({
      id: row.id!,
      tenantId: row.tenantId as never,
      relationshipId: row.agreementId,
      sourceCompanyId: (sellerLeg?.companyId ?? "") as never,
      mirrorCompanyId: (buyerLeg?.companyId ?? "") as never,
      sourceJournalId: sellerLeg?.journalId ?? "",
      mirrorJournalId: buyerLeg?.journalId ?? "",
      amount: row.amount ?? 0n,
      currency: row.currencyCode ?? "USD",
      status: row.settlementStatus === "PENDING" ? "PENDING" : "PAIRED",
      createdAt: row.createdAt,
    });
  }
}
