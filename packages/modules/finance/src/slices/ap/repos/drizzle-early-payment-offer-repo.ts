/**
 * SP-5014 Repo: DrizzleEarlyPaymentOfferRepo
 *
 * Implements IEarlyPaymentOfferRepo against the erp.early_payment_offer table.
 * All queries are scoped to the tenant via the RLS-enabled TenantTx.
 */

import { eq, and, desc, sql, count, lt } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { earlyPaymentOffers } from '@afenda/db';
import type {
  EarlyPaymentOffer,
  EarlyPaymentOfferStatus,
  CreateEarlyPaymentOffer,
} from '@afenda/contracts/portal';
import type { IEarlyPaymentOfferRepo } from '../services/supplier-portal-scf.js';

function toContract(row: typeof earlyPaymentOffers.$inferSelect): EarlyPaymentOffer {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    supplierId: row.supplierId,
    offerExpiresAt: row.offerExpiresAt.toISOString(),
    proposedPaymentDate: row.proposedPaymentDate.toISOString(),
    originalDueDate: row.originalDueDate.toISOString(),
    discountBps: row.discountBps,
    aprBps: row.aprBps,
    pricingType: row.pricingType as EarlyPaymentOffer['pricingType'],
    invoiceAmountMinor: row.invoiceAmountMinor,
    discountAmountMinor: row.discountAmountMinor,
    netPaymentAmountMinor: row.netPaymentAmountMinor,
    currency: row.currency,
    status: row.status as EarlyPaymentOfferStatus,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzleEarlyPaymentOfferRepo implements IEarlyPaymentOfferRepo {
  constructor(private readonly tx: TenantTx) {}

  async list(params: {
    supplierId: string;
    status?: EarlyPaymentOfferStatus;
    page: number;
    limit: number;
  }): Promise<{ items: EarlyPaymentOffer[]; total: number }> {
    const { supplierId, status, page, limit } = params;
    const offset = (page - 1) * limit;

    const conditions = [eq(earlyPaymentOffers.supplierId, supplierId)];
    if (status) conditions.push(eq(earlyPaymentOffers.status, status));

    const [rows, countRows] = await Promise.all([
      this.tx
        .select()
        .from(earlyPaymentOffers)
        .where(and(...conditions))
        .orderBy(desc(earlyPaymentOffers.createdAt))
        .limit(limit)
        .offset(offset),
      this.tx
        .select({ total: count() })
        .from(earlyPaymentOffers)
        .where(and(...conditions)),
    ]);

    const total = countRows[0]?.total ?? 0;
    return { items: rows.map(toContract), total: Number(total) };
  }

  async getById(offerId: string): Promise<EarlyPaymentOffer | null> {
    const [row] = await this.tx
      .select()
      .from(earlyPaymentOffers)
      .where(eq(earlyPaymentOffers.id, offerId))
      .limit(1);

    return row ? toContract(row) : null;
  }

  async getByInvoiceId(invoiceId: string): Promise<EarlyPaymentOffer | null> {
    const [row] = await this.tx
      .select()
      .from(earlyPaymentOffers)
      .where(eq(earlyPaymentOffers.invoiceId, invoiceId))
      .orderBy(desc(earlyPaymentOffers.createdAt))
      .limit(1);

    return row ? toContract(row) : null;
  }

  async create(
    data: CreateEarlyPaymentOffer & { createdBy: string; tenantId: string }
  ): Promise<EarlyPaymentOffer> {
    const [row] = await this.tx
      .insert(earlyPaymentOffers)
      .values({
        tenantId: data.tenantId,
        invoiceId: data.invoiceId,
        supplierId: data.supplierId,
        offerExpiresAt: new Date(data.offerExpiresAt),
        proposedPaymentDate: new Date(data.proposedPaymentDate),
        originalDueDate: new Date(data.originalDueDate),
        discountBps: data.discountBps,
        aprBps: data.aprBps,
        pricingType: data.pricingType ?? 'APR',
        invoiceAmountMinor: data.invoiceAmountMinor,
        discountAmountMinor: data.discountAmountMinor,
        netPaymentAmountMinor: data.netPaymentAmountMinor,
        currency: data.currency,
        glConfigRef: data.glConfigRef ?? null,
        createdBy: data.createdBy,
        status: 'PENDING',
        isImmutable: false,
      })
      .returning();

    if (!row) throw new Error('Insert returned no row');
    return toContract(row);
  }

  async accept(offerId: string, acceptedByPortalUserId: string): Promise<EarlyPaymentOffer> {
    const [row] = await this.tx
      .update(earlyPaymentOffers)
      .set({
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByPortalUserId,
        isImmutable: true,
        updatedAt: new Date(),
      })
      .where(and(eq(earlyPaymentOffers.id, offerId), eq(earlyPaymentOffers.isImmutable, false)))
      .returning();

    if (!row) throw new Error('Offer could not be accepted — it may already be immutable.');
    return toContract(row);
  }

  async decline(offerId: string, _reason?: string): Promise<EarlyPaymentOffer> {
    const [row] = await this.tx
      .update(earlyPaymentOffers)
      .set({
        status: 'DECLINED',
        updatedAt: new Date(),
      })
      .where(eq(earlyPaymentOffers.id, offerId))
      .returning();

    if (!row) throw new Error('Offer not found for decline.');
    return toContract(row);
  }

  async expireStale(now: Date): Promise<number> {
    const result = await this.tx
      .update(earlyPaymentOffers)
      .set({ status: 'EXPIRED', updatedAt: now })
      .where(
        and(eq(earlyPaymentOffers.status, 'PENDING'), lt(earlyPaymentOffers.offerExpiresAt, now))
      )
      .returning({ id: earlyPaymentOffers.id });

    return result.length;
  }
}
