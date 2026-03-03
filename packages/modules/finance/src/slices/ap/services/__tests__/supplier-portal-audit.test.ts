/**
 * Phase 1.1.4: Audit Trail service unit tests (CAP-AUDIT).
 *
 * Tests service function:
 *   1. getSupplierAuditLog — paginated, filtered, supplier-scoped read
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getSupplierAuditLog,
  type AuditLogRow,
  type AuditServiceDeps,
  type IAuditLogRepo,
} from './supplier-portal-audit';

// ─── Constants ──────────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<AuditLogRow> = {}): AuditLogRow {
  return {
    id: crypto.randomUUID(),
    tenantId: TENANT_ID,
    userId: USER_ID,
    action: 'UPDATE',
    tableName: 'supplier',
    recordId: SUPPLIER_ID,
    ipAddress: '127.0.0.1',
    occurredAt: new Date('2025-06-01T12:00:00Z'),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<AuditServiceDeps> = {}): AuditServiceDeps {
  return {
    supplierRepo: {
      findById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: SUPPLIER_ID, tenantId: TENANT_ID },
      }),
    } as any,
    auditLogRepo: {
      findByTenantAndTables: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    } as IAuditLogRepo,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getSupplierAuditLog', () => {
  it('returns paginated audit entries', async () => {
    const rows = [
      makeRow({ action: 'INSERT', tableName: 'supplier_case' }),
      makeRow({ action: 'UPDATE', tableName: 'supplier' }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.auditLogRepo.findByTenantAndTables).mockResolvedValue({
      rows,
      total: 2,
    });

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.total).toBe(2);
      expect(result.value.page).toBe(1);
      expect(result.value.limit).toBe(20);
    }
  });

  it('maps action + tableName to human-readable description', async () => {
    const rows = [makeRow({ action: 'INSERT', tableName: 'supplier_case' })];
    const deps = makeDeps();
    vi.mocked(deps.auditLogRepo.findByTenantAndTables).mockResolvedValue({
      rows,
      total: 1,
    });

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items[0].description).toBe('Created Case');
      expect(result.value.items[0].resource).toBe('supplier_case');
      expect(result.value.items[0].action).toBe('INSERT');
    }
  });

  it('returns empty list when no audit entries exist', async () => {
    const deps = makeDeps();

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(0);
      expect(result.value.total).toBe(0);
    }
  });

  it('returns error for non-existent supplier', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue({
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Not found' },
        }),
      } as any,
    });

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: 'bad-id', page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns error for tenant mismatch', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: { id: SUPPLIER_ID, tenantId: 'wrong-tenant' },
        }),
      } as any,
    });

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('filters by resource when specified', async () => {
    const deps = makeDeps();

    await getSupplierAuditLog(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
        resource: 'supplier_case',
      },
      deps
    );

    // Should only pass the single table name to the repo
    expect(deps.auditLogRepo.findByTenantAndTables).toHaveBeenCalledWith(
      TENANT_ID,
      ['supplier_case'],
      { action: undefined },
      1,
      20
    );
  });

  it('filters by action when specified', async () => {
    const deps = makeDeps();

    await getSupplierAuditLog(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
        action: 'UPDATE',
      },
      deps
    );

    expect(deps.auditLogRepo.findByTenantAndTables).toHaveBeenCalledWith(
      TENANT_ID,
      expect.any(Array),
      { action: 'UPDATE' },
      1,
      20
    );
  });

  it('returns empty when resource filter matches no tables', async () => {
    const deps = makeDeps();

    const result = await getSupplierAuditLog(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 20,
        resource: 'non_existent_table',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(0);
      expect(result.value.total).toBe(0);
    }
    // Should NOT have called repo — short-circuited
    expect(deps.auditLogRepo.findByTenantAndTables).not.toHaveBeenCalled();
  });

  it('serializes dates to ISO strings', async () => {
    const date = new Date('2025-06-15T14:30:00.000Z');
    const rows = [makeRow({ occurredAt: date })];
    const deps = makeDeps();
    vi.mocked(deps.auditLogRepo.findByTenantAndTables).mockResolvedValue({
      rows,
      total: 1,
    });

    const result = await getSupplierAuditLog(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items[0].occurredAt).toBe('2025-06-15T14:30:00.000Z');
    }
  });
});
