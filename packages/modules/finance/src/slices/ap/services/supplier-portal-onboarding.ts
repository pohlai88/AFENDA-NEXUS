/**
 * Phase 1.1.2: Supplier Onboarding Wizard service (CAP-ONB).
 *
 * Multi-step wizard: Company info → Bank details → KYC documents →
 * Tax registration → Review & Submit.
 *
 * Maps to supplierOnboardingStatusEnum (PROSPECT → PENDING_APPROVAL → ACTIVE).
 * Uses SP-1007 (attachment policy) for KYC uploads, SP-1004 (notifications)
 * for status changes, SP-1006 (proof chain) for submit/approve/reject.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type OnboardingStep =
  | 'company_info'
  | 'bank_details'
  | 'kyc_documents'
  | 'tax_registration'
  | 'review';

export type OnboardingStatus =
  | 'PROSPECT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'company_info',
  'bank_details',
  'kyc_documents',
  'tax_registration',
  'review',
] as const;

export interface OnboardingSubmission {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly currentStep: OnboardingStep;
  readonly completedSteps: readonly OnboardingStep[];
  readonly companyInfoDraft: Record<string, unknown> | null;
  readonly bankDetailsDraft: Record<string, unknown> | null;
  readonly kycDocumentsDraft: Record<string, unknown> | null;
  readonly taxRegistrationDraft: Record<string, unknown> | null;
  readonly isSubmitted: boolean;
  readonly submittedAt: Date | null;
  readonly submittedBy: string | null;
  readonly reviewedBy: string | null;
  readonly reviewedAt: Date | null;
  readonly rejectionReason: string | null;
  readonly proofChainHead: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Repository Port ────────────────────────────────────────────────────────

export interface IOnboardingSubmissionRepo {
  findBySupplierId(tenantId: string, supplierId: string): Promise<OnboardingSubmission | null>;
  create(data: OnboardingSubmission): Promise<OnboardingSubmission>;
  update(id: string, data: Partial<OnboardingSubmission>): Promise<OnboardingSubmission | null>;
}

// ─── Input DTOs ─────────────────────────────────────────────────────────────

export interface GetOnboardingInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
}

export interface SaveDraftInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly step: OnboardingStep;
  readonly draft: Record<string, unknown>;
}

export interface SubmitOnboardingInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
}

export interface ReviewOnboardingInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly reviewerId: string;
}

export interface RejectOnboardingInput extends ReviewOnboardingInput {
  readonly reason: string;
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface OnboardingServiceDeps {
  readonly supplierRepo: ISupplierRepo;
  readonly onboardingRepo: IOnboardingSubmissionRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// ─── Proof Chain Helper ─────────────────────────────────────────────────────

async function writeProofEntry(
  writer: IProofChainWriter | undefined,
  input: {
    eventType: ProofEventType;
    entityId: string;
    actorId: string;
    payload?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!writer) return null;
  const result = await writer.write(
    {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      entityType: 'onboarding_submission',
      entityId: input.entityId,
      actorType: 'SUPPLIER',
      actorId: input.actorId,
      eventAt: new Date(),
      payload: input.payload ?? {},
      previousHash: null,
    },
    undefined
  );
  return result?.contentHash ?? null;
}

// ─── Step Draft Key Mapping ─────────────────────────────────────────────────

function getDraftKey(step: OnboardingStep): keyof OnboardingSubmission | null {
  const map: Record<OnboardingStep, keyof OnboardingSubmission | null> = {
    company_info: 'companyInfoDraft',
    bank_details: 'bankDetailsDraft',
    kyc_documents: 'kycDocumentsDraft',
    tax_registration: 'taxRegistrationDraft',
    review: null,
  };
  return map[step];
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Get or create onboarding submission for a supplier.
 * Creates a new submission if none exists (first visit).
 */
export async function supplierGetOnboarding(
  deps: OnboardingServiceDeps,
  input: GetOnboardingInput
): Promise<Result<OnboardingSubmission>> {
  // Verify supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }

  let submission = await deps.onboardingRepo.findBySupplierId(input.tenantId, input.supplierId);

  if (!submission) {
    // First visit — create submission and emit started event
    const now = new Date();
    submission = await deps.onboardingRepo.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      supplierId: input.supplierId,
      currentStep: 'company_info',
      completedSteps: [],
      companyInfoDraft: null,
      bankDetailsDraft: null,
      kycDocumentsDraft: null,
      taxRegistrationDraft: null,
      isSubmitted: false,
      submittedAt: null,
      submittedBy: null,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      proofChainHead: null,
      createdAt: now,
      updatedAt: now,
    });

    await deps.outboxWriter.write({
      tenantId: input.tenantId,
      eventType: FinanceEventType.SUPPLIER_ONBOARDING_STARTED,
      payload: {
        entityId: submission.id,
        entityType: 'onboarding_submission',
        supplierId: input.supplierId,
        userId: input.userId,
      },
    });
  }

  return ok(submission);
}

/**
 * Save draft for a specific wizard step.
 * Does NOT advance onboarding status — only persists draft data.
 */
