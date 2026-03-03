/**
 * Unit tests for Phase 1.1.1: Supplier Case Management service.
 *
 * Tests cover all 7 service functions with mock repos + outbox writer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { Supplier } from '../entities/supplier.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import {
  supplierCreateCase,
  supplierGetCase,
  supplierListCases,
  supplierTransitionCase,
  supplierAssignCase,
  supplierAddTimelineMessage,
  supplierGetCaseTimeline,
  type SupplierCase,
  type CaseTimelineEntry,
  type ISupplierCaseRepo,
  type ICaseTimelineRepo,
  type CreateCaseInput,
  type CaseListQuery,
} from './supplier-portal-case.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TENANT_ID = '01234567-0000-0000-0000-000000000001';
const SUPPLIER_ID = '01234567-0000-0000-0000-000000000002';
const USER_ID = '01234567-0000-0000-0000-000000000003';
const CASE_ID = '01234567-0000-0000-0000-000000000010';

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    tenantId: TENANT_ID,
    companyId: 'comp-1',
    code: 'SUP-001',
    name: 'Test Supplier',
    tradingName: null,
    registrationNumber: null,
    countryOfIncorporation: null,
    legalForm: null,
    taxId: null,
    currencyCode: 'USD',
    defaultPaymentTermsId: null,
    defaultPaymentMethod: null,
    whtRateId: null,
    remittanceEmail: null,
    status: 'ACTIVE',
    onboardingStatus: 'APPROVED',
    accountGroup: 'TRADE',
    category: 'STANDARD',
    industryCode: null,
    industryDescription: null,
    parentSupplierId: null,
    isGroupHeader: false,
    sites: [],
    bankAccounts: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Supplier;
}

function makeCase(overrides: Partial<SupplierCase> = {}): SupplierCase {
  return {
    id: CASE_ID,
    tenantId: TENANT_ID,
    ticketNumber: 'CASE-012-2025-00001',
    supplierId: SUPPLIER_ID,
    category: 'INVOICE',
    priority: 'MEDIUM',
    subject: 'Test case subject',
    description: 'A test case description that is long enough',
    status: 'SUBMITTED',
    assignedTo: null,
    coAssignees: [],
    linkedEntityId: null,
    linkedEntityType: null,
    slaDeadline: new Date('2025-01-10'),
    resolution: null,
    rootCause: null,
    correctiveAction: null,
    resolvedBy: null,
    resolvedAt: null,
    escalationId: null,
    proofChainHead: null,
    createdBy: USER_ID,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeTimeline(overrides: Partial<CaseTimelineEntry> = {}): CaseTimelineEntry {
  return {
    id: 'tl-001',
    caseId: CASE_ID,
    tenantId: TENANT_ID,
    entryType: 'message',
    refId: null,
    refType: null,
    actorId: USER_ID,
    actorType: 'SUPPLIER',
    content: { message: 'Hello' },
    proofHash: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ─── Mock Factories ─────────────────────────────────────────────────────────

function mockSupplierRepo(): ISupplierRepo {
  return {
    findById: vi
      .fn<(id: string) => Promise<Result<Supplier>>>()
      .mockResolvedValue(ok(makeSupplier())),
    // These are not called by our service but required by the interface
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByTenantId: vi.fn(),
    findByCode: vi.fn(),
    listByTenantId: vi.fn(),
    search: vi.fn(),
  } as unknown as ISupplierRepo;
}

function mockCaseRepo(): ISupplierCaseRepo {
  const base = makeCase();
  return {
    create: vi.fn<(c: SupplierCase) => Promise<SupplierCase>>().mockImplementation(async (c) => c),
    findById: vi.fn<(id: string) => Promise<SupplierCase | null>>().mockResolvedValue(base),
    findBySupplierId: vi.fn().mockResolvedValue({ items: [base], total: 1 }),
    updateStatus: vi.fn().mockResolvedValue(base),
    update: vi
      .fn<(id: string, data: Partial<SupplierCase>) => Promise<SupplierCase | null>>()
      .mockImplementation(async (_id, data) => ({ ...base, ...data }) as SupplierCase),
    nextTicketSequence: vi.fn<(tenantId: string) => Promise<number>>().mockResolvedValue(1),
  };
}

function mockTimelineRepo(): ICaseTimelineRepo {
  return {
    append: vi
      .fn<(entry: CaseTimelineEntry) => Promise<CaseTimelineEntry>>()
      .mockImplementation(async (entry) => entry),
    findByCaseId: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
}

function mockOutboxWriter(): IOutboxWriter {
  return {
    write: vi.fn().mockResolvedValue(undefined),
  };
}

function makeDeps() {
  return {
    supplierRepo: mockSupplierRepo(),
    supplierCaseRepo: mockCaseRepo(),
    caseTimelineRepo: mockTimelineRepo(),
    outboxWriter: mockOutboxWriter(),
  };
}

function createInput(overrides: Partial<CreateCaseInput> = {}): CreateCaseInput {
  return {
    tenantId: TENANT_ID,
    supplierId: SUPPLIER_ID,
    userId: USER_ID,
    category: 'INVOICE',
    priority: 'MEDIUM',
    subject: 'Invoice mismatch on PO-9001',
    description: 'The invoice amount does not match the purchase order',
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('supplierCreateCase', () => {
  it('creates a case with ticket number, timeline entry, and outbox event', async () => {
    const deps = makeDeps();
    const input = createInput();

    const result = await supplierCreateCase(input, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Case shape
    expect(result.value.ticketNumber).toMatch(/^CASE-012-\d{4}-00001$/);
    expect(result.value.supplierId).toBe(SUPPLIER_ID);
    expect(result.value.category).toBe('INVOICE');
    expect(result.value.priority).toBe('MEDIUM');
    expect(result.value.status).toBe('SUBMITTED');
    expect(result.value.subject).toBe('Invoice mismatch on PO-9001');
    expect(result.value.slaDeadline).toBeDefined();

    // Repo called
    expect(deps.supplierCaseRepo.create).toHaveBeenCalledTimes(1);

    // Timeline entry appended
    expect(deps.caseTimelineRepo.append).toHaveBeenCalledTimes(1);
    const tlCall = vi.mocked(deps.caseTimelineRepo.append).mock.calls[0]![0];
    expect(tlCall.entryType).toBe('status');
    expect(tlCall.content).toEqual(expect.objectContaining({ toStatus: 'SUBMITTED' }));

    // Outbox event emitted
    expect(deps.outboxWriter.write).toHaveBeenCalledTimes(1);
    const obCall = vi.mocked(deps.outboxWriter.write).mock.calls[0]![0];
    expect(obCall.eventType).toBe(FinanceEventType.SUPPLIER_CASE_CREATED);
    expect(obCall.payload).toEqual(
      expect.objectContaining({ supplierId: SUPPLIER_ID, category: 'INVOICE' })
    );
  });

  it('returns error when supplier not found', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierRepo.findById).mockResolvedValue(
      err(new AppError('NOT_FOUND', 'Supplier not found'))
    );

    const result = await supplierCreateCase(createInput(), deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns error when supplier is inactive', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierRepo.findById).mockResolvedValue(
      ok(makeSupplier({ status: 'INACTIVE' }))
    );

    const result = await supplierCreateCase(createInput(), deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('inactive');
  });

  it('validates subject minimum length', async () => {
    const deps = makeDeps();
    const result = await supplierCreateCase(createInput({ subject: 'abc' }), deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('subject');
  });

  it('validates description minimum length', async () => {
    const deps = makeDeps();
    const result = await supplierCreateCase(createInput({ description: 'short' }), deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('description');
  });

  it('includes linked entity when provided', async () => {
    const deps = makeDeps();
    const result = await supplierCreateCase(
      createInput({ linkedEntityId: 'inv-123', linkedEntityType: 'INVOICE' }),
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.linkedEntityId).toBe('inv-123');
    expect(result.value.linkedEntityType).toBe('INVOICE');
  });
});

describe('supplierGetCase', () => {
  it('returns the case when found and belongs to supplier', async () => {
    const deps = makeDeps();
    const result = await supplierGetCase(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, caseId: CASE_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe(CASE_ID);
  });

  it('returns NOT_FOUND when case does not exist', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(null);

    const result = await supplierGetCase(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, caseId: 'nonexistent' },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when case belongs to another supplier', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(
      makeCase({ supplierId: 'other-supplier' })
    );

    const result = await supplierGetCase(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, caseId: CASE_ID },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });
});

describe('supplierListCases', () => {
  it('returns paginated case list', async () => {
    const deps = makeDeps();
    const query: CaseListQuery = { page: 1, limit: 20 };

    const result = await supplierListCases(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, query },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(1);
    expect(result.value.total).toBe(1);
    expect(deps.supplierCaseRepo.findBySupplierId).toHaveBeenCalledWith(SUPPLIER_ID, query);
  });

  it('returns error when supplier not found', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierRepo.findById).mockResolvedValue(
      err(new AppError('NOT_FOUND', 'Supplier not found'))
    );

    const result = await supplierListCases(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, query: { page: 1, limit: 20 } },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

describe('supplierTransitionCase', () => {
  it('transitions SUBMITTED → ASSIGNED with timeline + outbox event', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ status: 'SUBMITTED' }));

    const result = await supplierTransitionCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        targetStatus: 'ASSIGNED',
        comment: 'Starting review',
      },
      deps
    );

    expect(result.ok).toBe(true);

    // Repo update called
    expect(deps.supplierCaseRepo.update).toHaveBeenCalledWith(
      CASE_ID,
      expect.objectContaining({ status: 'ASSIGNED' })
    );

    // Timeline appended
    expect(deps.caseTimelineRepo.append).toHaveBeenCalledTimes(1);
    const tlCall = vi.mocked(deps.caseTimelineRepo.append).mock.calls[0]![0];
    expect(tlCall.content).toEqual(
      expect.objectContaining({
        fromStatus: 'SUBMITTED',
        toStatus: 'ASSIGNED',
        comment: 'Starting review',
      })
    );

    // Outbox event
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: FinanceEventType.SUPPLIER_CASE_STATUS_CHANGED,
      })
    );
  });

  it('stamps resolved fields when transitioning to RESOLVED', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(
      makeCase({ status: 'IN_PROGRESS' })
    );

    await supplierTransitionCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        targetStatus: 'RESOLVED',
      },
      deps
    );

    const updateCall = vi.mocked(deps.supplierCaseRepo.update).mock.calls[0]!;
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        status: 'RESOLVED',
        resolvedBy: USER_ID,
        resolvedAt: expect.any(Date),
      })
    );
  });

  it('rejects invalid state transitions', async () => {
    const deps = makeDeps();
    // SUBMITTED → CLOSED is not valid (must go through intermediate states)
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ status: 'SUBMITTED' }));

    const result = await supplierTransitionCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        targetStatus: 'CLOSED',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('Invalid status transition');
  });

  it('returns NOT_FOUND for nonexistent case', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(null);

    const result = await supplierTransitionCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: 'missing',
        targetStatus: 'ASSIGNED',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when case belongs to another supplier', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(
      makeCase({ supplierId: 'other-supplier' })
    );

    const result = await supplierTransitionCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        targetStatus: 'ASSIGNED',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });
});

describe('supplierAssignCase', () => {
  it('assigns a user and auto-transitions SUBMITTED → ASSIGNED', async () => {
    const deps = makeDeps();
    const assigneeId = 'user-assignee';
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ status: 'SUBMITTED' }));

    const result = await supplierAssignCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        assignedTo: assigneeId,
        coAssignees: ['co-1', 'co-2'],
        comment: 'Assigning to team lead',
      },
      deps
    );

    expect(result.ok).toBe(true);

    // Update called with auto-transition to ASSIGNED
    expect(deps.supplierCaseRepo.update).toHaveBeenCalledWith(
      CASE_ID,
      expect.objectContaining({
        assignedTo: assigneeId,
        coAssignees: ['co-1', 'co-2'],
        status: 'ASSIGNED',
      })
    );

    // Timeline entry
    expect(deps.caseTimelineRepo.append).toHaveBeenCalledTimes(1);
    const tlEntry = vi.mocked(deps.caseTimelineRepo.append).mock.calls[0]![0];
    expect(tlEntry.content).toEqual(
      expect.objectContaining({
        action: 'case_assigned',
        assignedTo: assigneeId,
        comment: 'Assigning to team lead',
      })
    );

    // Outbox event
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: FinanceEventType.SUPPLIER_CASE_ASSIGNED,
        payload: expect.objectContaining({ assignedTo: assigneeId }),
      })
    );
  });

  it('does NOT auto-transition when not in SUBMITTED status', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(
      makeCase({ status: 'IN_PROGRESS' })
    );

    await supplierAssignCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        assignedTo: 'user-assignee',
      },
      deps
    );

    // Status stays IN_PROGRESS — not changed to ASSIGNED
    expect(deps.supplierCaseRepo.update).toHaveBeenCalledWith(
      CASE_ID,
      expect.objectContaining({
        status: 'IN_PROGRESS',
      })
    );
  });

  it('returns FORBIDDEN for wrong supplier', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ supplierId: 'other' }));

    const result = await supplierAssignCase(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        assignedTo: 'user-assignee',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });
});

describe('supplierAddTimelineMessage', () => {
  it('appends a message entry and emits timeline event', async () => {
    const deps = makeDeps();

    const result = await supplierAddTimelineMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        content: 'Please check the attached invoice',
        actorType: 'SUPPLIER',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.entryType).toBe('message');
    expect(result.value.content).toEqual({ message: 'Please check the attached invoice' });

    // Outbox event
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: FinanceEventType.SUPPLIER_CASE_TIMELINE_ENTRY,
        payload: expect.objectContaining({
          entryType: 'message',
          actorType: 'SUPPLIER',
        }),
      })
    );
  });

  it('rejects messages on CLOSED cases', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ status: 'CLOSED' }));

    const result = await supplierAddTimelineMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: CASE_ID,
        content: 'Should not work',
        actorType: 'SUPPLIER',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toContain('closed');
  });

  it('returns NOT_FOUND for nonexistent case', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(null);

    const result = await supplierAddTimelineMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        caseId: 'missing',
        content: 'Hello',
        actorType: 'BUYER',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });
});

describe('supplierGetCaseTimeline', () => {
  it('returns timeline entries for a valid case', async () => {
    const deps = makeDeps();
    const entries = [makeTimeline(), makeTimeline({ id: 'tl-002' })];
    vi.mocked(deps.caseTimelineRepo.findByCaseId).mockResolvedValue({
      items: entries,
      total: 2,
    });

    const result = await supplierGetCaseTimeline(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        caseId: CASE_ID,
        page: 1,
        limit: 20,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(2);
    expect(result.value.total).toBe(2);
    expect(deps.caseTimelineRepo.findByCaseId).toHaveBeenCalledWith(CASE_ID, {
      page: 1,
      limit: 20,
      entryType: undefined,
    });
  });

  it('supports filtering by entry type', async () => {
    const deps = makeDeps();

    await supplierGetCaseTimeline(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        caseId: CASE_ID,
        page: 1,
        limit: 10,
        entryType: 'status',
      },
      deps
    );

    expect(deps.caseTimelineRepo.findByCaseId).toHaveBeenCalledWith(CASE_ID, {
      page: 1,
      limit: 10,
      entryType: 'status',
    });
  });

  it('returns FORBIDDEN for wrong supplier', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(makeCase({ supplierId: 'other' }));

    const result = await supplierGetCaseTimeline(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        caseId: CASE_ID,
        page: 1,
        limit: 20,
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FORBIDDEN');
  });

  it('returns NOT_FOUND for nonexistent case', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierCaseRepo.findById).mockResolvedValue(null);

    const result = await supplierGetCaseTimeline(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        caseId: 'nonexistent',
        page: 1,
        limit: 20,
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });
});
