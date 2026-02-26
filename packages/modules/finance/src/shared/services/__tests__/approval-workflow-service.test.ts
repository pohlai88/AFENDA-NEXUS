import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err, NotFoundError } from '@afenda/core';
import type { ApprovalRequest, ApprovalStep } from '../../entities/approval-request.js';
import type { ApprovalPolicy } from '../../entities/approval-policy.js';
import type { IApprovalPolicyRepo } from '../../ports/approval-policy-repo.js';
import type { IApprovalRequestRepo } from '../../ports/approval-request-repo.js';
import type { IOutboxWriter } from '../../ports/outbox-writer.js';
import { ApprovalWorkflowService } from '../approval-workflow-service.js';

// ─── Stubs ───────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<ApprovalStep> = {}): ApprovalStep {
  return {
    id: 'step-1',
    requestId: 'req-1',
    stepIndex: 0,
    approverId: 'approver-1',
    status: 'PENDING',
    decidedAt: null,
    reason: null,
    delegatedTo: null,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    id: 'req-1',
    tenantId: 't1',
    entityType: 'journal',
    entityId: 'j-1',
    requestedBy: 'user-1',
    requestedAt: new Date(),
    status: 'PENDING',
    currentStepIndex: 0,
    metadata: { amount: 50000 },
    completedAt: null,
    steps: [makeStep()],
    ...overrides,
  };
}

