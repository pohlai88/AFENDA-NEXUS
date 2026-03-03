import { and, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierOnboardingSubmissions } from '@afenda/db';
import type {
  OnboardingSubmission,
  IOnboardingSubmissionRepo,
  OnboardingStep,
} from '../services/supplier-portal-onboarding.js';

type SubmissionRow = typeof supplierOnboardingSubmissions.$inferSelect;

/**
 * Phase 1.1.2: Onboarding Submission Repository (Drizzle implementation)
 * Tracks multi-step wizard state for supplier onboarding
 */

function mapToDomain(row: SubmissionRow): OnboardingSubmission {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    currentStep: row.currentStep as OnboardingStep,
    completedSteps: (row.completedSteps ?? []) as OnboardingStep[],
    companyInfoDraft: row.companyInfoDraft as Record<string, unknown> | null,
    bankDetailsDraft: row.bankDetailsDraft as Record<string, unknown> | null,
    kycDocumentsDraft: row.kycDocumentsDraft as Record<string, unknown> | null,
    taxRegistrationDraft: row.taxRegistrationDraft as Record<string, unknown> | null,
    isSubmitted: row.isSubmitted,
    submittedAt: row.submittedAt,
    submittedBy: row.submittedBy,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    rejectionReason: row.rejectionReason,
    proofChainHead: row.proofChainHead,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleOnboardingSubmissionRepo implements IOnboardingSubmissionRepo {
  constructor(private readonly tx: TenantTx) {}

  async findBySupplierId(
    tenantId: string,
    supplierId: string
  ): Promise<OnboardingSubmission | null> {
    const row = await this.tx.query.supplierOnboardingSubmissions.findFirst({
      where: and(
        eq(supplierOnboardingSubmissions.tenantId, tenantId),
        eq(supplierOnboardingSubmissions.supplierId, supplierId)
      ),
    });

    return row ? mapToDomain(row) : null;
  }

  async create(data: OnboardingSubmission): Promise<OnboardingSubmission> {
    const [row] = await this.tx
      .insert(supplierOnboardingSubmissions)
      .values({
        id: data.id,
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        currentStep: data.currentStep,
        completedSteps:
          data.completedSteps as (typeof supplierOnboardingSubmissions.$inferInsert)['completedSteps'],
        companyInfoDraft: data.companyInfoDraft as Record<string, unknown>,
        bankDetailsDraft: data.bankDetailsDraft as Record<string, unknown>,
        kycDocumentsDraft: data.kycDocumentsDraft as Record<string, unknown>,
        taxRegistrationDraft: data.taxRegistrationDraft as Record<string, unknown>,
        isSubmitted: data.isSubmitted,
        submittedAt: data.submittedAt,
        submittedBy: data.submittedBy,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt,
        rejectionReason: data.rejectionReason,
        proofChainHead: data.proofChainHead,
      })
      .returning();

    if (!row) throw new Error('Failed to create onboarding submission');
    return mapToDomain(row);
  }

  async update(
    id: string,
    data: Partial<OnboardingSubmission>
  ): Promise<OnboardingSubmission | null> {
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

    if (data.currentStep !== undefined) updatePayload.currentStep = data.currentStep;
    if (data.completedSteps !== undefined) updatePayload.completedSteps = data.completedSteps;
    if (data.companyInfoDraft !== undefined) updatePayload.companyInfoDraft = data.companyInfoDraft;
    if (data.bankDetailsDraft !== undefined) updatePayload.bankDetailsDraft = data.bankDetailsDraft;
    if (data.kycDocumentsDraft !== undefined)
      updatePayload.kycDocumentsDraft = data.kycDocumentsDraft;
    if (data.taxRegistrationDraft !== undefined)
      updatePayload.taxRegistrationDraft = data.taxRegistrationDraft;
    if (data.isSubmitted !== undefined) updatePayload.isSubmitted = data.isSubmitted;
    if (data.submittedAt !== undefined) updatePayload.submittedAt = data.submittedAt;
    if (data.submittedBy !== undefined) updatePayload.submittedBy = data.submittedBy;
    if (data.reviewedBy !== undefined) updatePayload.reviewedBy = data.reviewedBy;
    if (data.reviewedAt !== undefined) updatePayload.reviewedAt = data.reviewedAt;
    if (data.rejectionReason !== undefined) updatePayload.rejectionReason = data.rejectionReason;
    if (data.proofChainHead !== undefined) updatePayload.proofChainHead = data.proofChainHead;

    const [row] = await this.tx
      .update(supplierOnboardingSubmissions)
      .set(updatePayload)
      .where(eq(supplierOnboardingSubmissions.id, id))
      .returning();

    return row ? mapToDomain(row) : null;
  }
}
