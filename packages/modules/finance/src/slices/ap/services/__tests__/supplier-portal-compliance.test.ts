/**
 * Phase 1.1.3: Compliance Expiry Alerts service unit tests (CAP-COMPL).
 *
 * Tests service functions:
 *   1. supplierGetComplianceSummary — existing (read-only)
 *   2. renewComplianceItem — supplier uploads renewal
 *   3. processItemExpiry — batch scanner for single item
 *   4. getComplianceAlerts — alert log retrieval
 *   5. getComplianceTimeline — synthesized timeline
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  supplierGetComplianceSummary,
  renewComplianceItem,
  processItemExpiry,
  checkComplianceExpiry,
  getComplianceAlerts,
  getComplianceTimeline,
  type SupplierComplianceItem,
  type ComplianceServiceDeps,
  type ISupplierComplianceRepo,
  type IComplianceAlertLogRepo,
  type ComplianceAlertLogEntry,
  type ComplianceAlertType,
} from './supplier-portal-compliance';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';
const ITEM_ID = '00000000-0000-0000-0000-000000000010';
const DOC_ID = '00000000-0000-0000-0000-000000000020';

function makeComplianceItem(
  overrides: Partial<SupplierComplianceItem> = {}
): SupplierComplianceItem {
  return {
    id: ITEM_ID,
    tenantId: TENANT_ID,
    supplierId: SUPPLIER_ID,
    itemType: 'TRADE_LICENSE',
    status: 'VALID',
    issuedDate: new Date('2025-01-01'),
    expiryDate: new Date('2027-01-01'),
    documentId: DOC_ID,
    notes: null,
    lastVerifiedBy: null,
    lastVerifiedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeAlertLog(overrides: Partial<ComplianceAlertLogEntry> = {}): ComplianceAlertLogEntry {
  return {
    id: crypto.randomUUID(),
    tenantId: TENANT_ID,
    complianceItemId: ITEM_ID,
    supplierId: SUPPLIER_ID,
    alertType: 'EXPIRING_30D',
    alertedAt: new Date(),
    supersededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<ComplianceServiceDeps> = {}): ComplianceServiceDeps {
  return {
    supplierRepo: {
      findById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: SUPPLIER_ID, tenantId: TENANT_ID },
      }),
    } as any,
    supplierComplianceRepo: {
      findBySupplierId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findExpiringByTenant: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockImplementation((item) => Promise.resolve(item)),
    } as ISupplierComplianceRepo,
    complianceAlertLogRepo: {
      findActiveAlert: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((entry) => Promise.resolve(entry)),
      supersedeForItem: vi.fn().mockResolvedValue(undefined),
      findBySupplierId: vi.fn().mockResolvedValue([]),
    } as IComplianceAlertLogRepo,
    outboxWriter: {
      write: vi.fn().mockResolvedValue(undefined),
    } as any,
    proofChainWriter: {
      write: vi.fn().mockResolvedValue({ contentHash: 'mock-hash' }),
    } as any,
    ...overrides,
  };
}

// ─── supplierGetComplianceSummary ───────────────────────────────────────────

describe('supplierGetComplianceSummary', () => {
  it('returns empty summary when no items', async () => {
    const deps = makeDeps();
    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(0);
      expect(result.value.overallStatus).toBe('VALID');
      expect(result.value.expiredCount).toBe(0);
      expect(result.value.expiringSoonCount).toBe(0);
    }
  });

  it('detects expired items', async () => {
    const expiredItem = makeComplianceItem({
      expiryDate: new Date('2024-01-01'),
    });
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findBySupplierId).mockResolvedValue([expiredItem]);

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallStatus).toBe('EXPIRED');
      expect(result.value.expiredCount).toBe(1);
      expect(result.value.items[0].status).toBe('EXPIRED');
    }
  });

  it('detects expiring-soon items within 30 days', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const expiringItem = makeComplianceItem({ expiryDate: soon });
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findBySupplierId).mockResolvedValue([expiringItem]);

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallStatus).toBe('EXPIRING_SOON');
      expect(result.value.expiringSoonCount).toBe(1);
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

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: 'missing' },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
      }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

// ─── renewComplianceItem ────────────────────────────────────────────────────

describe('renewComplianceItem', () => {
  it('renews a compliance item with new document and expiry', async () => {
    const item = makeComplianceItem({ expiryDate: new Date('2024-06-01'), status: 'EXPIRED' });
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findById).mockResolvedValue(item);

    const newExpiry = new Date();
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const newDocId = crypto.randomUUID();

    const result = await renewComplianceItem(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        complianceItemId: ITEM_ID,
        documentId: newDocId,
        newExpiryDate: newExpiry,
        notes: 'Renewed license',
      },
      deps
    );

    expect(result.ok).toBe(true);
    expect(deps.complianceAlertLogRepo.supersedeForItem).toHaveBeenCalledWith(TENANT_ID, ITEM_ID);
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_COMPLIANCE_RENEWED',
        tenantId: TENANT_ID,
      })
    );
    expect(deps.proofChainWriter?.write).toHaveBeenCalled();
  });

  it('rejects renewal with past expiry date', async () => {
    const item = makeComplianceItem();
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findById).mockResolvedValue(item);

    const result = await renewComplianceItem(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        complianceItemId: ITEM_ID,
        documentId: DOC_ID,
        newExpiryDate: new Date('2020-01-01'),
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects renewal for non-existent item', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findById).mockResolvedValue(null);

    const result = await renewComplianceItem(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        complianceItemId: 'missing',
        documentId: DOC_ID,
        newExpiryDate: new Date('2028-01-01'),
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects renewal when item belongs to different supplier', async () => {
    const item = makeComplianceItem({ supplierId: 'other-supplier' });
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findById).mockResolvedValue(item);

    const result = await renewComplianceItem(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        complianceItemId: ITEM_ID,
        documentId: DOC_ID,
        newExpiryDate: new Date('2028-01-01'),
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('rejects renewal when tenant does not match', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: { id: SUPPLIER_ID, tenantId: 'different-tenant' },
        }),
      } as any,
    });

    const result = await renewComplianceItem(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        complianceItemId: ITEM_ID,
        documentId: DOC_ID,
        newExpiryDate: new Date('2028-01-01'),
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });
});

// ─── processItemExpiry ──────────────────────────────────────────────────────

describe('processItemExpiry', () => {
  it('sends no alerts for item with no expiry', async () => {
    const item = makeComplianceItem({ expiryDate: null });
    const deps = makeDeps();

    const result = await processItemExpiry(item, deps);

    expect(result.alertsSent).toBe(0);
    expect(result.caseCreated).toBe(false);
  });

  it('sends no alerts for item expiring far in the future', async () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 365);
    const item = makeComplianceItem({ expiryDate: farFuture });
    const deps = makeDeps();

    const result = await processItemExpiry(item, deps);

    expect(result.alertsSent).toBe(0);
    expect(result.caseCreated).toBe(false);
    expect(deps.outboxWriter.write).not.toHaveBeenCalled();
  });

  it('sends 30-day alert for item expiring within 30 days', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 25);
    const item = makeComplianceItem({ expiryDate: soon });
    const deps = makeDeps();

    const result = await processItemExpiry(item, deps);

    expect(result.alertsSent).toBe(1);
    expect(result.caseCreated).toBe(false);
    expect(deps.complianceAlertLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ alertType: 'EXPIRING_30D' })
    );
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_COMPLIANCE_EXPIRING',
      })
    );
  });

  it('sends multiple alerts for items within multiple thresholds', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const item = makeComplianceItem({ expiryDate: soon });
    const deps = makeDeps();

    const result = await processItemExpiry(item, deps);

    // Should trigger 30d, 14d, and 7d alerts
    expect(result.alertsSent).toBe(3);
    expect(result.caseCreated).toBe(false);
    expect(deps.complianceAlertLogRepo.create).toHaveBeenCalledTimes(3);
  });

  it('sends EXPIRED alert and creates case for expired items', async () => {
    const expired = new Date();
    expired.setDate(expired.getDate() - 5);
    const item = makeComplianceItem({ expiryDate: expired });
    const deps = makeDeps();

    const result = await processItemExpiry(item, deps);

    // Should trigger all 4 thresholds (expired + 7d + 14d + 30d)
    expect(result.alertsSent).toBe(4);
    expect(result.caseCreated).toBe(true);

    // Verify the expired event was sent
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_COMPLIANCE_EXPIRED',
      })
    );

    // Verify auto-case creation event
    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUPPLIER_COMPLIANCE_CASE_CREATED',
      })
    );
  });

  it('skips alerts that have already been sent', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 25);
    const item = makeComplianceItem({ expiryDate: soon });
    const deps = makeDeps();

    // 30-day alert already exists
    vi.mocked(deps.complianceAlertLogRepo.findActiveAlert).mockImplementation(
      async (_tenantId, _itemId, alertType) => {
        if (alertType === 'EXPIRING_30D') return makeAlertLog();
        return null;
      }
    );

    const result = await processItemExpiry(item, deps);

    expect(result.alertsSent).toBe(0);
    expect(deps.complianceAlertLogRepo.create).not.toHaveBeenCalled();
  });
});

// ─── checkComplianceExpiry ──────────────────────────────────────────────────

describe('checkComplianceExpiry', () => {
  it('returns zero counts when no items have expiry dates', async () => {
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findExpiringByTenant).mockResolvedValue([]);

    const result = await checkComplianceExpiry({ tenantId: TENANT_ID }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.alertsDispatched).toBe(0);
      expect(result.value.casesCreated).toBe(0);
    }
  });

  it('processes all expiring items and tallies alerts', async () => {
    const expiringItem = makeComplianceItem({
      id: '00000000-0000-0000-0000-000000000011',
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
    });
    const expiredItem = makeComplianceItem({
      id: '00000000-0000-0000-0000-000000000012',
      expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findExpiringByTenant).mockResolvedValue([
      expiringItem,
      expiredItem,
    ]);

    const result = await checkComplianceExpiry({ tenantId: TENANT_ID }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // expiringItem triggers 30d+14d+7d = 3, expiredItem triggers 30d+14d+7d+expired = 4
      expect(result.value.alertsDispatched).toBeGreaterThanOrEqual(2);
      expect(result.value.casesCreated).toBe(1); // only expiredItem creates a case
    }
  });
});

// ─── getComplianceAlerts ────────────────────────────────────────────────────

describe('getComplianceAlerts', () => {
  it('returns alerts for a supplier', async () => {
    const alerts = [
      makeAlertLog({ alertType: 'EXPIRING_30D' }),
      makeAlertLog({ alertType: 'EXPIRING_14D' }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.complianceAlertLogRepo.findBySupplierId).mockResolvedValue(alerts);

    const result = await getComplianceAlerts(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
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

    const result = await getComplianceAlerts(
      { tenantId: TENANT_ID, supplierId: 'missing' },
      {
        supplierRepo: deps.supplierRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
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
          value: { id: SUPPLIER_ID, tenantId: 'other-tenant' },
        }),
      } as any,
    });

    const result = await getComplianceAlerts(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });
});

// ─── getComplianceTimeline ──────────────────────────────────────────────────

describe('getComplianceTimeline', () => {
  it('returns synthesized timeline from items and alerts', async () => {
    const item = makeComplianceItem({
      lastVerifiedBy: USER_ID,
      lastVerifiedAt: new Date('2025-06-01'),
    });
    const alert = makeAlertLog({
      alertedAt: new Date('2025-12-01'),
    });

    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findBySupplierId).mockResolvedValue([item]);
    vi.mocked(deps.complianceAlertLogRepo.findBySupplierId).mockResolvedValue([alert]);

    const result = await getComplianceTimeline(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // item creation + verification + alert = 3 entries
      expect(result.value.length).toBeGreaterThanOrEqual(3);
      const eventTypes = result.value.map((e) => e.eventType);
      expect(eventTypes).toContain('ITEM_CREATED');
      expect(eventTypes).toContain('VERIFIED');
      expect(eventTypes).toContain('ALERT_SENT');
    }
  });

  it('returns timeline sorted newest first', async () => {
    const item1 = makeComplianceItem({
      id: 'item-1',
      createdAt: new Date('2025-01-01'),
    });
    const item2 = makeComplianceItem({
      id: 'item-2',
      itemType: 'KYC',
      createdAt: new Date('2025-06-01'),
    });

    const deps = makeDeps();
    vi.mocked(deps.supplierComplianceRepo.findBySupplierId).mockResolvedValue([item1, item2]);

    const result = await getComplianceTimeline(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok && result.value.length > 1) {
      // Should be sorted newest first
      expect(result.value[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.value[result.value.length - 1].createdAt.getTime()
      );
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

    const result = await getComplianceTimeline(
      { tenantId: TENANT_ID, supplierId: 'missing' },
      {
        supplierRepo: deps.supplierRepo,
        supplierComplianceRepo: deps.supplierComplianceRepo,
        complianceAlertLogRepo: deps.complianceAlertLogRepo,
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
