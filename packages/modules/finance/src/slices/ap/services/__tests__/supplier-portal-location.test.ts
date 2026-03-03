/**
 * Phase 1.1.5: Company Location Directory service unit tests (CAP-LOC).
 *
 * Tests service functions:
 *   1. getCompanyLocations — list all locations for a supplier
 *   2. getCompanyLocationById — get specific location details
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getCompanyLocations,
  getCompanyLocationById,
  type CompanyLocation,
  type LocationServiceDeps,
  type ICompanyLocationRepo,
} from './supplier-portal-location';
import { err, AppError } from '@afenda/core';

// ─── Constants ──────────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const LOCATION_ID = '00000000-0000-0000-0000-000000000003';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeLocation(overrides: Partial<CompanyLocation> = {}): CompanyLocation {
  const now = new Date();
  return {
    id: LOCATION_ID,
    tenantId: TENANT_ID,
    name: 'Main Office',
    locationType: 'HQ',
    addressLine1: '123 Business St',
    addressLine2: null,
    city: 'Seattle',
    stateProvince: 'WA',
    postalCode: '98101',
    country: 'US',
    latitude: '47.6062',
    longitude: '-122.3321',
    primaryContactName: 'John Doe',
    primaryContactEmail: 'john.doe@company.com',
    primaryContactPhone: '+1-555-0100',
    businessHoursStart: '09:00',
    businessHoursEnd: '17:00',
    timezone: 'America/Los_Angeles',
    notes: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeDeps(overrides: Partial<LocationServiceDeps> = {}): LocationServiceDeps {
  return {
    supplierRepo: {
      findById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: SUPPLIER_ID, tenantId: TENANT_ID },
      }),
    } as any,
    companyLocationRepo: {
      findByTenantId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
    } as ICompanyLocationRepo,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getCompanyLocations', () => {
  it('returns all active locations when no filters provided', async () => {
    const locations = [
      makeLocation({ id: '1', name: 'HQ', locationType: 'HQ' }),
      makeLocation({ id: '2', name: 'Warehouse', locationType: 'WAREHOUSE' }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findByTenantId).mockResolvedValue(locations);

    const result = await getCompanyLocations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe('HQ');
      expect(result.value[1].name).toBe('Warehouse');
    }
  });

  it('filters by location type when specified', async () => {
    const locations = [makeLocation({ locationType: 'WAREHOUSE' })];
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findByTenantId).mockResolvedValue(locations);

    const result = await getCompanyLocations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, locationType: 'WAREHOUSE' },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].locationType).toBe('WAREHOUSE');
    }
    expect(deps.companyLocationRepo.findByTenantId).toHaveBeenCalledWith(TENANT_ID, {
      locationType: 'WAREHOUSE',
      includeInactive: false,
    });
  });

  it('includes inactive locations when includeInactive is true', async () => {
    const locations = [
      makeLocation({ isActive: true }),
      makeLocation({ id: '2', isActive: false }),
    ];
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findByTenantId).mockResolvedValue(locations);

    const result = await getCompanyLocations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, includeInactive: true },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
    expect(deps.companyLocationRepo.findByTenantId).toHaveBeenCalledWith(TENANT_ID, {
      locationType: undefined,
      includeInactive: true,
    });
  });

  it('returns error when supplier not found', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue(err(new AppError('NOT_FOUND', 'Supplier not found'))),
      } as any,
    });

    const result = await getCompanyLocations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

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

    const result = await getCompanyLocations(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});

describe('getCompanyLocationById', () => {
  it('returns location details when found', async () => {
    const location = makeLocation();
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findById).mockResolvedValue(location);

    const result = await getCompanyLocationById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, locationId: LOCATION_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(LOCATION_ID);
      expect(result.value.name).toBe('Main Office');
    }
  });

  it('returns error when location not found', async () => {
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findById).mockResolvedValue(null);

    const result = await getCompanyLocationById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, locationId: 'nonexistent' },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_LOCATION_NOT_FOUND');
    }
  });

  it('returns error when location belongs to different tenant', async () => {
    const location = makeLocation({ tenantId: 'different-tenant' });
    const deps = makeDeps();
    vi.mocked(deps.companyLocationRepo.findById).mockResolvedValue(location);

    const result = await getCompanyLocationById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, locationId: LOCATION_ID },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});
