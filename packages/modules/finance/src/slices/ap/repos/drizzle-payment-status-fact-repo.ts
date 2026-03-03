/**
 * SP-5011: CAP-PAY-ETA — Payment Status Fact Repository (Drizzle).
 *
 * Implements IPaymentStatusFactRepo for erp.supplier_payment_status_fact.
 * Append-only — never updates existing rows.
 */
import { and, asc, count, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierPaymentStatusFacts } from '@afenda/db';
import type {
  IPaymentStatusFactRepo,
  ListPaymentStatusInput,
  NewPaymentStatusFactInput,
  PaymentStatusFact,
} from '../services/supplier-portal-payment-tracking.js';
import type { PaymentStage, PaymentSource } from '@afenda/supplier-kernel';
import type { HoldReason, PaymentActorType } from '../services/supplier-portal-payment-tracking.js';

type FactRow = typeof supplierPaymentStatusFacts.$inferSelect;

function mapToDomain(row: FactRow): PaymentStatusFact {
  return {
    id: row.id,
    tenantId: row.tenantId,
    paymentRunId: row.paymentRunId,
    invoiceId: row.invoiceId,
    supplierId: row.supplierId,
    stage: row.stage as PaymentStage,
    previousStage: row.previousStage as PaymentStage | null,
    eventAt: row.eventAt,
    source: row.source as PaymentSource,
    sourcePrecedence: row.sourcePrecedence,
    reference: row.reference,
    holdReason: row.holdReason as HoldReason | null,
    supplierVisibleLabel: row.supplierVisibleLabel,
    nextActionHref: row.nextActionHref,
    note: row.note,
    linkedCaseId: row.linkedCaseId,
    isUnderReview: row.isUnderReview,
    holdDurationDays: row.holdDurationDays,
    createdBy: row.createdBy,
    createdByType: row.createdByType as PaymentActorType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePaymentStatusFactRepo implements IPaymentStatusFactRepo {
  constructor(private readonly tx: TenantTx) {}

  async listTimeline(
    input: ListPaymentStatusInput
  ): Promise<{ items: PaymentStatusFact[]; total: number }> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(supplierPaymentStatusFacts.tenantId, input.tenantId),
      eq(supplierPaymentStatusFacts.paymentRunId, input.paymentRunId),
    ];
    if (input.invoiceId) {
      conditions.push(eq(supplierPaymentStatusFacts.invoiceId, input.invoiceId));
    }

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      this.tx
        .select()
        .from(supplierPaymentStatusFacts)
        .where(where)
        .orderBy(asc(supplierPaymentStatusFacts.eventAt))
        .limit(limit)
        .offset(offset),
      this.tx.select({ value: count() }).from(supplierPaymentStatusFacts).where(where),
    ]);

    return { items: rows.map(mapToDomain), total: Number(countRow?.value ?? 0) };
  }

  async getLatest(tenantId: string, paymentRunId: string): Promise<PaymentStatusFact | null> {
    const row = await this.tx
      .select()
      .from(supplierPaymentStatusFacts)
      .where(
        and(
          eq(supplierPaymentStatusFacts.tenantId, tenantId),
          eq(supplierPaymentStatusFacts.paymentRunId, paymentRunId)
        )
      )
      .orderBy(desc(supplierPaymentStatusFacts.eventAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return row ? mapToDomain(row) : null;
  }

  async getLatestBatch(
    tenantId: string,
    paymentRunIds: string[]
  ): Promise<Map<string, PaymentStatusFact>> {
    if (paymentRunIds.length === 0) return new Map();

    // For each run ID, we want the latest fact.
    // Use a subquery approach: get all facts for the run IDs, then pick latest per run in JS.
    const rows = await this.tx
      .select()
      .from(supplierPaymentStatusFacts)
      .where(
        and(
          eq(supplierPaymentStatusFacts.tenantId, tenantId),
          inArray(supplierPaymentStatusFacts.paymentRunId, paymentRunIds)
        )
      )
      .orderBy(asc(supplierPaymentStatusFacts.eventAt));

    // Pick latest per paymentRunId (last row in ASC order is the latest)
    const latest = new Map<string, PaymentStatusFact>();
    for (const row of rows) {
      latest.set(row.paymentRunId, mapToDomain(row));
    }
    return latest;
  }

  async appendFact(input: NewPaymentStatusFactInput): Promise<PaymentStatusFact> {
    const [row] = await this.tx
      .insert(supplierPaymentStatusFacts)
      .values({
        id: input.id,
        tenantId: input.tenantId,
        paymentRunId: input.paymentRunId,
        invoiceId: input.invoiceId,
        supplierId: input.supplierId,
        stage: input.stage as any,
        previousStage: input.previousStage as any,
        eventAt: input.eventAt,
        source: input.source as any,
        sourcePrecedence: input.sourcePrecedence,
        reference: input.reference,
        holdReason: input.holdReason as any,
        supplierVisibleLabel: input.supplierVisibleLabel,
        nextActionHref: input.nextActionHref,
        note: input.note,
        linkedCaseId: input.linkedCaseId,
        isUnderReview: input.isUnderReview,
        holdDurationDays: input.holdDurationDays,
        createdBy: input.createdBy,
        createdByType: input.createdByType as any,
        proofPayloadCanonical: input.proofPayloadCanonical as any,
      })
      .returning();

    return mapToDomain(row!);
  }

  async getInvoiceCurrentStatus(
    tenantId: string,
    invoiceId: string
  ): Promise<PaymentStatusFact | null> {
    const row = await this.tx
      .select()
      .from(supplierPaymentStatusFacts)
      .where(
        and(
          eq(supplierPaymentStatusFacts.tenantId, tenantId),
          eq(supplierPaymentStatusFacts.invoiceId, invoiceId)
        )
      )
      .orderBy(desc(supplierPaymentStatusFacts.eventAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return row ? mapToDomain(row) : null;
  }

  async getHoldDuration(tenantId: string, paymentRunId: string): Promise<number | null> {
    // Find the oldest ON_HOLD fact for this payment run
    const row = await this.tx
      .select()
      .from(supplierPaymentStatusFacts)
      .where(
        and(
          eq(supplierPaymentStatusFacts.tenantId, tenantId),
          eq(supplierPaymentStatusFacts.paymentRunId, paymentRunId),
          eq(supplierPaymentStatusFacts.stage, 'ON_HOLD' as any)
        )
      )
      .orderBy(asc(supplierPaymentStatusFacts.eventAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!row) return null;

    const holdStart = row.eventAt;
    const now = new Date();
    const diffMs = now.getTime() - holdStart.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
