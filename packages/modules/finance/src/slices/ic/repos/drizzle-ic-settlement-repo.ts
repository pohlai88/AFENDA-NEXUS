import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { icSettlements, icSettlementLines } from "@afenda/db";
import { ok, err, NotFoundError, AppError, type Result } from "@afenda/core";
import type { IcSettlement } from "../../ic/entities/ic-settlement.js";
import type { IIcSettlementRepo, CreateIcSettlementInput } from "../../../slices/ic/ports/ic-settlement-repo.js";

export class DrizzleIcSettlementRepo implements IIcSettlementRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(input: CreateIcSettlementInput): Promise<Result<IcSettlement>> {
    const settlementNumber = `STL-${Date.now()}`;

    const [row] = await this.tx
      .insert(icSettlements)
      .values({
        tenantId: input.tenantId,
        settlementNumber,
        agreementId: input.sellerCompanyId,
        method: input.settlementMethod,
        status: "DRAFT",
        settlementDate: new Date(),
        totalAmount: input.settlementAmount,
        currencyId: input.currency,
        metadata: {
          sellerCompanyId: input.sellerCompanyId,
          buyerCompanyId: input.buyerCompanyId,
          settledBy: input.settledBy,
          reason: input.reason,
        },
      })
      .returning();

    if (!row) return err(new AppError("INTERNAL", "Failed to create IC settlement"));

    // Create settlement lines linking to IC documents
    for (const docId of input.documentIds) {
      await this.tx.insert(icSettlementLines).values({
        tenantId: input.tenantId,
        settlementId: row.id!,
        transactionId: docId,
        amount: input.settlementAmount / BigInt(input.documentIds.length),
      });
    }

    return ok(this.mapToDomain(row, input));
  }

  async findById(id: string): Promise<Result<IcSettlement>> {
    const [row] = await this.tx
      .select()
      .from(icSettlements)
      .where(eq(icSettlements.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError("IcSettlement", id));

    const lines = await this.tx
      .select()
      .from(icSettlementLines)
      .where(eq(icSettlementLines.settlementId, id));

    const metadata = (row.metadata ?? {}) as Record<string, string>;

    return ok({
      id: row.id!,
      tenantId: row.tenantId as never,
      sellerCompanyId: (metadata.sellerCompanyId ?? "") as never,
      buyerCompanyId: (metadata.buyerCompanyId ?? "") as never,
      documentIds: lines.map((l) => l.transactionId),
      settlementMethod: row.method as IcSettlement["settlementMethod"],
      settlementAmount: row.totalAmount,
      currency: row.currencyId,
      fxGainLoss: 0n,
      status: row.status as IcSettlement["status"],
      settledBy: metadata.settledBy ?? "",
      settledAt: row.confirmedAt ?? row.createdAt,
      reason: metadata.reason,
    });
  }

  async confirm(id: string): Promise<Result<IcSettlement>> {
    const [row] = await this.tx
      .update(icSettlements)
      .set({
        status: "CONFIRMED",
        confirmedAt: new Date(),
      })
      .where(eq(icSettlements.id, id))
      .returning();

    if (!row) return err(new NotFoundError("IcSettlement", id));

    return this.findById(id);
  }

  async cancel(id: string, reason: string): Promise<Result<IcSettlement>> {
    const existing = await this.findById(id);
    if (!existing.ok) return existing;

    if (existing.value.status !== "DRAFT") {
      return err(new AppError("INVALID_STATE", `Settlement ${id} is ${existing.value.status}, expected DRAFT`));
    }

    const metadata = {
      ...(await this.getMetadata(id)),
      cancelReason: reason,
    };

    const [row] = await this.tx
      .update(icSettlements)
      .set({ status: "CANCELLED" as never, metadata })
      .where(eq(icSettlements.id, id))
      .returning();

    if (!row) return err(new NotFoundError("IcSettlement", id));

    return this.findById(id);
  }

  private async getMetadata(id: string): Promise<Record<string, string>> {
    const [row] = await this.tx
      .select({ metadata: icSettlements.metadata })
      .from(icSettlements)
      .where(eq(icSettlements.id, id))
      .limit(1);
    return (row?.metadata ?? {}) as Record<string, string>;
  }

  private mapToDomain(
    row: typeof icSettlements.$inferSelect,
    input: CreateIcSettlementInput,
  ): IcSettlement {
    return {
      id: row.id!,
      tenantId: input.tenantId as never,
      sellerCompanyId: input.sellerCompanyId as never,
      buyerCompanyId: input.buyerCompanyId as never,
      documentIds: input.documentIds,
      settlementMethod: row.method as IcSettlement["settlementMethod"],
      settlementAmount: row.totalAmount,
      currency: row.currencyId,
      fxGainLoss: input.fxGainLoss,
      status: row.status as IcSettlement["status"],
      settledBy: input.settledBy,
      settledAt: row.createdAt,
      reason: input.reason,
    };
  }
}
