import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { ok } from '@afenda/core';
import type { ApprovalRequest } from '../../entities/approval-request.js';
import type { FinanceRuntime, FinanceDeps } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../ports/authorization.js';
import { registerApprovalRoutes } from '../approval-routes.js';

// ─── Stubs ───────────────────────────────────────────────────────────────────

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
    steps: [
      {
        id: 'step-1',
        requestId: 'req-1',
        stepIndex: 0,
        approverId: 'approver-1',
        status: 'PENDING',
        decidedAt: null,
        reason: null,
        delegatedTo: null,
      },
    ],
    ...overrides,
  };
}

function stubPolicy(): IAuthorizationPolicy {
  return {
    hasPermission: vi.fn().mockResolvedValue(true),
    checkSoD: vi.fn().mockResolvedValue({ allowed: true, violations: [] }),
  };
}

function stubRuntime(depsOverrides: Partial<FinanceDeps> = {}): FinanceRuntime {
  const mockPolicyRepo = {
    create: vi.fn().mockResolvedValue(
      ok({
        id: 'pol-1',
        tenantId: 't1',
        companyId: null,
        entityType: 'journal',
        name: 'Test Policy',
        isActive: true,
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ),
    findById: vi.fn(),
    findByTenantAndEntityType: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    deactivate: vi.fn(),
  };

  const mockRequestRepo = {
    createRequest: vi.fn().mockResolvedValue(ok(makeRequest({ steps: [] }))),
    createSteps: vi.fn().mockResolvedValue(ok([])),
    findById: vi.fn().mockResolvedValue(ok(makeRequest())),
    findByEntity: vi.fn().mockResolvedValue(ok(makeRequest())),
    findPendingForApprover: vi.fn().mockResolvedValue(ok([])),
    updateRequestStatus: vi.fn().mockResolvedValue(ok(makeRequest({ status: 'APPROVED' }))),
    updateStepStatus: vi.fn().mockResolvedValue(
      ok({
        id: 'step-1',
        requestId: 'req-1',
        stepIndex: 0,
        approverId: 'approver-1',
        status: 'APPROVED',
        decidedAt: new Date(),
        reason: null,
        delegatedTo: null,
      })
    ),
  };

  const mockOutbox = { write: vi.fn().mockResolvedValue(undefined) };

  return {
    async withTenant<T>(
      _ctx: { tenantId: string; userId: string },
      fn: (deps: FinanceDeps) => Promise<T>
    ): Promise<T> {
      return fn({
        approvalPolicyRepo: mockPolicyRepo,
        approvalRequestRepo: mockRequestRepo,
        outboxWriter: mockOutbox,
        ...depsOverrides,
      } as unknown as FinanceDeps);
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Approval Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    registerApprovalRoutes(app, stubRuntime(), stubPolicy());
    await app.ready();
  });

  it('POST /approvals/submit — returns 201 for valid submission', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approvals/submit',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'user-1' },
      payload: {
        entityType: 'journal',
        entityId: '00000000-0000-0000-0000-000000000001',
        metadata: { amount: 50000 },
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it('POST /approvals/:id/approve — returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approvals/00000000-0000-0000-0000-000000000001/approve',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'approver-1' },
      payload: { reason: 'Looks good' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /approvals/:id/reject — returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approvals/00000000-0000-0000-0000-000000000001/reject',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'approver-1' },
      payload: { reason: 'Insufficient docs' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /approvals/:id/delegate — returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approvals/00000000-0000-0000-0000-000000000001/delegate',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'approver-1' },
      payload: { delegateTo: 'delegate-user' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /approvals/:id/cancel — returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approvals/00000000-0000-0000-0000-000000000001/cancel',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'user-1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /approvals/pending — returns 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/approvals/pending',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'approver-1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /approvals/entity/:entityType/:entityId — returns 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/approvals/entity/journal/00000000-0000-0000-0000-000000000001',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'user-1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /approval-policies — returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/approval-policies',
      headers: { 'x-tenant-id': 't1', 'x-user-id': 'admin-1' },
      payload: {
        entityType: 'journal',
        name: 'High Value Journals',
        rules: [
          {
            condition: { field: 'amount', operator: 'gte', value: '10000' },
            chain: [{ approverType: 'role', approverValue: 'cfo', mode: 'sequential' }],
          },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
  });

  describe('403 enforcement', () => {
    it('returns 403 when user lacks permission', async () => {
      const forbiddenPolicy = stubPolicy();
      (forbiddenPolicy.hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const forbiddenApp = Fastify();
      registerApprovalRoutes(forbiddenApp, stubRuntime(), forbiddenPolicy);
      await forbiddenApp.ready();

      const res = await forbiddenApp.inject({
        method: 'POST',
        url: '/approvals/submit',
        headers: { 'x-tenant-id': 't1', 'x-user-id': 'user-1' },
        payload: {
          entityType: 'journal',
          entityId: '00000000-0000-0000-0000-000000000001',
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 401 when x-user-id is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/approvals/submit',
        headers: { 'x-tenant-id': 't1' },
        payload: {
          entityType: 'journal',
          entityId: '00000000-0000-0000-0000-000000000001',
        },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
