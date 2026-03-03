/**
 * SP-5011: CAP-PAY-ETA — Real-Time Payment Tracking Service (Phase 1.4.1).
 *
 * Append-only payment status fact model.
 * No UPDATEs to existing fact rows — every status change = new row.
 * Source precedence enforced: BANK_FILE > ERP > MANUAL_OVERRIDE (SP-4002).
 *
 * Supplier-visible labels come from Status Dictionary (SP-1003).
 * Raw hold reasons (especially FRAUD_SUSPICION) must never reach supplier UI
 * — gate SP-8025 enforces this at CI level.
 *
 * §7.2 · §5 Phase 1.4.1 · supplier-portal2.0-V2.md
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, ValidationError } from '@afenda/core';
import {
  type PaymentStage,
  type PaymentSource,
  hasHigherPrecedence,
  isValidPaymentTransition,
} from '@afenda/supplier-kernel';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type HoldReason =
  | 'APPROVAL_PENDING'
  | 'COMPLIANCE_EXPIRED'
  | 'MISMATCH_3WAY'
  | 'BANK_REJECTED'
  | 'TAX_VALIDATION_FAILED'
  | 'PAYMENT_RUN_NOT_SCHEDULED'
  | 'MANUAL_HOLD'
  | 'FRAUD_SUSPICION';

export type PaymentActorType = 'SUPPLIER' | 'BUYER' | 'SYSTEM';

export interface PaymentStatusFact {
  readonly id: string;
  readonly tenantId: string;
  readonly paymentRunId: string;
  readonly invoiceId: string | null;
  readonly supplierId: string;
  readonly stage: PaymentStage;
  readonly previousStage: PaymentStage | null;
  readonly eventAt: Date;
  readonly source: PaymentSource;
  readonly sourcePrecedence: number;
  readonly reference: string | null;
  readonly holdReason: HoldReason | null;
  /** Supplier-safe label — the only label surfaced in portal UI. */
  readonly supplierVisibleLabel: string | null;
  /** Deep-link for the "Why am I not paid?" panel next action. */
  readonly nextActionHref: string | null;
  /** Internal note — not shown to supplier. */
  readonly note: string | null;
  readonly linkedCaseId: string | null;
  readonly isUnderReview: boolean;
  readonly holdDurationDays: number | null;
  readonly createdBy: string;
  readonly createdByType: PaymentActorType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Lightweight timeline item for portal list rendering. */
export interface PaymentStatusTimelineItem {
  readonly id: string;
  readonly stage: PaymentStage;
  readonly previousStage: PaymentStage | null;
  readonly eventAt: Date;
  readonly source: PaymentSource;
  readonly supplierVisibleLabel: string | null;
  readonly nextActionHref: string | null;
  readonly linkedCaseId: string | null;
  readonly isOnHold: boolean;
  readonly holdDurationDays: number | null;
}

// ─── Supplier-Safe Label Map (SP-1003) ────────────────────────────────────────

/**
 * Maps internal hold reasons to the ONLY labels suppliers ever see.
 * FRAUD_SUSPICION maps to "Verification pending" — never expose internally.
 * @see supplier-portal2.0-V2.md §5 Phase 1.4.1 hold reason taxonomy
 */
export const HOLD_REASON_SUPPLIER_LABELS: Record<HoldReason, string> = {
  APPROVAL_PENDING: 'Awaiting internal approval',
  COMPLIANCE_EXPIRED: 'Compliance document expired',
  MISMATCH_3WAY: 'Invoice under review',
  BANK_REJECTED: 'Bank processing issue',
  TAX_VALIDATION_FAILED: 'Tax registration issue',
  PAYMENT_RUN_NOT_SCHEDULED: 'Not yet scheduled for payment',
  MANUAL_HOLD: 'Under review',
  FRAUD_SUSPICION: 'Verification pending', // ⚠ NEVER expose the internal code to supplier
} as const;

