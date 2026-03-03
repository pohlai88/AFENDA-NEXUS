/**
 * SP-5014: CAP-SCF — Supply Chain Finance / Early Payment Offer Service
 *
 * Enables AP teams to create time-limited early payment offers for qualifying
 * invoices. Suppliers can accept (paying a small discount) to receive funds
 * ahead of the standard due date. SOX-safe: accepted offers are immutable.
 *
 * Design constraints:
 * - Offers become immutable once accepted (isImmutable flag + no updates).
 * - Expired / declined offers cannot be re-activated.
 * - Supplier-visible labels never expose internal GL config refs.
 */

import { eq, and, desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { earlyPaymentOffers } from '@afenda/db';
import type {
  EarlyPaymentOffer,
  EarlyPaymentOfferStatus,
  CreateEarlyPaymentOffer,
  EarlyPaymentOfferListQuery,
  EarlyPaymentOfferListResponse,
} from '@afenda/contracts/portal';

// ─── Port ───────────────────────────────────────────────────────────────────

export interface IEarlyPaymentOfferRepo {
  list(params: {
    supplierId: string;
    status?: EarlyPaymentOfferStatus;
    page: number;
    limit: number;
  }): Promise<{ items: EarlyPaymentOffer[]; total: number }>;

  getById(offerId: string): Promise<EarlyPaymentOffer | null>;

  getByInvoiceId(invoiceId: string): Promise<EarlyPaymentOffer | null>;

  create(
    data: CreateEarlyPaymentOffer & { createdBy: string; tenantId: string }
  ): Promise<EarlyPaymentOffer>;

  accept(offerId: string, acceptedByPortalUserId: string): Promise<EarlyPaymentOffer>;

  decline(offerId: string, reason?: string): Promise<EarlyPaymentOffer>;

  expireStale(now: Date): Promise<number>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export type ScfError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'ALREADY_ACCEPTED'; message: string }
  | { code: 'OFFER_EXPIRED'; message: string }
  | { code: 'OFFER_DECLINED'; message: string }
  | { code: 'DUPLICATE_OFFER'; message: string }
  | { code: 'FORBIDDEN'; message: string };

function toContractOffer(row: typeof earlyPaymentOffers.$inferSelect): EarlyPaymentOffer {
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

/**
 * List early payment offers available to a specific supplier.
 */
export async function listEarlyPaymentOffers(
  repo: IEarlyPaymentOfferRepo,
  supplierId: string,
  query: EarlyPaymentOfferListQuery
): Promise<{ ok: true; value: EarlyPaymentOfferListResponse } | { ok: false; error: ScfError }> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const { items, total } = await repo.list({
    supplierId,
    status: query.status,
    page,
    limit,
  });

  return {
    ok: true,
    value: {
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    },
  };
}

/**
 * Get a single early payment offer by ID (supplier must own it).
 */
export async function getEarlyPaymentOffer(
  repo: IEarlyPaymentOfferRepo,
  offerId: string,
  supplierId: string
): Promise<{ ok: true; value: EarlyPaymentOffer } | { ok: false; error: ScfError }> {
  const offer = await repo.getById(offerId);

  if (!offer) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Early payment offer not found.' } };
  }

  if (offer.supplierId !== supplierId) {
    return { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } };
  }

  return { ok: true, value: offer };
}

/**
 * Supplier accepts an early payment offer.
 * Immutable once accepted — no further state transitions possible.
 */
export async function acceptEarlyPaymentOffer(
  repo: IEarlyPaymentOfferRepo,
  offerId: string,
  supplierId: string,
  acceptedByPortalUserId: string
): Promise<{ ok: true; value: EarlyPaymentOffer } | { ok: false; error: ScfError }> {
  const offer = await repo.getById(offerId);

  if (!offer) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Early payment offer not found.' } };
  }

  if (offer.supplierId !== supplierId) {
    return { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } };
  }

  if (offer.status === 'ACCEPTED') {
    return {
      ok: false,
      error: { code: 'ALREADY_ACCEPTED', message: 'This offer has already been accepted.' },
    };
  }

  if (offer.status === 'DECLINED') {
    return {
      ok: false,
      error: { code: 'OFFER_DECLINED', message: 'This offer was declined and cannot be accepted.' },
    };
  }

  if (offer.status === 'EXPIRED' || new Date(offer.offerExpiresAt) < new Date()) {
    return {
      ok: false,
      error: { code: 'OFFER_EXPIRED', message: 'This offer has expired.' },
    };
  }

  const updated = await repo.accept(offerId, acceptedByPortalUserId);
  return { ok: true, value: updated };
}

/**
 * Supplier declines an early payment offer.
 */
export async function declineEarlyPaymentOffer(
  repo: IEarlyPaymentOfferRepo,
  offerId: string,
  supplierId: string,
  reason?: string
): Promise<{ ok: true; value: EarlyPaymentOffer } | { ok: false; error: ScfError }> {
  const offer = await repo.getById(offerId);

  if (!offer) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Early payment offer not found.' } };
  }

  if (offer.supplierId !== supplierId) {
    return { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } };
  }

  if (offer.status === 'ACCEPTED') {
    return {
      ok: false,
      error: {
        code: 'ALREADY_ACCEPTED',
        message: 'Accepted offers cannot be declined.',
      },
    };
  }

  if (offer.status === 'DECLINED') {
    return { ok: true, value: offer }; // idempotent
  }

  if (offer.status === 'EXPIRED') {
    return {
      ok: false,
      error: { code: 'OFFER_EXPIRED', message: 'Expired offers cannot be declined.' },
    };
  }

  const updated = await repo.decline(offerId, reason);
  return { ok: true, value: updated };
}

/**
 * AP-side: create an early payment offer for a qualifying invoice.
 * Rejects if a PENDING or ACCEPTED offer already exists for the invoice.
 */
export async function createEarlyPaymentOffer(
  repo: IEarlyPaymentOfferRepo,
  data: CreateEarlyPaymentOffer,
  createdBy: string,
  tenantId: string
): Promise<{ ok: true; value: EarlyPaymentOffer } | { ok: false; error: ScfError }> {
  // Idempotency: reject if offer already exists for invoice
  const existing = await repo.getByInvoiceId(data.invoiceId);
  if (existing && (existing.status === 'PENDING' || existing.status === 'ACCEPTED')) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_OFFER',
        message:
          existing.status === 'ACCEPTED'
            ? 'An accepted offer already exists for this invoice.'
            : 'A pending offer already exists for this invoice.',
      },
    };
  }

  const offer = await repo.create({ ...data, createdBy, tenantId });
  return { ok: true, value: offer };
}