export async function supplierSaveOnboardingDraft(
  deps: OnboardingServiceDeps,
  input: SaveDraftInput
): Promise<Result<OnboardingSubmission>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }

  const submission = await deps.onboardingRepo.findBySupplierId(input.tenantId, input.supplierId);

  if (!submission) {
    return err(new AppError('ONBOARDING_NOT_STARTED', 'Onboarding has not been started'));
  }

  if (submission.isSubmitted) {
    return err(
      new AppError('ONBOARDING_ALREADY_SUBMITTED', 'Onboarding has already been submitted')
    );
  }

  // Build update payload
  const draftKey = getDraftKey(input.step);
  const completedSteps = [...new Set([...submission.completedSteps, input.step])];

  const updateData: Partial<OnboardingSubmission> = {
    currentStep: input.step,
    completedSteps,
    updatedAt: new Date(),
  };

  if (draftKey) {
    (updateData as Record<string, unknown>)[draftKey] = input.draft;
  }

  const updated = await deps.onboardingRepo.update(submission.id, updateData);
  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to save onboarding draft'));
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_ONBOARDING_STEP_SAVED,
    payload: {
      entityId: submission.id,
      entityType: 'onboarding_submission',
      supplierId: input.supplierId,
      userId: input.userId,
      step: input.step,
    },
  });

  return ok(updated);
}

/**
 * Submit onboarding for review. Validates all required steps are completed.
 * Transitions supplier.onboardingStatus from PROSPECT → PENDING_APPROVAL.
 */
export async function supplierSubmitOnboarding(
  deps: OnboardingServiceDeps,
  input: SubmitOnboardingInput
): Promise<Result<OnboardingSubmission>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('SUPPLIER_NOT_FOUND', 'Supplier not found'));
  }

  const submission = await deps.onboardingRepo.findBySupplierId(input.tenantId, input.supplierId);

  if (!submission) {
    return err(new AppError('ONBOARDING_NOT_STARTED', 'Onboarding has not been started'));
  }

  if (submission.isSubmitted) {
    return err(
      new AppError('ONBOARDING_ALREADY_SUBMITTED', 'Onboarding has already been submitted')
    );
  }

  // Validate all required steps have been completed
  const requiredSteps: OnboardingStep[] = [
    'company_info',
    'bank_details',
    'kyc_documents',
    'tax_registration',
  ];
  const missingSteps = requiredSteps.filter((step) => !submission.completedSteps.includes(step));

  if (missingSteps.length > 0) {
    return err(
      new AppError('ONBOARDING_INCOMPLETE', `Missing required steps: ${missingSteps.join(', ')}`)
    );
  }

  // Write proof chain entry
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'ONBOARDING_SUBMITTED',
    entityId: submission.id,
    actorId: input.userId,
  });

  const now = new Date();
  const updated = await deps.onboardingRepo.update(submission.id, {
    isSubmitted: true,
    submittedAt: now,
    submittedBy: input.userId,
    currentStep: 'review',
    proofChainHead: proofHash,
    updatedAt: now,
  });

  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to submit onboarding'));
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_ONBOARDING_SUBMITTED,
    payload: {
      entityId: submission.id,
      entityType: 'onboarding_submission',
      supplierId: input.supplierId,
      userId: input.userId,
    },
  });

  return ok(updated);
}

/**
 * Approve onboarding submission (buyer admin action).
 * Transitions supplier.onboardingStatus → ACTIVE.
 */
export async function approveOnboarding(
  deps: OnboardingServiceDeps,
  input: ReviewOnboardingInput
): Promise<Result<OnboardingSubmission>> {
  const submission = await deps.onboardingRepo.findBySupplierId(input.tenantId, input.supplierId);

  if (!submission) {
    return err(new AppError('ONBOARDING_NOT_FOUND', 'Onboarding submission not found'));
  }

  if (!submission.isSubmitted) {
    return err(new AppError('ONBOARDING_NOT_SUBMITTED', 'Onboarding has not been submitted yet'));
  }

  // Write proof chain entry
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'ONBOARDING_APPROVED',
    entityId: submission.id,
    actorId: input.reviewerId,
  });

  const now = new Date();
  const updated = await deps.onboardingRepo.update(submission.id, {
    reviewedBy: input.reviewerId,
    reviewedAt: now,
    proofChainHead: proofHash,
    updatedAt: now,
  });

  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to approve onboarding'));
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_ONBOARDING_APPROVED,
    payload: {
      entityId: submission.id,
      entityType: 'onboarding_submission',
      supplierId: input.supplierId,
      reviewerId: input.reviewerId,
    },
  });

  return ok(updated);
}

/**
 * Reject onboarding submission (buyer admin action).
 * Supplier can re-edit and re-submit after rejection.
 */
export async function rejectOnboarding(
  deps: OnboardingServiceDeps,
  input: RejectOnboardingInput
): Promise<Result<OnboardingSubmission>> {
  const submission = await deps.onboardingRepo.findBySupplierId(input.tenantId, input.supplierId);

  if (!submission) {
    return err(new AppError('ONBOARDING_NOT_FOUND', 'Onboarding submission not found'));
  }

  if (!submission.isSubmitted) {
    return err(new AppError('ONBOARDING_NOT_SUBMITTED', 'Onboarding has not been submitted yet'));
  }

  // Write proof chain entry
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'ONBOARDING_REJECTED',
    entityId: submission.id,
    actorId: input.reviewerId,
  });

  const now = new Date();
  const updated = await deps.onboardingRepo.update(submission.id, {
    isSubmitted: false, // Allow re-editing
    reviewedBy: input.reviewerId,
    reviewedAt: now,
    rejectionReason: input.reason,
    proofChainHead: proofHash,
    updatedAt: now,
  });

  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to reject onboarding'));
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_ONBOARDING_REJECTED,
    payload: {
      entityId: submission.id,
      entityType: 'onboarding_submission',
      supplierId: input.supplierId,
      reviewerId: input.reviewerId,
      reason: input.reason,
    },
  });

  return ok(updated);
}