/** Stage labels for supplier-visible status display. */
export const PAYMENT_STAGE_SUPPLIER_LABELS: Record<PaymentStage, string> = {
  SCHEDULED: 'Scheduled for payment',
  APPROVED: 'Approved for payment',
  PROCESSING: 'Payment processing',
  SENT: 'Payment sent',
  CLEARED: 'Payment cleared',
  ON_HOLD: 'Payment on hold',
  REJECTED: 'Payment rejected',
} as const;

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface ListPaymentStatusInput {
  readonly tenantId: string;
  readonly paymentRunId: string;
  readonly invoiceId?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface SupplierPaymentSummary {
  readonly paymentRunId: string;
  readonly currentStage: PaymentStage;
  readonly currentSupplierLabel: string;
  readonly nextActionHref: string | null;
  readonly isOnHold: boolean;
  readonly holdDurationDays: number | null;
  readonly lastUpdatedAt: Date;
}

export interface IPaymentStatusFactRepo {
  /**
   * Get the full status timeline for a payment run (append-only history).
   * Ordered by eventAt ASC (oldest first → chronological timeline).
   */
  listTimeline(input: ListPaymentStatusInput): Promise<{
    items: PaymentStatusFact[];
    total: number;
  }>;

  /**
   * Get the latest fact (current status) for a payment run.
   */
  getLatest(tenantId: string, paymentRunId: string): Promise<PaymentStatusFact | null>;

  /**
   * Get aggregated current status for multiple payment runs (dashboard view).
   */
  getLatestBatch(
    tenantId: string,
    paymentRunIds: string[]
  ): Promise<Map<string, PaymentStatusFact>>;

  /**
   * Append a new status fact. Never updates existing rows.
   */
  appendFact(fact: NewPaymentStatusFactInput): Promise<PaymentStatusFact>;

  /**
   * Get invoice-level payment status (when a payment run covers multiple invoices).
   */
  getInvoiceCurrentStatus(tenantId: string, invoiceId: string): Promise<PaymentStatusFact | null>;

  /**
   * Get how many days the current ON_HOLD fact has existed.
   */
  getHoldDuration(tenantId: string, paymentRunId: string): Promise<number | null>;
}

export interface NewPaymentStatusFactInput {
  readonly id: string;
  readonly tenantId: string;
  readonly paymentRunId: string;
  readonly invoiceId: string | null;
  readonly supplierId: string;
  readonly stage: PaymentStage;
  readonly previousStage: PaymentStage | null;
  readonly eventAt: Date;
  readonly source: PaymentSource;
  readonly sourcePrecedence: number;
  readonly reference: string | null;
  readonly holdReason: HoldReason | null;
  readonly supplierVisibleLabel: string | null;
  readonly nextActionHref: string | null;
  readonly note: string | null;
  readonly linkedCaseId: string | null;
  readonly isUnderReview: boolean;
  readonly holdDurationDays: number | null;
  readonly createdBy: string;
  readonly createdByType: PaymentActorType;
  readonly proofPayloadCanonical: Record<string, unknown> | null;
}

// ─── Deps & Inputs ────────────────────────────────────────────────────────────

export interface PaymentTrackingDeps {
  readonly paymentStatusFactRepo: IPaymentStatusFactRepo;
}

export interface GetPaymentTimelineInput {
  readonly tenantId: string;
  readonly paymentRunId: string;
  readonly invoiceId?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface GetCurrentPaymentStatusInput {
  readonly tenantId: string;
  readonly paymentRunId: string;
}

export interface GetInvoicePaymentStatusInput {
  readonly tenantId: string;
  readonly invoiceId: string;
}

export interface RecordPaymentStatusInput {
  readonly id: string;
  readonly tenantId: string;
  readonly paymentRunId: string;
  readonly invoiceId: string | null;
  readonly supplierId: string;
  readonly newStage: PaymentStage;
  readonly source: PaymentSource;
  readonly reference?: string | null;
  readonly holdReason?: HoldReason | null;
  readonly nextActionHref?: string | null;
  readonly note?: string | null;
  readonly linkedCaseId?: string | null;
  readonly eventAt?: Date;
  readonly createdBy: string;
  readonly createdByType?: PaymentActorType;
}

// ─── Source Precedence Map ────────────────────────────────────────────────────

const SOURCE_PRECEDENCE_MAP: Record<PaymentSource, number> = {
  BANK_FILE: 3,
  ERP: 2,
  MANUAL_OVERRIDE: 1,
};

// ─── Domain Functions ─────────────────────────────────────────────────────────

/**
 * SP-5011-01: Get full payment status timeline for a payment run.
 * Returns chronological list of all fact entries for supplier-facing display.
 */
export async function getPaymentStatusTimeline(
  input: GetPaymentTimelineInput,
  deps: PaymentTrackingDeps
): Promise<
  Result<{
    items: PaymentStatusTimelineItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    currentStage: PaymentStage | null;
    supplierVisibleLabel: string | null;
  }>
> {
  try {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(50, Math.max(1, input.limit ?? 20));

    const { items, total } = await deps.paymentStatusFactRepo.listTimeline({
      tenantId: input.tenantId,
      paymentRunId: input.paymentRunId,
      invoiceId: input.invoiceId,
      page,
      limit,
    });

    const timeline: PaymentStatusTimelineItem[] = items.map((fact) => ({
      id: fact.id,
      stage: fact.stage,
      previousStage: fact.previousStage,
      eventAt: fact.eventAt,
      source: fact.source,
      supplierVisibleLabel: fact.supplierVisibleLabel ?? PAYMENT_STAGE_SUPPLIER_LABELS[fact.stage],
      nextActionHref: fact.nextActionHref,
      linkedCaseId: fact.linkedCaseId,
      isOnHold: fact.stage === 'ON_HOLD',
      holdDurationDays: fact.holdDurationDays,
    }));

    // Most recent fact = current status
    const latestFact = items.length > 0 ? items[items.length - 1] : null;

    return ok({
      items: timeline,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      currentStage: latestFact?.stage ?? null,
      supplierVisibleLabel: latestFact
        ? (latestFact.supplierVisibleLabel ?? PAYMENT_STAGE_SUPPLIER_LABELS[latestFact.stage])
        : null,
    });
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to retrieve payment status timeline', e));
  }
}

/**
 * SP-5011-02: Get current payment status for a specific payment run.
 * Returns the latest fact entry with supplier-safe label.
 */
export async function getCurrentPaymentStatus(
  input: GetCurrentPaymentStatusInput,
  deps: PaymentTrackingDeps
): Promise<
  Result<{
    stage: PaymentStage;
    supplierVisibleLabel: string;
    nextActionHref: string | null;
    isOnHold: boolean;
    holdDurationDays: number | null;
    linkedCaseId: string | null;
    lastUpdatedAt: Date;
  } | null>
> {
  try {
    const latest = await deps.paymentStatusFactRepo.getLatest(input.tenantId, input.paymentRunId);

    if (!latest) return ok(null);

    return ok({
      stage: latest.stage,
      supplierVisibleLabel:
        latest.supplierVisibleLabel ?? PAYMENT_STAGE_SUPPLIER_LABELS[latest.stage],
      nextActionHref: latest.nextActionHref,
      isOnHold: latest.stage === 'ON_HOLD',
      holdDurationDays: latest.holdDurationDays,
      linkedCaseId: latest.linkedCaseId,
      lastUpdatedAt: latest.updatedAt,
    });
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to get current payment status', e));
  }
}

/**
 * SP-5011-03: Get invoice-level payment status.
 * For invoice detail pages showing embedded payment tracking.
 */
export async function getInvoicePaymentStatus(
  input: GetInvoicePaymentStatusInput,
  deps: PaymentTrackingDeps
): Promise<
  Result<{
    stage: PaymentStage;
    supplierVisibleLabel: string;
    nextActionHref: string | null;
    isOnHold: boolean;
    holdDurationDays: number | null;
  } | null>
> {
  try {
    const latest = await deps.paymentStatusFactRepo.getInvoiceCurrentStatus(
      input.tenantId,
      input.invoiceId
    );

    if (!latest) return ok(null);

    return ok({
      stage: latest.stage,
      supplierVisibleLabel:
        latest.supplierVisibleLabel ?? PAYMENT_STAGE_SUPPLIER_LABELS[latest.stage],
      nextActionHref: latest.nextActionHref,
      isOnHold: latest.stage === 'ON_HOLD',
      holdDurationDays: latest.holdDurationDays,
    });
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to get invoice payment status', e));
  }
}

/**
 * SP-5011-04: Record a new payment status event (internal — AP team / bank file parser).
 *
 * Enforces:
 * 1. State machine: no impossible stage transitions (SP-4002)
 * 2. Source precedence: rejects lower-precedence updates when current stage set by higher source
 * 3. Supplier-safe label mapping (SP-1003): FRAUD_SUSPICION → "Verification pending"
 */
export async function recordPaymentStatus(
  input: RecordPaymentStatusInput,
  deps: PaymentTrackingDeps
): Promise<Result<PaymentStatusFact>> {
  try {
    // Get current status for transition validation
    const current = await deps.paymentStatusFactRepo.getLatest(input.tenantId, input.paymentRunId);

    // Validate state machine transition
    if (current) {
      const transitionOk = isValidPaymentTransition(current.stage, input.newStage);
      if (!transitionOk) {
        return err(
          new ValidationError(
            `Invalid payment stage transition: ${current.stage} → ${input.newStage}`
          )
        );
      }

      // Enforce source precedence — reject lower-precedence overrides
      if (!hasHigherPrecedence(input.source, current.source)) {
        // Allow same-stage updates from same source (idempotent bank file re-processing)
        if (current.stage !== input.newStage) {
          return err(
            new ValidationError(`Source ${input.source} cannot override ${current.source} update`)
          );
        }
      }
    }

    // Validate: hold_reason required when stage = ON_HOLD
    if (input.newStage === 'ON_HOLD' && !input.holdReason) {
      return err(new ValidationError('hold_reason is required when stage is ON_HOLD'));
    }

    const holdReason = input.holdReason ?? null;

    // Map to supplier-safe label (SP-1003)
    let supplierVisibleLabel: string;
    if (input.newStage === 'ON_HOLD' && holdReason) {
      supplierVisibleLabel = HOLD_REASON_SUPPLIER_LABELS[holdReason];
    } else {
      supplierVisibleLabel = PAYMENT_STAGE_SUPPLIER_LABELS[input.newStage];
    }

    // Compute hold duration if transitioning into ON_HOLD
    let holdDurationDays: number | null = null;
    if (input.newStage === 'ON_HOLD' && current?.stage === 'ON_HOLD') {
      holdDurationDays = await deps.paymentStatusFactRepo.getHoldDuration(
        input.tenantId,
        input.paymentRunId
      );
    }

    const fact = await deps.paymentStatusFactRepo.appendFact({
      id: input.id,
      tenantId: input.tenantId,
      paymentRunId: input.paymentRunId,
      invoiceId: input.invoiceId,
      supplierId: input.supplierId,
      stage: input.newStage,
      previousStage: current?.stage ?? null,
      eventAt: input.eventAt ?? new Date(),
      source: input.source,
      sourcePrecedence: SOURCE_PRECEDENCE_MAP[input.source],
      reference: input.reference ?? null,
      holdReason,
      supplierVisibleLabel,
      nextActionHref: input.nextActionHref ?? null,
      note: input.note ?? null,
      linkedCaseId: input.linkedCaseId ?? null,
      isUnderReview: Boolean(input.linkedCaseId),
      holdDurationDays,
      createdBy: input.createdBy,
      createdByType: input.createdByType ?? 'SYSTEM',
      proofPayloadCanonical: null, // proof chain writer adds this via SP-1006
    });

    return ok(fact);
  } catch (e) {
    if (e instanceof ValidationError) return err(e);
    return err(new AppError('INTERNAL_ERROR', 'Failed to record payment status', e));
  }
}
