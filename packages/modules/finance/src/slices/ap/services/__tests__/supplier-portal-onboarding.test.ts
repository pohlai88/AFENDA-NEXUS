/**
 * Phase 1.1.2: Supplier Onboarding Wizard service unit tests.
 *
 * Tests all 5 service functions:
 *   1. supplierGetOnboarding — get or create
 *   2. supplierSaveOnboardingDraft — save step drafts
 *   3. supplierSubmitOnboarding — submit for review
 *   4. approveOnboarding — buyer admin approve
 *   5. rejectOnboarding — buyer admin reject
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  supplierGetOnboarding,
  supplierSaveOnboardingDraft,
  supplierSubmitOnboarding,
  approveOnboarding,
  rejectOnboarding,
  type OnboardingServiceDeps,
  type OnboardingSubmission,
  type IOnboardingSubmissionRepo,
} from './supplier-portal-onboarding';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';
const REVIEWER_ID = '00000000-0000-0000-0000-000000000004';

function makeSubmission(overrides: Partial<OnboardingSubmission> = {}): OnboardingSubmission {
  return {
    id: '00000000-0000-0000-0000-000000000010',
    tenantId: TENANT_ID,
    supplierId: SUPPLIER_ID,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<OnboardingServiceDeps> = {}): OnboardingServiceDeps {
  const onboardingRepo: IOnboardingSubmissionRepo = {
    findBySupplierId: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (data) => data),
    update: vi.fn().mockImplementation(async (_id, data) => ({
      ...makeSubmission(),
      ...data,
    })),
  };

  return {
    supplierRepo: {
      findById: vi
        .fn()
        .mockResolvedValue({ ok: true, value: { id: SUPPLIER_ID, tenantId: TENANT_ID } }),
    } as any,
    onboardingRepo,
    outboxWriter: {
      write: vi.fn().mockResolvedValue(undefined),
    } as any,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('supplierGetOnboarding', () => {
  it('creates a new submission on first visit', async () => {
    const deps = makeDeps();
    const result = await supplierGetOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.supplierId).toBe(SUPPLIER_ID);
      expect(result.value.currentStep).toBe('company_info');
      expect(result.value.isSubmitted).toBe(false);
    }
    expect(deps.onboardingRepo.create).toHaveBeenCalled();
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_ONBOARDING_STARTED',
      })
    );
  });

  it('returns existing submission without creating', async () => {
    const existing = makeSubmission({ currentStep: 'bank_details' });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierGetOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentStep).toBe('bank_details');
    }
    expect(deps.onboardingRepo.create).not.toHaveBeenCalled();
  });

  it('returns error for non-existent supplier', async () => {
    const deps = makeDeps();
    (deps.supplierRepo.findById as any).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });

    const result = await supplierGetOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SUPPLIER_NOT_FOUND');
    }
  });

  it('returns error for tenant mismatch', async () => {
    const deps = makeDeps();
    (deps.supplierRepo.findById as any).mockResolvedValue({
      ok: true,
      value: { id: SUPPLIER_ID, tenantId: 'different-tenant' },
    });

    const result = await supplierGetOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
  });
});

describe('supplierSaveOnboardingDraft', () => {
  it('saves company info draft', async () => {
    const existing = makeSubmission();
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'company_info',
      draft: { tradingName: 'Acme Corp', registrationNumber: 'RC-123' },
    });

    expect(result.ok).toBe(true);
    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        currentStep: 'company_info',
        companyInfoDraft: { tradingName: 'Acme Corp', registrationNumber: 'RC-123' },
      })
    );
  });

  it('saves bank details draft', async () => {
    const existing = makeSubmission({ completedSteps: ['company_info'] });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'bank_details',
      draft: { bankName: 'HSBC', accountNumber: '123456' },
    });

    expect(result.ok).toBe(true);
    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        currentStep: 'bank_details',
        bankDetailsDraft: { bankName: 'HSBC', accountNumber: '123456' },
        completedSteps: ['company_info', 'bank_details'],
      })
    );
  });

  it('emits STEP_SAVED event', async () => {
    const existing = makeSubmission();
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'company_info',
      draft: {},
    });

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_ONBOARDING_STEP_SAVED',
        payload: expect.objectContaining({ step: 'company_info' }),
      })
    );
  });

  it('rejects save if onboarding not started', async () => {
    const deps = makeDeps();
    // findBySupplierId returns null (default)

    const result = await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'company_info',
      draft: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_NOT_STARTED');
  });

  it('rejects save if already submitted', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'company_info',
      draft: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_ALREADY_SUBMITTED');
  });

  it('accumulates completed steps without duplicates', async () => {
    const existing = makeSubmission({ completedSteps: ['company_info'] });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'company_info', // same step again
      draft: { tradingName: 'Updated' },
    });

    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        completedSteps: ['company_info'], // no duplicate
      })
    );
  });
});

describe('supplierSubmitOnboarding', () => {
  it('submits when all required steps are complete', async () => {
    const existing = makeSubmission({
      completedSteps: ['company_info', 'bank_details', 'kyc_documents', 'tax_registration'],
      companyInfoDraft: { tradingName: 'Acme' },
      bankDetailsDraft: { bankName: 'HSBC' },
      kycDocumentsDraft: { documentIds: [] },
      taxRegistrationDraft: { taxId: 'TX-123' },
    });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSubmitOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(true);
    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        isSubmitted: true,
        currentStep: 'review',
      })
    );
  });

  it('emits SUBMITTED event', async () => {
    const existing = makeSubmission({
      completedSteps: ['company_info', 'bank_details', 'kyc_documents', 'tax_registration'],
    });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    await supplierSubmitOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_ONBOARDING_SUBMITTED',
      })
    );
  });

  it('rejects when missing required steps', async () => {
    const existing = makeSubmission({
      completedSteps: ['company_info', 'bank_details'], // missing kyc + tax
    });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSubmitOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ONBOARDING_INCOMPLETE');
      expect(result.error.message).toContain('kyc_documents');
      expect(result.error.message).toContain('tax_registration');
    }
  });

  it('rejects double submit', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await supplierSubmitOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_ALREADY_SUBMITTED');
  });

  it('rejects if onboarding not started', async () => {
    const deps = makeDeps();

    const result = await supplierSubmitOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_NOT_STARTED');
  });
});

describe('approveOnboarding', () => {
  it('approves submitted onboarding', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await approveOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
    });

    expect(result.ok).toBe(true);
    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        reviewedBy: REVIEWER_ID,
      })
    );
  });

  it('emits APPROVED event', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    await approveOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
    });

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_ONBOARDING_APPROVED',
      })
    );
  });

  it('rejects approval for non-submitted onboarding', async () => {
    const existing = makeSubmission({ isSubmitted: false });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await approveOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_NOT_SUBMITTED');
  });

  it('rejects approval for non-existent submission', async () => {
    const deps = makeDeps();

    const result = await approveOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_NOT_FOUND');
  });
});

describe('rejectOnboarding', () => {
  it('rejects submitted onboarding with reason', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await rejectOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
      reason: 'Missing bank confirmation letter',
    });

    expect(result.ok).toBe(true);
    expect(deps.onboardingRepo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        isSubmitted: false, // allows re-editing
        rejectionReason: 'Missing bank confirmation letter',
        reviewedBy: REVIEWER_ID,
      })
    );
  });

  it('emits REJECTED event', async () => {
    const existing = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    await rejectOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
      reason: 'Missing bank confirmation letter',
    });

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_ONBOARDING_REJECTED',
        payload: expect.objectContaining({ reason: 'Missing bank confirmation letter' }),
      })
    );
  });

  it('rejects rejection for non-submitted onboarding', async () => {
    const existing = makeSubmission({ isSubmitted: false });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(existing);

    const result = await rejectOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
      reason: 'Some reason for rejection',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('ONBOARDING_NOT_SUBMITTED');
  });

  it('allows re-submission after rejection', async () => {
    // First: reject
    const submitted = makeSubmission({ isSubmitted: true });
    const deps = makeDeps();
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(submitted);

    const rejectResult = await rejectOnboarding(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      reviewerId: REVIEWER_ID,
      reason: 'Missing docs',
    });
    expect(rejectResult.ok).toBe(true);

    // Then: re-save should work since isSubmitted was set to false
    const rejected = makeSubmission({
      isSubmitted: false,
      rejectionReason: 'Missing docs',
      completedSteps: ['company_info', 'bank_details', 'kyc_documents', 'tax_registration'],
    });
    (deps.onboardingRepo.findBySupplierId as any).mockResolvedValue(rejected);

    const saveResult = await supplierSaveOnboardingDraft(deps, {
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
      userId: USER_ID,
      step: 'kyc_documents',
      draft: { documentIds: ['new-doc-id'] },
    });
    expect(saveResult.ok).toBe(true);
  });
});
