/**
 * Phase 1.1.6: Senior Management Directory service unit tests (CAP-DIR).
 *
 * Tests service functions:
 *   1. getDirectory — list directory entries with privacy controls
 *   2. getDirectoryEntry — get specific entry details with privacy masking
 *   3. maskEmail — email privacy function
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getDirectory,
  getDirectoryEntry,
  maskEmail,
  type DirectoryEntry,
  type DirectoryServiceDeps,
  type IDirectoryRepo,
} from './supplier-portal-directory';
import { err, AppError } from '@afenda/core';

// ─── Constants ──────────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const ENTRY_ID = '00000000-0000-0000-0000-000000000003';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<DirectoryEntry> = {}): DirectoryEntry {
  const now = new Date();
  return {
    id: ENTRY_ID,
    tenantId: TENANT_ID,
    fullName: 'John Smith',
    title: 'Chief Financial Officer',
    department: 'FINANCE_MANAGEMENT',
    emailAddress: 'john.smith@company.com',
    showFullEmail: false,
    phoneNumber: '+1-555-0100',
    showPhone: false,
    availability: 'Mon-Fri 9-5 Pacific',
    timezone: 'America/Los_Angeles',
    bio: 'CFO with 15 years experience',
    isEscalationContact: true,
    displayOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeDeps(overrides: Partial<DirectoryServiceDeps> = {}): DirectoryServiceDeps {
  return {
    supplierRepo: {
      findById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: SUPPLIER_ID, tenantId: TENANT_ID },
      }),
    } as any,
    directoryRepo: {
      findByTenantId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
    } as IDirectoryRepo,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('maskEmail', () => {
  it('masks simple email addresses', () => {
    expect(maskEmail('john@company.com')).toBe('j@...');
  });

  it('masks email with first and last name', () => {
    expect(maskEmail('john.smith@company.com')).toBe('j.smith@...');
  });

  it('masks email with multiple parts', () => {
    expect(maskEmail('john.q.smith@company.com')).toBe('j.smith@...');
  });

  it('handles single character local part', () => {
    expect(maskEmail('j@company.com')).toBe('j@...');
  });

  it('preserves last part of local name', () => {
    expect(maskEmail('jane.doe.marketing@company.com')).toBe('j.marketing@...');
  });
});

describe('getDirectory', () => {
  it('returns all directory entries with privacy applied', async () => {
    const entries = [
      makeEntry({ fullName: 'John Smith', showFullEmail: false }),
      makeEntry({
        id: '2',
        fullName: 'Jane Doe',
        emailAddress: 'jane.doe@company.com',
        showFullEmail: true,
      }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findByTenantId).mockResolvedValue(entries);

    const result = await getDirectory({ tenantId: TENANT_ID, supplierId: SUPPLIER_ID }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      // First entry: email masked
      expect(result.value[0].emailAddress).toBe('j.smith@...');
      expect(result.value[0].masked).toBe(true);
      // Second entry: full email shown
      expect(result.value[1].emailAddress).toBe('jane.doe@company.com');
      expect(result.value[1].masked).toBe(false);
    }
  });

  it('hides phone numbers when showPhone is false', async () => {
    const entries = [
      makeEntry({ phoneNumber: '+1-555-0100', showPhone: false }),
      makeEntry({ id: '2', phoneNumber: '+1-555-0200', showPhone: true }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findByTenantId).mockResolvedValue(entries);

    const result = await getDirectory({ tenantId: TENANT_ID, supplierId: SUPPLIER_ID }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].phoneNumber).toBeNull();
      expect(result.value[1].phoneNumber).toBe('+1-555-0200');
    }
  });

  it('filters by department when specified', async () => {
    const entries = [makeEntry({ department: 'ACCOUNTS_PAYABLE' })];
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findByTenantId).mockResolvedValue(entries);

    const result = await getDirectory(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, department: 'ACCOUNTS_PAYABLE' },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].department).toBe('ACCOUNTS_PAYABLE');
    }
    expect(deps.directoryRepo.findByTenantId).toHaveBeenCalledWith(TENANT_ID, {
      department: 'ACCOUNTS_PAYABLE',
      escalationOnly: undefined,
    });
  });

  it('filters to escalation contacts only when specified', async () => {
    const entries = [makeEntry({ isEscalationContact: true })];
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findByTenantId).mockResolvedValue(entries);

    const result = await getDirectory(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, escalationOnly: true },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].isEscalationContact).toBe(true);
    }
    expect(deps.directoryRepo.findByTenantId).toHaveBeenCalledWith(TENANT_ID, {
      department: undefined,
      escalationOnly: true,
    });
  });

  it('returns error when supplier not found', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue(err(new AppError('NOT_FOUND', 'Supplier not found'))),
      } as any,
    });

    const result = await getDirectory({ tenantId: TENANT_ID, supplierId: SUPPLIER_ID }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns error when supplier belongs to different tenant', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: { id: SUPPLIER_ID, tenantId: 'different-tenant' },
        }),
      } as any,
    });

    const result = await getDirectory({ tenantId: TENANT_ID, supplierId: SUPPLIER_ID }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});

describe('getDirectoryEntry', () => {
  it('returns entry details with privacy applied', async () => {
    const entry = makeEntry({ showFullEmail: false, showPhone: false });
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findById).mockResolvedValue(entry);

    const result = await getDirectoryEntry(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, entryId: ENTRY_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(ENTRY_ID);
      expect(result.value.emailAddress).toBe('j.smith@...');
      expect(result.value.masked).toBe(true);
      expect(result.value.phoneNumber).toBeNull();
    }
  });

  it('shows full email when showFullEmail is true', async () => {
    const entry = makeEntry({ showFullEmail: true });
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findById).mockResolvedValue(entry);

    const result = await getDirectoryEntry(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, entryId: ENTRY_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.emailAddress).toBe('john.smith@company.com');
      expect(result.value.masked).toBe(false);
    }
  });

  it('returns error when entry not found', async () => {
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findById).mockResolvedValue(null);

    const result = await getDirectoryEntry(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, entryId: 'nonexistent' },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_DIRECTORY_ENTRY_NOT_FOUND');
    }
  });

  it('returns error when entry belongs to different tenant', async () => {
    const entry = makeEntry({ tenantId: 'different-tenant' });
    const deps = makeDeps();
    vi.mocked(deps.directoryRepo.findById).mockResolvedValue(entry);

    const result = await getDirectoryEntry(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, entryId: ENTRY_ID },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});
