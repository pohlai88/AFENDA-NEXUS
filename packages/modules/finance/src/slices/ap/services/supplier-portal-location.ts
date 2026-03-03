/**
 * Phase 1.15: Company Location Directory service (CAP-LOC)
 *
 * Exposes buyer's addresses to suppliers for delivery/billing reference.
 * Read-only view. Buyer maintains locations via ERP admin (Phase 2).
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApDeps } from '../ports/ap-deps.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type LocationType = 'HQ' | 'WAREHOUSE' | 'BILLING' | 'SHIPPING' | 'BRANCH';

export interface CompanyLocation {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly locationType: LocationType;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly stateProvince: string | null;
  readonly postalCode: string | null;
  readonly country: string;
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly primaryContactName: string | null;
  readonly primaryContactEmail: string | null;
  readonly primaryContactPhone: string | null;
  readonly businessHoursStart: string | null;
  readonly businessHoursEnd: string | null;
  readonly timezone: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Repository Port ────────────────────────────────────────────────────────

export interface ICompanyLocationRepo {
  findByTenantId(
    tenantId: string,
    query: { locationType?: LocationType; includeInactive?: boolean }
  ): Promise<readonly CompanyLocation[]>;
  findById(id: string): Promise<CompanyLocation | null>;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export interface LocationServiceDeps {
  readonly supplierRepo: any; // ISupplierRepo
  readonly companyLocationRepo: ICompanyLocationRepo;
}

export interface GetLocationsRequest {
  tenantId: string;
  supplierId: string;
  locationType?: LocationType;
  includeInactive?: boolean;
}

export interface GetLocationByIdRequest {
  tenantId: string;
  supplierId: string;
  locationId: string;
}

/**
 * List all company locations for a tenant.
 * Suppliers see this to reference buyer's addresses on invoices/docs.
 */
export async function getCompanyLocations(
  req: GetLocationsRequest,
  deps: LocationServiceDeps
): Promise<Result<readonly CompanyLocation[]>> {
  // Validate supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(req.supplierId);
  if (!supplierResult.ok) {
    return supplierResult;
  }
  if (supplierResult.value.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Supplier does not belong to tenant'));
  }

  const locations = await deps.companyLocationRepo.findByTenantId(req.tenantId, {
    locationType: req.locationType,
    includeInactive: req.includeInactive ?? false,
  });

  return ok(locations);
}

/**
 * Get a single location by ID.
 * Used for deep links from invoice/case detail pages.
 */
export async function getCompanyLocationById(
  req: GetLocationByIdRequest,
  deps: LocationServiceDeps
): Promise<Result<CompanyLocation>> {
  // Validate supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(req.supplierId);
  if (!supplierResult.ok) {
    return supplierResult;
  }
  if (supplierResult.value.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Supplier does not belong to tenant'));
  }

  const location = await deps.companyLocationRepo.findById(req.locationId);
  if (!location) {
    return err(new AppError('AP_LOCATION_NOT_FOUND', 'Location not found'));
  }

  // Tenant scope validation
  if (location.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Location does not belong to tenant'));
  }

  return ok(location);
}