const thresholdPolicy: ApprovalPolicy = {
  id: 'pol-1',
  tenantId: 't1',
  companyId: null,
  entityType: 'journal',
  name: 'Journal Approval',
  isActive: true,
  rules: [
    {
      condition: { field: 'amount', operator: 'gte', value: '10000' },
      chain: [{ approverType: 'role', approverValue: 'approver-1', mode: 'sequential' as const }],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockPolicyRepo(): IApprovalPolicyRepo {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByTenantAndEntityType: vi.fn().mockResolvedValue([thresholdPolicy]),
    update: vi.fn(),
    deactivate: vi.fn(),
  };
}

function createMockRequestRepo(): IApprovalRequestRepo {
  return {
    createRequest: vi.fn().mockResolvedValue(ok(makeRequest({ steps: [] }))),
    createSteps: vi.fn().mockResolvedValue(ok([makeStep()])),
    findById: vi.fn().mockResolvedValue(ok(makeRequest())),
    findByEntity: vi.fn().mockResolvedValue(ok(makeRequest())),
    findPendingForApprover: vi.fn().mockResolvedValue(ok([])),
    updateRequestStatus: vi
      .fn()
      .mockImplementation(async (id: string, status: string, idx?: number) =>
        ok(makeRequest({ status: status as ApprovalRequest['status'], currentStepIndex: idx ?? 0 }))
      ),
    updateStepStatus: vi.fn().mockResolvedValue(ok(makeStep({ status: 'APPROVED' }))),
  };
}

function createMockOutbox(): IOutboxWriter {
  return { write: vi.fn().mockResolvedValue(undefined) };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ApprovalWorkflowService', () => {
  let policyRepo: ReturnType<typeof createMockPolicyRepo>;
  let requestRepo: ReturnType<typeof createMockRequestRepo>;
  let outbox: ReturnType<typeof createMockOutbox>;
  let service: ApprovalWorkflowService;

  beforeEach(() => {
    policyRepo = createMockPolicyRepo();
    requestRepo = createMockRequestRepo();
    outbox = createMockOutbox();
    service = new ApprovalWorkflowService(policyRepo, requestRepo, outbox);
  });

  describe('submit', () => {
    it('creates approval request with chain when policy matches', async () => {
      const result = await service.submit({
        tenantId: 't1',
        entityType: 'journal',
        entityId: 'j-1',
        requestedBy: 'user-1',
        metadata: { amount: 50000 },
      });

      expect(result.ok).toBe(true);
      expect(requestRepo.createRequest).toHaveBeenCalled();
      expect(requestRepo.createSteps).toHaveBeenCalledWith([
        { requestId: expect.any(String), stepIndex: 0, approverId: 'approver-1' },
      ]);
      expect(outbox.write).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'APPROVAL_SUBMITTED' })
      );
    });

    it('auto-approves when no policy matches (below threshold)', async () => {
      const result = await service.submit({
        tenantId: 't1',
        entityType: 'journal',
        entityId: 'j-2',
        requestedBy: 'user-1',
        metadata: { amount: 500 },
      });

      expect(result.ok).toBe(true);
      expect(requestRepo.createRequest).toHaveBeenCalled();
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith(expect.any(String), 'APPROVED');
      // No outbox event for auto-approve — no chain to route through
      expect(outbox.write).not.toHaveBeenCalled();
    });

    it('auto-approves when no policies exist for entity type', async () => {
      (policyRepo.findByTenantAndEntityType as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.submit({
        tenantId: 't1',
        entityType: 'payment_run',
        entityId: 'pr-1',
        requestedBy: 'user-1',
        metadata: {},
      });

      expect(result.ok).toBe(true);
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith(expect.any(String), 'APPROVED');
    });
  });

  describe('approve', () => {
    it('approves current step and marks request APPROVED when last step', async () => {
      const result = await service.approve('req-1', 'approver-1', 'Looks good');

      expect(result.ok).toBe(true);
      expect(requestRepo.updateStepStatus).toHaveBeenCalledWith('step-1', 'APPROVED', 'Looks good');
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'APPROVED');
      expect(outbox.write).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'APPROVAL_APPROVED' })
      );
    });

    it('advances to next step when more steps exist', async () => {
      const multiStepRequest = makeRequest({
        steps: [
          makeStep({ id: 'step-0', stepIndex: 0, approverId: 'approver-1' }),
          makeStep({ id: 'step-1', stepIndex: 1, approverId: 'approver-2' }),
        ],
      });
      (requestRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(multiStepRequest));

      const result = await service.approve('req-1', 'approver-1');

      expect(result.ok).toBe(true);
      expect(requestRepo.updateStepStatus).toHaveBeenCalledWith('step-0', 'APPROVED', null);
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'PENDING', 1);
      // No APPROVAL_APPROVED outbox event yet — not final
      expect(outbox.write).not.toHaveBeenCalled();
    });

    it('rejects if request is not PENDING', async () => {
      (requestRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(makeRequest({ status: 'APPROVED' }))
      );

      const result = await service.approve('req-1', 'approver-1');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
    });

    it('rejects if user is not the current approver', async () => {
      const result = await service.approve('req-1', 'wrong-user');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    });

    it('allows delegatedTo user to approve', async () => {
      const delegatedStep = makeStep({ delegatedTo: 'delegate-user' });
      const delegatedRequest = makeRequest({ steps: [delegatedStep] });
      (requestRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(delegatedRequest));

      const result = await service.approve('req-1', 'delegate-user');
      expect(result.ok).toBe(true);
    });
  });

  describe('reject', () => {
    it('rejects step and marks request REJECTED', async () => {
      const result = await service.reject('req-1', 'approver-1', 'Insufficient documentation');

      expect(result.ok).toBe(true);
      expect(requestRepo.updateStepStatus).toHaveBeenCalledWith(
        'step-1',
        'REJECTED',
        'Insufficient documentation'
      );
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'REJECTED');
      expect(outbox.write).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'APPROVAL_REJECTED' })
      );
    });

    it('rejects if request is not PENDING', async () => {
      (requestRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(makeRequest({ status: 'CANCELLED' }))
      );

      const result = await service.reject('req-1', 'approver-1', 'reason');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
    });
  });

  describe('delegate', () => {
    it('delegates current step to another user', async () => {
      const result = await service.delegate('req-1', 'approver-1', 'delegate-user');

      expect(result.ok).toBe(true);
      expect(requestRepo.updateStepStatus).toHaveBeenCalledWith(
        'step-1',
        'DELEGATED',
        'Delegated to delegate-user',
        'delegate-user'
      );
    });

    it('fails if caller is not the current approver', async () => {
      const result = await service.delegate('req-1', 'wrong-user', 'delegate-user');
      expect(result.ok).toBe(false);
    });
  });

  describe('cancel', () => {
    it('cancels a pending request by the original requester', async () => {
      const result = await service.cancel('req-1', 'user-1');

      expect(result.ok).toBe(true);
      expect(requestRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'CANCELLED');
    });

    it('fails if caller is not the requester', async () => {
      const result = await service.cancel('req-1', 'other-user');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    });

    it('fails if request is not PENDING', async () => {
      (requestRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(makeRequest({ status: 'APPROVED' }))
      );

      const result = await service.cancel('req-1', 'user-1');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
    });
  });

  describe('isApproved', () => {
    it('returns true when request is APPROVED', async () => {
      (requestRepo.findByEntity as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(makeRequest({ status: 'APPROVED' }))
      );
      expect(await service.isApproved('t1', 'journal', 'j-1')).toBe(true);
    });

    it('returns false when request is PENDING', async () => {
      expect(await service.isApproved('t1', 'journal', 'j-1')).toBe(false);
    });

    it('returns false when request not found', async () => {
      (requestRepo.findByEntity as ReturnType<typeof vi.fn>).mockResolvedValue(
        err(new NotFoundError('ApprovalRequest', 'j-1'))
      );
      expect(await service.isApproved('t1', 'journal', 'j-1')).toBe(false);
    });
  });

  describe('findByEntity', () => {
    it('delegates to request repo', async () => {
      const result = await service.findByEntity('t1', 'journal', 'j-1');
      expect(result.ok).toBe(true);
      expect(requestRepo.findByEntity).toHaveBeenCalledWith('t1', 'journal', 'j-1');
    });
  });

  describe('findPendingForApprover', () => {
    it('delegates to request repo', async () => {
      const result = await service.findPendingForApprover('t1', 'approver-1');
      expect(result.ok).toBe(true);
      expect(requestRepo.findPendingForApprover).toHaveBeenCalledWith('t1', 'approver-1');
    });
  });
});
