/**
 * Phase 1.2.2: Breakglass Escalation service unit tests (CAP-SOS P19).
 *
 * Tests all 4 service functions:
 *   1. triggerEscalation — create new breakglass escalation with auto-assign + SLA
 *   2. listEscalations   — paginated listing with optional filters
 *   3. getEscalation     — single escalation with live SLA countdown
 *   4. resolveEscalation — resolve with proof chain + outbox event
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  triggerEscalation,
  listEscalations,
  getEscalation,
  resolveEscalation,
  type EscalationServiceDeps,
  type EscalationEntity,
  type IEscalationRepo,
} from './supplier-portal-escalation';

// ─── Constants ────────────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';
const CASE_ID = '00000000-0000-0000-0000-000000000004';
const ESCALATION_ID = '00000000-0000-0000-0000-000000000005';
const CONTACT_ID = '00000000-0000-0000-0000-000000000006';

// ─── Mock Factories ───────────────────────────────────────────────────────────

const NOW = new Date('2025-01-01T12:00:00.000Z');

function makeEscalation(overrides: Partial<EscalationEntity> = {}): EscalationEntity {
  return {
    id: ESCALATION_ID,
    tenantId: TENANT_ID,
    caseId: CASE_ID,
    supplierId: SUPPLIER_ID,
    triggeredBy: USER_ID,
    assignedTo: CONTACT_ID,
    assignedAt: NOW,
    status: 'ESCALATION_ASSIGNED',
    reason: 'Invoice payment overdue by 30 days and unresponsive',
    respondByAt: new Date(NOW.getTime() + 48 * 60 * 60 * 1_000),
    resolveByAt: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1_000),
    resolvedAt: null,
    resolutionNotes: null,
    proofHash: 'proof-hash-abc',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeEscalationRepo(overrides: Partial<IEscalationRepo> = {}): IEscalationRepo {
  return {
    create: vi.fn().mockImplementation(async (data) => data),
    findById: vi.fn().mockResolvedValue(makeEscalation()),
    findActiveByCaseId: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({ items: [makeEscalation()], total: 1 }),
    updateStatus: vi.fn().mockImplementation(async (_id, status, patch) => ({
      ...makeEscalation(),
      status,
      ...patch,
    })),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<EscalationServiceDeps> = {}): EscalationServiceDeps {
  const escalationRepo = makeEscalationRepo();

  const supplierCaseRepo = {
    findById: vi.fn().mockResolvedValue({
      id: CASE_ID,
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
    }),
    create: vi.fn().mockImplementation(async (data) => data),
    nextTicketSequence: vi.fn().mockResolvedValue(1),
  } as any;

  const directoryRepo = {
    findByTenantId: vi
      .fn()
      .mockResolvedValue([{ id: CONTACT_ID, tenantId: TENANT_ID, isEscalationContact: true }]),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(null),
  } as any;

  const outboxWriter = {
    write: vi.fn().mockResolvedValue(undefined),
  } as any;

  const proofChainWriter = {
    write: vi.fn().mockResolvedValue({ contentHash: 'proof-hash-abc' }),
  } as any;

  return {
    escalationRepo,
    supplierCaseRepo,
    directoryRepo,
    outboxWriter,
    proofChainWriter,
    ...overrides,
  };
}

// ─── Tests: triggerEscalation ─────────────────────────────────────────────────

describe('triggerEscalation', () => {
  it('creates escalation with ESCALATION_ASSIGNED when escalation contact exists', async () => {
    const deps = makeDeps();

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('ESCALATION_ASSIGNED');
    expect(result.value.assignedTo).toBe(CONTACT_ID);
    expect(result.value.assignedAt).toBeDefined();
  });

  it('creates escalation with ESCALATION_REQUESTED when no escalation contacts exist', async () => {
    const deps = makeDeps({
      directoryRepo: {
        findByTenantId: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
        findById: vi.fn().mockResolvedValue(null),
      } as any,
    });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('ESCALATION_REQUESTED');
    expect(result.value.assignedTo).toBeNull();
    expect(result.value.assignedAt).toBeNull();
  });

  it('returns NotFoundError when case does not exist', async () => {
    const deps = makeDeps({
      supplierCaseRepo: {
        findById: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        nextTicketSequence: vi.fn(),
      } as any,
    });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: 'non-existent-case',
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns NotFoundError when case belongs to different tenant', async () => {
    const deps = makeDeps({
      supplierCaseRepo: {
        findById: vi.fn().mockResolvedValue({
          id: CASE_ID,
          tenantId: 'other-tenant',
          supplierId: SUPPLIER_ID,
        }),
        create: vi.fn(),
        nextTicketSequence: vi.fn(),
      } as any,
    });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when case belongs to different supplier', async () => {
    const deps = makeDeps({
      supplierCaseRepo: {
        findById: vi.fn().mockResolvedValue({
          id: CASE_ID,
          tenantId: TENANT_ID,
          supplierId: 'other-supplier',
        }),
        create: vi.fn(),
        nextTicketSequence: vi.fn(),
      } as any,
    });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });

  it('returns ESCALATION_ALREADY_ACTIVE when active escalation exists for case', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findActiveByCaseId: vi.fn().mockResolvedValue(makeEscalation()),
      }),
    });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('ESCALATION_ALREADY_ACTIVE');
  });

  it('writes ESCALATION_TRIGGERED proof chain entry', async () => {
    const deps = makeDeps();

    await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(deps.proofChainWriter!.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'ESCALATION_TRIGGERED' }),
      undefined
    );
  });

  it('emits SUPPLIER_ESCALATION_ASSIGNED outbox event when contact found', async () => {
    const deps = makeDeps();

    await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_ESCALATION_ASSIGNED' })
    );
  });

  it('emits SUPPLIER_ESCALATION_TRIGGERED outbox event when no contact found', async () => {
    const deps = makeDeps({
      directoryRepo: {
        findByTenantId: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
        findById: vi.fn().mockResolvedValue(null),
      } as any,
    });

    await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_ESCALATION_TRIGGERED' })
    );
  });

  it('computes respondByAt ~48h and resolveByAt ~5d from trigger time', async () => {
    const deps = makeDeps();
    const before = Date.now();

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    const after = Date.now();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { respondByAt, resolveByAt } = result.value;
    const RESPOND_MS = 48 * 60 * 60 * 1_000;
    const RESOLVE_MS = 5 * 24 * 60 * 60 * 1_000;

    expect(respondByAt.getTime()).toBeGreaterThanOrEqual(before + RESPOND_MS - 100);
    expect(respondByAt.getTime()).toBeLessThanOrEqual(after + RESPOND_MS + 100);
    expect(resolveByAt.getTime()).toBeGreaterThanOrEqual(before + RESOLVE_MS - 100);
    expect(resolveByAt.getTime()).toBeLessThanOrEqual(after + RESOLVE_MS + 100);
  });

  it('succeeds even when proof chain writer is absent (non-fatal)', async () => {
    const deps = makeDeps({ proofChainWriter: undefined });

    const result = await triggerEscalation(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        triggeredBy: USER_ID,
        caseId: CASE_ID,
        reason: 'Invoice payment overdue by 30 days',
      },
      deps
    );

    expect(result.ok).toBe(true);
  });
});

// ─── Tests: listEscalations ───────────────────────────────────────────────────

describe('listEscalations', () => {
  it('returns paginated escalation list with correct shape', async () => {
    const deps = makeDeps();

    const result = await listEscalations(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
      },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(1);
    expect(result.value.total).toBe(1);
    expect(result.value.page).toBe(1);
    expect(result.value.limit).toBe(20);
  });

  it('computes hasMore=true when more records exist beyond current page', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        list: vi.fn().mockResolvedValue({ items: [makeEscalation()], total: 25 }),
      }),
    });

    const result = await listEscalations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 10 },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasMore).toBe(true);
  });

  it('computes hasMore=false when on last page', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        list: vi.fn().mockResolvedValue({ items: [makeEscalation()], total: 5 }),
      }),
    });

    const result = await listEscalations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 10 },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasMore).toBe(false);
  });

  it('passes status filter through to repo', async () => {
    const deps = makeDeps();

    await listEscalations(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
        status: 'ESCALATION_ASSIGNED',
      },
      { escalationRepo: deps.escalationRepo }
    );

    expect(deps.escalationRepo.list).toHaveBeenCalledWith(
      TENANT_ID,
      SUPPLIER_ID,
      expect.objectContaining({ status: 'ESCALATION_ASSIGNED' })
    );
  });

  it('passes caseId filter through to repo', async () => {
    const deps = makeDeps();

    await listEscalations(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
        caseId: CASE_ID,
      },
      { escalationRepo: deps.escalationRepo }
    );

    expect(deps.escalationRepo.list).toHaveBeenCalledWith(
      TENANT_ID,
      SUPPLIER_ID,
      expect.objectContaining({ caseId: CASE_ID })
    );
  });
});

// ─── Tests: getEscalation ─────────────────────────────────────────────────────

describe('getEscalation', () => {
  it('returns escalation with SLA countdown attached', async () => {
    const deps = makeDeps();

    const result = await getEscalation(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationId: ESCALATION_ID },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sla).toBeDefined();
    expect(result.value.sla.respondByAt).toBeInstanceOf(Date);
    expect(result.value.sla.resolveByAt).toBeInstanceOf(Date);
    expect(typeof result.value.sla.respondSlaBreached).toBe('boolean');
    expect(typeof result.value.sla.resolveSlaBreached).toBe('boolean');
    expect(typeof result.value.sla.hoursUntilRespond).toBe('number');
    expect(typeof result.value.sla.hoursUntilResolve).toBe('number');
  });

  it('returns NotFoundError when escalation does not exist', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    const result = await getEscalation(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationId: 'bad-id' },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when escalation belongs to different supplier', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi.fn().mockResolvedValue(makeEscalation({ supplierId: 'other-supplier' })),
      }),
    });

    const result = await getEscalation(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationId: ESCALATION_ID },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });

  it('reports SLA as breached when deadlines are in the past', async () => {
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1_000); // 2 hours ago
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi
          .fn()
          .mockResolvedValue(makeEscalation({ respondByAt: pastDate, resolveByAt: pastDate })),
      }),
    });

    const result = await getEscalation(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationId: ESCALATION_ID },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sla.respondSlaBreached).toBe(true);
    expect(result.value.sla.resolveSlaBreached).toBe(true);
    expect(result.value.sla.hoursUntilRespond).toBeLessThan(0);
    expect(result.value.sla.hoursUntilResolve).toBeLessThan(0);
  });

  it('reports SLA as not breached when deadlines are in the future', async () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1_000);
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi
          .fn()
          .mockResolvedValue(makeEscalation({ respondByAt: futureDate, resolveByAt: futureDate })),
      }),
    });

    const result = await getEscalation(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationId: ESCALATION_ID },
      { escalationRepo: deps.escalationRepo }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sla.respondSlaBreached).toBe(false);
    expect(result.value.sla.resolveSlaBreached).toBe(false);
    expect(result.value.sla.hoursUntilRespond).toBeGreaterThan(0);
    expect(result.value.sla.hoursUntilResolve).toBeGreaterThan(0);
  });
});

// ─── Tests: resolveEscalation ─────────────────────────────────────────────────

describe('resolveEscalation', () => {
  it('resolves escalation and returns updated entity', async () => {
    const deps = makeDeps();

    const result = await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Payment was processed and confirmed by supplier',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('ESCALATION_RESOLVED');
    expect(result.value.resolutionNotes).toBe('Payment was processed and confirmed by supplier');
    expect(result.value.resolvedAt).toBeDefined();
  });

  it('writes ESCALATION_RESOLVED proof chain entry', async () => {
    const deps = makeDeps();

    await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Payment was processed and confirmed by supplier',
      },
      deps
    );

    expect(deps.proofChainWriter!.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'ESCALATION_RESOLVED' }),
      undefined
    );
  });

  it('emits SUPPLIER_ESCALATION_RESOLVED outbox event', async () => {
    const deps = makeDeps();

    await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Payment was processed and confirmed by supplier',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_ESCALATION_RESOLVED' })
    );
  });

  it('returns NotFoundError when escalation does not exist', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    const result = await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: 'bad-id',
        resolutionNotes: 'Payment was processed',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns ALREADY_RESOLVED when escalation is already resolved', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        findById: vi.fn().mockResolvedValue(
          makeEscalation({
            status: 'ESCALATION_RESOLVED',
            resolvedAt: NOW,
            resolutionNotes: 'Already done',
          })
        ),
      }),
    });

    const result = await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Trying to resolve again',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('ALREADY_RESOLVED');
  });

  it('returns UPDATE_FAILED when repo updateStatus returns null', async () => {
    const deps = makeDeps({
      escalationRepo: makeEscalationRepo({
        updateStatus: vi.fn().mockResolvedValue(null),
      }),
    });

    const result = await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Payment was processed',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UPDATE_FAILED');
  });

  it('succeeds even when proof chain writer is absent (non-fatal)', async () => {
    const deps = makeDeps({ proofChainWriter: undefined });

    const result = await resolveEscalation(
      {
        tenantId: TENANT_ID,
        resolvedBy: USER_ID,
        escalationId: ESCALATION_ID,
        resolutionNotes: 'Payment was processed and confirmed by supplier',
      },
      deps
    );

    expect(result.ok).toBe(true);
  });
});
