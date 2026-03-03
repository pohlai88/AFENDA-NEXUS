# Phase 1.1.5-1.1.6 Implementation Plan

**Status:** Ready for Development  
**Author:** AI Agent  
**Date:** March 2, 2026  
**Dependencies:** Phases 1.1.1-1.1.4 Complete (282/282 tests passing)

---

## Executive Summary

This document provides a comprehensive, step-by-step blueprint for implementing:

- **Phase 1.1.5:** Company Location Directory (CAP-LOC, P22)
- **Phase 1.1.6:** Senior Management Directory (CAP-DIR, P23)

Both phases are **PRODUCTION-CRITICAL** foundation for escalation workflows (P19
CAP-SOS) and case management (P20 CAP-CASE).

**Zero debugging hell strategy:**

1. ✅ Contract-first development (Zod schemas before code)
2. ✅ Immediate repo implementation (no mock-only testing)
3. ✅ DI wiring validation before route testing
4. ✅ Import path verification (lessons from Phase 1.1.1-1.1.4)
5. ✅ Test-driven layer-by-layer approach

---

## Table of Contents

1. [Requirements Summary](#1-requirements-summary)
2. [Infrastructure Assessment](#2-infrastructure-assessment)
3. [Phase 1.1.5: Company Location Directory](#3-phase-115-company-location-directory-cap-loc)
4. [Phase 1.1.6: Senior Management Directory](#4-phase-116-senior-management-directory-cap-dir)
5. [Lessons Learned from Phases 1.1.1-1.1.4](#5-lessons-learned-from-phases-1114)
6. [Development Workflow](#6-development-workflow)
7. [Testing Strategy](#7-testing-strategy)
8. [Pre-Flight Checklist](#8-pre-flight-checklist)

---

## 1. Requirements Summary

### Phase 1.1.5: Company Location Directory (CAP-LOC, P22)

**User Story:**

> As a supplier, I need to view the buyer's delivery/billing addresses so I can
> correctly reference them on invoices and shipping documents.

**Plan Spec (lines 344-353):**

- Portal page `/portal/company/locations`
- Map view + list with address cards
- Shows: type (HQ, warehouse, billing), primary contact, business hours
- Links from invoice/case screens: "View delivery address" → location card
- **Read-only** (buyer maintains addresses in ERP)
- Can use existing `entity` table OR new `portal_company_location` projection

**Success Criteria:**

- ✅ Supplier can see all company locations for their tenant
- ✅ Each location shows: name, type, full address, contact info, hours
- ✅ Optional map visualization (Phase 2 enhancement)
- ✅ Deep links from invoice/case pages work

### Phase 1.1.6: Senior Management Directory (CAP-DIR, P23)

**User Story:**

> As a supplier, I need to see who manages different buyer departments so I can
> escalate issues to the right person.

**Plan Spec (lines 357-373):**

- Portal page `/portal/company/directory`
- New `portal_directory_entry` table (buyer-curated, NOT auto from HR)
- Fields: `name`, `title`, `department` (enum), `email` (masked),
  `availability`, `isEscalationContact` (for P19 breakglass)
- Department-grouped cards, government-style layout
- **Privacy guard:** No direct phone unless buyer opts in, email via portal
  messaging

**Success Criteria:**

- ✅ Directory shows key buyer contacts by department
- ✅ Escalation contacts flagged (`isEscalationContact` for future P19)
- ✅ Email addresses masked (e.g., `j.smith@...`)
- ✅ Government-inspired professional layout
- ✅ Buyer-admin can CRUD entries (ERP-side, Phase 2)

**Cross-Phase Dependency:**

- P19 CAP-SOS (escalation) reads
  `portal_directory_entry WHERE isEscalationContact = true`
- P20 CAP-CASE (case assignment) can assign to directory entries

---

## 2. Infrastructure Assessment

### Existing Assets ✅

1. **Contracts Package:** `packages/contracts/src/portal/index.ts`
   - SP-2001 (Cases), SP-2002 (Audit), SP-2005 (Onboarding), SP-2006
     (Compliance), SP-2007 (Audit Trail)
   - Pattern: Zod schemas for request/response, `export type` from `z.infer`

2. **Finance Module:** `packages/modules/finance/src/slices/ap/`
   - Services: Define domain types + port interfaces + business logic
   - Repos: `repos/drizzle-*.ts` implements ports with Drizzle ORM
   - Routes: `routes/supplier-portal-routes.ts` (consolidated, 1149 lines)

3. **DB Schema:** `packages/db/src/schema/erp.ts`
   - Full Drizzle schema with RLS enums, relations
   - Import via `@afenda/db` (NOT `/schema` subpath)

4. **Web Frontend:** `apps/web/src/`
   - Portal route group: `app/(supplier-portal)/portal/`
   - Portal features: `features/portal/` (queries, blocks, forms, actions)
   - Pattern: Server Components + React Query for mutations

5. **Portal Routes File:** `supplier-portal-routes.ts`
   - All portal routes registered in single file
   - Pattern: `app.get('/portal/suppliers/:id/resource', ...)`
   - Uses `runtime.withTenant()` for DI scoping

### Missing Infrastructure (To Build) ⚠️

#### Phase 1.1.5 (CAP-LOC):

- ❌ No `portal_company_location` table (need to create OR use existing entity
  table)
- ❌ No contracts: `LocationSchema`, `LocationListSchema`
- ❌ No service: `supplier-portal-location.ts`
- ❌ No repo: `ICompanyLocationRepo` port + Drizzle implementation
- ❌ No route: `/portal/suppliers/:id/locations`
- ❌ No frontend: `/portal/company/locations` page
- ❌ No queries: `getPortalLocations()`

#### Phase 1.1.6 (CAP-DIR):

- ❌ No `portal_directory_entry` table in schema
- ❌ No contracts: `DirectoryEntrySchema`, `DepartmentSchema`
- ❌ No service: `supplier-portal-directory.ts`
- ❌ No repo: `IDirectoryRepo` port + Drizzle implementation
- ❌ No route: `/portal/suppliers/:id/directory`
- ❌ No frontend: `/portal/company/directory` page
- ❌ No queries: `getPortalDirectory()`

---

## 3. Phase 1.1.5: Company Location Directory (CAP-LOC)

### 3.1 Database Schema Decision

**Option A:** Use existing `entity` or `company` tables (if they have addresses)
**Option B:** Create new `portal_company_location` projection table

**Recommendation:** **Option B** (new projection table)

**Rationale:**

1. Portal needs subset of fields (no sensitive HR data)
2. Buyer controls what locations are visible to suppliers
3. Allows future extensions (business hours, contact overrides,
   supplier-specific notes)
4. Avoids coupling to undefined entity schema

**Schema:**

```typescript
// packages/db/src/schema/portal.ts (NEW FILE)
import {
  pgSchema,
  uuid,
  varchar,
  text,
  pgEnum,
  boolean,
  time,
} from 'drizzle-orm/pg-core';
import { tenantCol, timestamps, pkId } from './_common.js';

export const portalSchema = pgSchema('portal');

export const locationTypeEnum = pgEnum('location_type', [
  'HQ',
  'WAREHOUSE',
  'BILLING',
  'SHIPPING',
  'BRANCH',
]);

export const portalCompanyLocations = portalSchema.table('company_location', {
  ...pkId,
  ...tenantCol,
  name: varchar('name', { length: 255 }).notNull(),
  locationType: locationTypeEnum('location_type').notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 50 }),
  businessHoursStart: time('business_hours_start'), // e.g., '09:00:00'
  businessHoursEnd: time('business_hours_end'), // e.g., '17:00:00'
  timezone: varchar('timezone', { length: 50 }), // e.g., 'Asia/Bangkok'
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});
```

**Migration:** Add to existing schema file OR create `portal.ts` schema file.

### 3.2 Contracts (SP-2003: Location Directory)

**File:** `packages/contracts/src/portal/index.ts`

```typescript
// ─── SP-2003: Company Location Directory (Phase 1.1.5 CAP-LOC) ─────────────

export const LocationTypeSchema = z.enum([
  'HQ',
  'WAREHOUSE',
  'BILLING',
  'SHIPPING',
  'BRANCH',
]);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const CompanyLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  locationType: LocationTypeSchema,
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  stateProvince: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  latitude: z.string().nullable(), // Decimal string
  longitude: z.string().nullable(),
  primaryContactName: z.string().nullable(),
  primaryContactEmail: z.string().email().nullable(),
  primaryContactPhone: z.string().nullable(),
  businessHoursStart: z.string().nullable(), // HH:MM format
  businessHoursEnd: z.string().nullable(),
  timezone: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
});
export type CompanyLocation = z.infer<typeof CompanyLocationSchema>;

export const CompanyLocationListSchema = z.object({
  items: z.array(CompanyLocationSchema),
  total: z.number().int(),
});
export type CompanyLocationList = z.infer<typeof CompanyLocationListSchema>;

export const LocationListQuerySchema = z.object({
  locationType: LocationTypeSchema.optional(),
  includeInactive: z.coerce.boolean().default(false),
});
export type LocationListQuery = z.infer<typeof LocationListQuerySchema>;
```

### 3.3 Service Layer

**File:**
`packages/modules/finance/src/slices/ap/services/supplier-portal-location.ts`

**Domain Types:**

```typescript
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

export type LocationType =
  | 'HQ'
  | 'WAREHOUSE'
  | 'BILLING'
  | 'SHIPPING'
  | 'BRANCH';
```

**Port Interface:**

```typescript
export interface ICompanyLocationRepo {
  findByTenantId(
    tenantId: string,
    query: { locationType?: LocationType; includeInactive?: boolean }
  ): Promise<readonly CompanyLocation[]>;
  findById(id: string): Promise<CompanyLocation | null>;
}
```

**Service Function:**

```typescript
export interface GetLocationsRequest {
  tenantId: string;
  locationType?: LocationType;
  includeInactive?: boolean;
}

export interface GetLocationByIdRequest {
  tenantId: string;
  locationId: string;
}

export async function getCompanyLocations(
  req: GetLocationsRequest,
  deps: ApDeps
): Promise<Result<readonly CompanyLocation[]>> {
  if (!deps.companyLocationRepo) {
    return err(
      new AppError(
        'AP_REPO_NOT_CONFIGURED',
        'Location repository not configured'
      )
    );
  }

  const locations = await deps.companyLocationRepo.findByTenantId(
    req.tenantId,
    {
      locationType: req.locationType,
      includeInactive: req.includeInactive ?? false,
    }
  );

  return ok(locations);
}

export async function getCompanyLocationById(
  req: GetLocationByIdRequest,
  deps: ApDeps
): Promise<Result<CompanyLocation>> {
  if (!deps.companyLocationRepo) {
    return err(
      new AppError(
        'AP_REPO_NOT_CONFIGURED',
        'Location repository not configured'
      )
    );
  }

  const location = await deps.companyLocationRepo.findById(req.locationId);
  if (!location) {
    return err(new AppError('AP_LOCATION_NOT_FOUND', 'Location not found'));
  }

  // Tenant scope validation
  if (location.tenantId !== req.tenantId) {
    return err(
      new AppError(
        'AP_SUPPLIER_SCOPE_MISMATCH',
        'Location does not belong to tenant'
      )
    );
  }

  return ok(location);
}
```

### 3.4 Repository Implementation

**File:**
`packages/modules/finance/src/slices/ap/repos/drizzle-company-location-repo.ts`

```typescript
import type { TenantTx } from '@afenda/db/client';
import { portalCompanyLocations } from '@afenda/db'; // Will be added to schema
import { eq, and } from 'drizzle-orm';
import type {
  ICompanyLocationRepo,
  CompanyLocation,
  LocationType,
} from '../services/supplier-portal-location.js';

export class DrizzleCompanyLocationRepo implements ICompanyLocationRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByTenantId(
    tenantId: string,
    query: { locationType?: LocationType; includeInactive?: boolean }
  ): Promise<readonly CompanyLocation[]> {
    const conditions = [eq(portalCompanyLocations.tenantId, tenantId)];

    if (query.locationType) {
      conditions.push(
        eq(portalCompanyLocations.locationType, query.locationType)
      );
    }

    if (!query.includeInactive) {
      conditions.push(eq(portalCompanyLocations.isActive, true));
    }

    const rows = await this.tx
      .select()
      .from(portalCompanyLocations)
      .where(and(...conditions))
      .orderBy(portalCompanyLocations.name);

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<CompanyLocation | null> {
    const row = await this.tx.query.portalCompanyLocations.findFirst({
      where: (l, { eq }) => eq(l.id, id),
    });

    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: any): CompanyLocation {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      locationType: row.locationType,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      stateProvince: row.stateProvince,
      postalCode: row.postalCode,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      primaryContactName: row.primaryContactName,
      primaryContactEmail: row.primaryContactEmail,
      primaryContactPhone: row.primaryContactPhone,
      businessHoursStart: row.businessHoursStart,
      businessHoursEnd: row.businessHoursEnd,
      timezone: row.timezone,
      notes: row.notes,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
```

### 3.5 DI Wiring

**File:** `packages/modules/finance/src/slices/ap/ports/ap-deps.ts`

```typescript
import type { ICompanyLocationRepo } from '../services/supplier-portal-location.js';

export interface ApDeps {
  // ... existing 40+ repos ...
  readonly companyLocationRepo?: ICompanyLocationRepo;
  // ...
}
```

**File:** `packages/modules/finance/src/runtime.ts`

```typescript
import { DrizzleCompanyLocationRepo } from './slices/ap/repos/drizzle-company-location-repo.js';

function buildDeps(tx: TenantTx): FinanceDeps {
  return {
    // ... existing repos ...
    companyLocationRepo: new DrizzleCompanyLocationRepo(tx),
    // ...
  };
}
```

### 3.6 Routes

**File:**
`packages/modules/finance/src/slices/ap/routes/supplier-portal-routes.ts`

Add imports:

```typescript
import { LocationListQuerySchema } from '@afenda/contracts/portal';
import {
  getCompanyLocations,
  getCompanyLocationById,
} from '../services/supplier-portal-location.js';
```

Add routes (around line 1100, after audit routes):

```typescript
// ── CAP-LOC: Company Location Directory ────────────────────────────────

app.get(
  '/portal/suppliers/:id/locations',
  { preHandler: [requirePermission(policy, 'supplier:read')] },
  async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const { tenantId, userId } = extractIdentity(req);
    const query = LocationListQuerySchema.parse(req.query);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return getCompanyLocations(
          {
            tenantId,
            locationType: query.locationType,
            includeInactive: query.includeInactive,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.send({ items: result.value, total: result.value.length })
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);

app.get(
  '/portal/suppliers/:id/locations/:locationId',
  { preHandler: [requirePermission(policy, 'supplier:read')] },
  async (req, reply) => {
    const params = req.params as { id: string; locationId: string };
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return getCompanyLocationById(
          {
            tenantId,
            locationId: params.locationId,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);
```

### 3.7 Frontend Queries

**File:** `apps/web/src/features/portal/queries/portal.queries.ts`

```typescript
// ─── Location Directory ────────────────────────────────────────────────────

export interface PortalLocation {
  id: string;
  name: string;
  locationType: 'HQ' | 'WAREHOUSE' | 'BILLING' | 'SHIPPING' | 'BRANCH';
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  country: string;
  latitude: string | null;
  longitude: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  businessHoursStart: string | null;
  businessHoursEnd: string | null;
  timezone: string | null;
  notes: string | null;
  isActive: boolean;
}

export const getPortalLocations = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    filters?: { locationType?: string }
  ): Promise<ApiResult<PortalLocation[]>> => {
    const client = createApiClient(ctx);
    const params = new URLSearchParams();
    if (filters?.locationType) {
      params.set('locationType', filters.locationType);
    }

    const url = `/portal/suppliers/${supplierId}/locations?${params.toString()}`;
    const res = await client.get<{ items: PortalLocation[]; total: number }>(
      url
    );

    return res.ok ? { ok: true, value: res.value.items } : res;
  }
);

export const getPortalLocationById = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    locationId: string
  ): Promise<ApiResult<PortalLocation>> => {
    const client = createApiClient(ctx);
    return client.get<PortalLocation>(
      `/portal/suppliers/${supplierId}/locations/${locationId}`
    );
  }
);
```

### 3.8 Frontend Page

**File:** `apps/web/src/app/(supplier-portal)/portal/company/page.tsx`

**Note:** Using `/portal/company` instead of `/portal/company/locations` for
Phase 1 simplicity (can be nested route group later).

```typescript
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalLocations } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle, MapPin } from 'lucide-react';
import { LocationCard } from '@/features/portal/blocks/portal-location-card';

export default async function CompanyLocationsPage() {
  const ctx = await getRequestContext();

  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const locationsResult = await getPortalLocations(ctx, supplier.supplierId);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <PageHeader
          title="Company Locations"
          description="Buyer's addresses and facilities for your reference."
        >
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </PageHeader>

        {locationsResult.ok && locationsResult.value.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locationsResult.value.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-semibold">No locations available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Company locations will appear here once configured.
            </p>
          </div>
        )}
      </div>
    </Suspense>
  );
}
```

### 3.9 Frontend Block Component

**File:** `apps/web/src/features/portal/blocks/portal-location-card.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Mail, Phone } from 'lucide-react';
import type { PortalLocation } from '../queries/portal.queries';

interface LocationCardProps {
  location: PortalLocation;
}

const locationTypeLabels: Record<string, string> = {
  HQ: 'Headquarters',
  WAREHOUSE: 'Warehouse',
  BILLING: 'Billing Address',
  SHIPPING: 'Shipping Address',
  BRANCH: 'Branch Office',
};

const locationTypeColors: Record<string, string> = {
  HQ: 'bg-blue-100 text-blue-800',
  WAREHOUSE: 'bg-green-100 text-green-800',
  BILLING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-orange-100 text-orange-800',
  BRANCH: 'bg-gray-100 text-gray-800',
};

export function LocationCard({ location }: LocationCardProps) {
  const fullAddress = [
    location.addressLine1,
    location.addressLine2,
    location.city,
    location.stateProvince,
    location.postalCode,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className={!location.isActive ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{location.name}</CardTitle>
          <Badge variant="secondary" className={locationTypeColors[location.locationType]}>
            {locationTypeLabels[location.locationType] || location.locationType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{fullAddress}</span>
        </div>

        {/* Business Hours */}
        {location.businessHoursStart && location.businessHoursEnd && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {location.businessHoursStart} - {location.businessHoursEnd}
              {location.timezone && ` (${location.timezone})`}
            </span>
          </div>
        )}

        {/* Primary Contact */}
        {location.primaryContactName && (
          <div className="space-y-1 border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{location.primaryContactName}</span>
            </div>
            {location.primaryContactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${location.primaryContactEmail}`}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {location.primaryContactEmail}
                </a>
              </div>
            )}
            {location.primaryContactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{location.primaryContactPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {location.notes && (
          <div className="border-t pt-3 text-sm text-muted-foreground">{location.notes}</div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.10 Tests

**File:**
`packages/modules/finance/src/slices/ap/services/__tests__/supplier-portal-location.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ok } from '@afenda/core';
import type { ApDeps } from '../../ports/ap-deps.js';
import type {
  CompanyLocation,
  ICompanyLocationRepo,
} from '../supplier-portal-location.js';
import {
  getCompanyLocations,
  getCompanyLocationById,
} from '../supplier-portal-location.js';

// ─── Mock Repository ────────────────────────────────────────────────────────

const mockLocations: CompanyLocation[] = [
  {
    id: 'loc-hq-001',
    tenantId: 'tenant-001',
    name: 'Corporate Headquarters',
    locationType: 'HQ',
    addressLine1: '123 Main Street',
    addressLine2: 'Suite 500',
    city: 'Bangkok',
    stateProvince: 'Bangkok',
    postalCode: '10110',
    country: 'TH',
    latitude: '13.7563',
    longitude: '100.5018',
    primaryContactName: 'Jane Smith',
    primaryContactEmail: 'j.smith@company.com',
    primaryContactPhone: '+66-2-123-4567',
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    timezone: 'Asia/Bangkok',
    notes: 'Main reception on 5th floor',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'loc-wh-001',
    tenantId: 'tenant-001',
    name: 'Distribution Center North',
    locationType: 'WAREHOUSE',
    addressLine1: '789 Industrial Road',
    addressLine2: null,
    city: 'Pathum Thani',
    stateProvince: 'Pathum Thani',
    postalCode: '12000',
    country: 'TH',
    latitude: null,
    longitude: null,
    primaryContactName: 'Bob Johnson',
    primaryContactEmail: 'b.johnson@company.com',
    primaryContactPhone: null,
    businessHoursStart: '08:00',
    businessHoursEnd: '17:00',
    timezone: 'Asia/Bangkok',
    notes: null,
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];

class MockCompanyLocationRepo implements ICompanyLocationRepo {
  async findByTenantId(
    tenantId: string,
    query: { locationType?: string; includeInactive?: boolean }
  ): Promise<readonly CompanyLocation[]> {
    let results = mockLocations.filter((l) => l.tenantId === tenantId);

    if (query.locationType) {
      results = results.filter((l) => l.locationType === query.locationType);
    }

    if (!query.includeInactive) {
      results = results.filter((l) => l.isActive);
    }

    return results;
  }

  async findById(id: string): Promise<CompanyLocation | null> {
    return mockLocations.find((l) => l.id === id) ?? null;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getCompanyLocations', () => {
  const mockDeps: ApDeps = {
    companyLocationRepo: new MockCompanyLocationRepo(),
  } as ApDeps;

  it('should return all active locations for tenant', async () => {
    const result = await getCompanyLocations(
      { tenantId: 'tenant-001' },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe('Corporate Headquarters');
      expect(result.value[1].name).toBe('Distribution Center North');
    }
  });

  it('should filter by location type', async () => {
    const result = await getCompanyLocations(
      { tenantId: 'tenant-001', locationType: 'HQ' },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].locationType).toBe('HQ');
    }
  });

  it('should return error when repo not configured', async () => {
    const emptyDeps: ApDeps = {} as ApDeps;
    const result = await getCompanyLocations(
      { tenantId: 'tenant-001' },
      emptyDeps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_REPO_NOT_CONFIGURED');
    }
  });
});

describe('getCompanyLocationById', () => {
  const mockDeps: ApDeps = {
    companyLocationRepo: new MockCompanyLocationRepo(),
  } as ApDeps;

  it('should return location by id', async () => {
    const result = await getCompanyLocationById(
      { tenantId: 'tenant-001', locationId: 'loc-hq-001' },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Corporate Headquarters');
      expect(result.value.locationType).toBe('HQ');
    }
  });

  it('should return error for non-existent location', async () => {
    const result = await getCompanyLocationById(
      { tenantId: 'tenant-001', locationId: 'loc-xxx' },
      mockDeps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_LOCATION_NOT_FOUND');
    }
  });

  it('should validate tenant scope', async () => {
    const result = await getCompanyLocationById(
      { tenantId: 'tenant-999', locationId: 'loc-hq-001' },
      mockDeps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});
```

**Expected:** 6 tests pass

### 3.11 Navigation Update

**File:** `apps/web/src/components/portal/portal-sidebar.tsx` (or similar nav
component)

Add location link:

```typescript
{
  label: 'Company',
  href: '/portal/company',
  icon: 'Building2', // or 'MapPin'
}
```

---

## 4. Phase 1.1.6: Senior Management Directory (CAP-DIR)

### 4.1 Database Schema

**File:** `packages/db/src/schema/portal.ts` (same file as locations)

```typescript
export const departmentEnum = pgEnum('department', [
  'ACCOUNTS_PAYABLE',
  'PROCUREMENT',
  'COMPLIANCE',
  'FINANCE_MANAGEMENT',
  'EXECUTIVE',
  'OPERATIONS',
  'LEGAL',
]);

export const portalDirectoryEntries = portalSchema.table('directory_entry', {
  ...pkId,
  ...tenantCol,
  fullName: varchar('full_name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  department: departmentEnum('department').notNull(),
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  showFullEmail: boolean('show_full_email').notNull().default(false), // Privacy flag
  phoneNumber: varchar('phone_number', { length: 50 }),
  showPhone: boolean('show_phone').notNull().default(false), // Privacy flag
  availability: varchar('availability', { length: 255 }), // e.g., 'Mon-Fri 9am-5pm'
  timezone: varchar('timezone', { length: 50 }),
  bio: text('bio'), // Brief description of responsibilities
  isEscalationContact: boolean('is_escalation_contact')
    .notNull()
    .default(false), // P19 integration
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});
```

### 4.2 Contracts (SP-2004: Directory)

```typescript
// ─── SP-2004: Senior Management Directory (Phase 1.1.6 CAP-DIR) ────────────

export const DepartmentSchema = z.enum([
  'ACCOUNTS_PAYABLE',
  'PROCUREMENT',
  'COMPLIANCE',
  'FINANCE_MANAGEMENT',
  'EXECUTIVE',
  'OPERATIONS',
  'LEGAL',
]);
export type Department = z.infer<typeof DepartmentSchema>;

export const DirectoryEntrySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  title: z.string(),
  department: DepartmentSchema,
  emailAddress: z.string().email(),
  masked: z.boolean(), // True if email is masked (e.g., 'j.smith@...')
  phoneNumber: z.string().nullable(),
  availability: z.string().nullable(),
  timezone: z.string().nullable(),
  bio: z.string().nullable(),
  isEscalationContact: z.boolean(),
});
export type DirectoryEntry = z.infer<typeof DirectoryEntrySchema>;

export const DirectoryListSchema = z.object({
  items: z.array(DirectoryEntrySchema),
  total: z.number().int(),
});
export type DirectoryList = z.infer<typeof DirectoryListSchema>;

export const DirectoryListQuerySchema = z.object({
  department: DepartmentSchema.optional(),
  escalationOnly: z.coerce.boolean().default(false),
});
export type DirectoryListQuery = z.infer<typeof DirectoryListQuerySchema>;
```

### 4.3 Service Layer

**File:**
`packages/modules/finance/src/slices/ap/services/supplier-portal-directory.ts`

```typescript
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApDeps } from '../ports/ap-deps.js';

export type Department =
  | 'ACCOUNTS_PAYABLE'
  | 'PROCUREMENT'
  | 'COMPLIANCE'
  | 'FINANCE_MANAGEMENT'
  | 'EXECUTIVE'
  | 'OPERATIONS'
  | 'LEGAL';

export interface DirectoryEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly fullName: string;
  readonly title: string;
  readonly department: Department;
  readonly emailAddress: string;
  readonly showFullEmail: boolean;
  readonly phoneNumber: string | null;
  readonly showPhone: boolean;
  readonly availability: string | null;
  readonly timezone: string | null;
  readonly bio: string | null;
  readonly isEscalationContact: boolean;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Supplier-facing DTO with privacy applied. */
export interface DirectoryEntryDTO {
  readonly id: string;
  readonly fullName: string;
  readonly title: string;
  readonly department: Department;
  readonly emailAddress: string; // Masked if showFullEmail = false
  readonly masked: boolean;
  readonly phoneNumber: string | null; // Null if showPhone = false
  readonly availability: string | null;
  readonly timezone: string | null;
  readonly bio: string | null;
  readonly isEscalationContact: boolean;
}

export interface IDirectoryRepo {
  findByTenantId(
    tenantId: string,
    query: { department?: Department; escalationOnly?: boolean }
  ): Promise<readonly DirectoryEntry[]>;
  findById(id: string): Promise<DirectoryEntry | null>;
}

export interface GetDirectoryRequest {
  tenantId: string;
  department?: Department;
  escalationOnly?: boolean;
}

export interface GetDirectoryEntryRequest {
  tenantId: string;
  entryId: string;
}

/** Mask email: 'john.smith@company.com' → 'j.smith@...' */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local.charAt(0) + '.' + local.split('.').pop();
  return `${masked}@...`;
}

function applyPrivacy(entry: DirectoryEntry): DirectoryEntryDTO {
  return {
    id: entry.id,
    fullName: entry.fullName,
    title: entry.title,
    department: entry.department,
    emailAddress: entry.showFullEmail
      ? entry.emailAddress
      : maskEmail(entry.emailAddress),
    masked: !entry.showFullEmail,
    phoneNumber: entry.showPhone ? entry.phoneNumber : null,
    availability: entry.availability,
    timezone: entry.timezone,
    bio: entry.bio,
    isEscalationContact: entry.isEscalationContact,
  };
}

export async function getDirectory(
  req: GetDirectoryRequest,
  deps: ApDeps
): Promise<Result<readonly DirectoryEntryDTO[]>> {
  if (!deps.directoryRepo) {
    return err(
      new AppError(
        'AP_REPO_NOT_CONFIGURED',
        'Directory repository not configured'
      )
    );
  }

  const entries = await deps.directoryRepo.findByTenantId(req.tenantId, {
    department: req.department,
    escalationOnly: req.escalationOnly,
  });

  return ok(entries.map(applyPrivacy));
}

export async function getDirectoryEntry(
  req: GetDirectoryEntryRequest,
  deps: ApDeps
): Promise<Result<DirectoryEntryDTO>> {
  if (!deps.directoryRepo) {
    return err(
      new AppError(
        'AP_REPO_NOT_CONFIGURED',
        'Directory repository not configured'
      )
    );
  }

  const entry = await deps.directoryRepo.findById(req.entryId);
  if (!entry) {
    return err(
      new AppError('AP_DIRECTORY_ENTRY_NOT_FOUND', 'Directory entry not found')
    );
  }

  if (entry.tenantId !== req.tenantId) {
    return err(
      new AppError(
        'AP_SUPPLIER_SCOPE_MISMATCH',
        'Entry does not belong to tenant'
      )
    );
  }

  return ok(applyPrivacy(entry));
}
```

### 4.4 Repository Implementation

**File:**
`packages/modules/finance/src/slices/ap/repos/drizzle-directory-repo.ts`

```typescript
import type { TenantTx } from '@afenda/db/client';
import { portalDirectoryEntries } from '@afenda/db';
import { eq, and, asc } from 'drizzle-orm';
import type {
  IDirectoryRepo,
  DirectoryEntry,
  Department,
} from '../services/supplier-portal-directory.js';

export class DrizzleDirectoryRepo implements IDirectoryRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByTenantId(
    tenantId: string,
    query: { department?: Department; escalationOnly?: boolean }
  ): Promise<readonly DirectoryEntry[]> {
    const conditions = [
      eq(portalDirectoryEntries.tenantId, tenantId),
      eq(portalDirectoryEntries.isActive, true),
    ];

    if (query.department) {
      conditions.push(eq(portalDirectoryEntries.department, query.department));
    }

    if (query.escalationOnly) {
      conditions.push(eq(portalDirectoryEntries.isEscalationContact, true));
    }

    const rows = await this.tx
      .select()
      .from(portalDirectoryEntries)
      .where(and(...conditions))
      .orderBy(
        asc(portalDirectoryEntries.displayOrder),
        asc(portalDirectoryEntries.fullName)
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<DirectoryEntry | null> {
    const row = await this.tx.query.portalDirectoryEntries.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });

    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: any): DirectoryEntry {
    return {
      id: row.id,
      tenantId: row.tenantId,
      fullName: row.fullName,
      title: row.title,
      department: row.department,
      emailAddress: row.emailAddress,
      showFullEmail: row.showFullEmail,
      phoneNumber: row.phoneNumber,
      showPhone: row.showPhone,
      availability: row.availability,
      timezone: row.timezone,
      bio: row.bio,
      isEscalationContact: row.isEscalationContact,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
```

### 4.5 DI Wiring

**File:** `packages/modules/finance/src/slices/ap/ports/ap-deps.ts`

```typescript
import type { IDirectoryRepo } from '../services/supplier-portal-directory.js';

export interface ApDeps {
  // ... existing repos ...
  readonly directoryRepo?: IDirectoryRepo;
  // ...
}
```

**File:** `packages/modules/finance/src/runtime.ts`

```typescript
import { DrizzleDirectoryRepo } from './slices/ap/repos/drizzle-directory-repo.js';

function buildDeps(tx: TenantTx): FinanceDeps {
  return {
    // ... existing repos ...
    directoryRepo: new DrizzleDirectoryRepo(tx),
    // ...
  };
}
```

### 4.6 Routes

Add to `supplier-portal-routes.ts`:

```typescript
import { DirectoryListQuerySchema } from '@afenda/contracts/portal';
import {
  getDirectory,
  getDirectoryEntry,
} from '../services/supplier-portal-directory.js';

// ── CAP-DIR: Senior Management Directory ───────────────────────────────

app.get(
  '/portal/suppliers/:id/directory',
  { preHandler: [requirePermission(policy, 'supplier:read')] },
  async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const { tenantId, userId } = extractIdentity(req);
    const query = DirectoryListQuerySchema.parse(req.query);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return getDirectory(
          {
            tenantId,
            department: query.department,
            escalationOnly: query.escalationOnly,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.send({ items: result.value, total: result.value.length })
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);

app.get(
  '/portal/suppliers/:id/directory/:entryId',
  { preHandler: [requirePermission(policy, 'supplier:read')] },
  async (req, reply) => {
    const params = req.params as { id: string; entryId: string };
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return getDirectoryEntry(
          {
            tenantId,
            entryId: params.entryId,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);
```

### 4.7 Frontend Queries

```typescript
// ─── Directory ──────────────────────────────────────────────────────────────

export interface PortalDirectoryEntry {
  id: string;
  fullName: string;
  title: string;
  department: string;
  emailAddress: string;
  masked: boolean;
  phoneNumber: string | null;
  availability: string | null;
  timezone: string | null;
  bio: string | null;
  isEscalationContact: boolean;
}

export const getPortalDirectory = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    filters?: { department?: string }
  ): Promise<ApiResult<PortalDirectoryEntry[]>> => {
    const client = createApiClient(ctx);
    const params = new URLSearchParams();
    if (filters?.department) {
      params.set('department', filters.department);
    }

    const url = `/portal/suppliers/${supplierId}/directory?${params.toString()}`;
    const res = await client.get<{
      items: PortalDirectoryEntry[];
      total: number;
    }>(url);

    return res.ok ? { ok: true, value: res.value.items } : res;
  }
);
```

### 4.8 Frontend Page

**File:** `apps/web/src/app/(supplier-portal)/portal/directory/page.tsx`

```typescript
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalDirectory } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle, Users } from 'lucide-react';
import { DirectorySection } from '@/features/portal/blocks/portal-directory-section';

const departmentLabels: Record<string, string> = {
  ACCOUNTS_PAYABLE: 'Accounts Payable',
  PROCUREMENT: 'Procurement',
  COMPLIANCE: 'Compliance',
  FINANCE_MANAGEMENT: 'Finance Management',
  EXECUTIVE: 'Executive',
  OPERATIONS: 'Operations',
  LEGAL: 'Legal',
};

export default async function DirectoryPage() {
  const ctx = await getRequestContext();

  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const directoryResult = await getPortalDirectory(ctx, supplier.supplierId);

  // Group by department
  const grouped = (directoryResult.ok ? directoryResult.value : []).reduce((acc, entry) => {
    if (!acc[entry.department]) acc[entry.department] = [];
    acc[entry.department].push(entry);
    return acc;
  }, {} as Record<string, typeof directoryResult.value>);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <PageHeader
          title="Company Directory"
          description="Key contacts for escalations and inquiries."
        >
          <Users className="h-5 w-5 text-muted-foreground" />
        </PageHeader>

        {directoryResult.ok && directoryResult.value.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dept, entries]) => (
              <DirectorySection
                key={dept}
                title={departmentLabels[dept] || dept}
                entries={entries}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-semibold">No directory entries available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Company contacts will appear here once configured.
            </p>
          </div>
        )}
      </div>
    </Suspense>
  );
}
```

### 4.9 Frontend Block Components

**File:** `apps/web/src/features/portal/blocks/portal-directory-section.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import type { PortalDirectoryEntry } from '../queries/portal.queries';

interface DirectorySectionProps {
  title: string;
  entries: PortalDirectoryEntry[];
}

export function DirectorySection({ title, entries }: DirectorySectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{entry.fullName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{entry.title}</p>
                </div>
                {entry.isEscalationContact && (
                  <Badge variant="default" className="bg-amber-100 text-amber-800">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Escalation
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Email */}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className={entry.masked ? 'text-muted-foreground' : ''}>
                  {entry.emailAddress}
                </span>
                {entry.masked && (
                  <span className="text-xs text-muted-foreground">(masked)</span>
                )}
              </div>

              {/* Phone */}
              {entry.phoneNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{entry.phoneNumber}</span>
                </div>
              )}

              {/* Availability */}
              {entry.availability && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {entry.availability}
                    {entry.timezone && ` (${entry.timezone})`}
                  </span>
                </div>
              )}

              {/* Bio */}
              {entry.bio && (
                <div className="border-t pt-3 text-sm text-muted-foreground">{entry.bio}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4.10 Tests

**File:**
`packages/modules/finance/src/slices/ap/services/__tests__/supplier-portal-directory.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type { ApDeps } from '../../ports/ap-deps.js';
import type {
  DirectoryEntry,
  IDirectoryRepo,
} from '../supplier-portal-directory.js';
import {
  getDirectory,
  getDirectoryEntry,
} from '../supplier-portal-directory.js';

// ─── Mock Repository ────────────────────────────────────────────────────────

const mockEntries: DirectoryEntry[] = [
  {
    id: 'dir-001',
    tenantId: 'tenant-001',
    fullName: 'Jane Smith',
    title: 'AP Manager',
    department: 'ACCOUNTS_PAYABLE',
    emailAddress: 'jane.smith@company.com',
    showFullEmail: false,
    phoneNumber: '+66-2-123-4567',
    showPhone: false,
    availability: 'Mon-Fri 9am-5pm',
    timezone: 'Asia/Bangkok',
    bio: 'Manages all supplier payment inquiries',
    isEscalationContact: true,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'dir-002',
    tenantId: 'tenant-001',
    fullName: 'Bob Johnson',
    title: 'CFO',
    department: 'EXECUTIVE',
    emailAddress: 'bob.johnson@company.com',
    showFullEmail: true,
    phoneNumber: '+66-2-999-8888',
    showPhone: true,
    availability: 'By appointment',
    timezone: 'Asia/Bangkok',
    bio: null,
    isEscalationContact: true,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

class MockDirectoryRepo implements IDirectoryRepo {
  async findByTenantId(
    tenantId: string,
    query: { department?: string; escalationOnly?: boolean }
  ): Promise<readonly DirectoryEntry[]> {
    let results = mockEntries.filter(
      (e) => e.tenantId === tenantId && e.isActive
    );

    if (query.department) {
      results = results.filter((e) => e.department === query.department);
    }

    if (query.escalationOnly) {
      results = results.filter((e) => e.isEscalationContact);
    }

    return results.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findById(id: string): Promise<DirectoryEntry | null> {
    return mockEntries.find((e) => e.id === id) ?? null;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getDirectory', () => {
  const mockDeps: ApDeps = {
    directoryRepo: new MockDirectoryRepo(),
  } as ApDeps;

  it('should return all directory entries with privacy applied', async () => {
    const result = await getDirectory({ tenantId: 'tenant-001' }, mockDeps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      // CFO (displayOrder 0) should come first
      expect(result.value[0].fullName).toBe('Bob Johnson');
      expect(result.value[1].fullName).toBe('Jane Smith');
    }
  });

  it('should mask email when showFullEmail is false', async () => {
    const result = await getDirectory({ tenantId: 'tenant-001' }, mockDeps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const jane = result.value.find((e) => e.fullName === 'Jane Smith');
      expect(jane?.emailAddress).toBe('j.smith@...');
      expect(jane?.masked).toBe(true);
    }
  });

  it('should show full email when showFullEmail is true', async () => {
    const result = await getDirectory({ tenantId: 'tenant-001' }, mockDeps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const bob = result.value.find((e) => e.fullName === 'Bob Johnson');
      expect(bob?.emailAddress).toBe('bob.johnson@company.com');
      expect(bob?.masked).toBe(false);
    }
  });

  it('should hide phone when showPhone is false', async () => {
    const result = await getDirectory({ tenantId: 'tenant-001' }, mockDeps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const jane = result.value.find((e) => e.fullName === 'Jane Smith');
      expect(jane?.phoneNumber).toBeNull();
    }
  });

  it('should filter by department', async () => {
    const result = await getDirectory(
      { tenantId: 'tenant-001', department: 'ACCOUNTS_PAYABLE' },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].department).toBe('ACCOUNTS_PAYABLE');
    }
  });

  it('should filter escalation contacts only', async () => {
    const result = await getDirectory(
      { tenantId: 'tenant-001', escalationOnly: true },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value.every((e) => e.isEscalationContact)).toBe(true);
    }
  });

  it('should return error when repo not configured', async () => {
    const emptyDeps: ApDeps = {} as ApDeps;
    const result = await getDirectory({ tenantId: 'tenant-001' }, emptyDeps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_REPO_NOT_CONFIGURED');
    }
  });
});

describe('getDirectoryEntry', () => {
  const mockDeps: ApDeps = {
    directoryRepo: new MockDirectoryRepo(),
  } as ApDeps;

  it('should return entry by id with privacy applied', async () => {
    const result = await getDirectoryEntry(
      { tenantId: 'tenant-001', entryId: 'dir-001' },
      mockDeps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fullName).toBe('Jane Smith');
      expect(result.value.emailAddress).toBe('j.smith@...');
      expect(result.value.phoneNumber).toBeNull(); // Hidden
    }
  });

  it('should return error for non-existent entry', async () => {
    const result = await getDirectoryEntry(
      { tenantId: 'tenant-001', entryId: 'dir-xxx' },
      mockDeps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_DIRECTORY_ENTRY_NOT_FOUND');
    }
  });

  it('should validate tenant scope', async () => {
    const result = await getDirectoryEntry(
      { tenantId: 'tenant-999', entryId: 'dir-001' },
      mockDeps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AP_SUPPLIER_SCOPE_MISMATCH');
    }
  });
});
```

**Expected:** 10 tests pass

### 4.11 Navigation Update

Add directory link:

```typescript
{
  label: 'Directory',
  href: '/portal/directory',
  icon: 'Users',
}
```

---

## 5. Lessons Learned from Phases 1.1.1-1.1.4

### Critical Success Patterns ✅

1. **Contract-First Development**
   - Define Zod schemas BEFORE writing service code
   - Ensures API contract stability
   - Example: SP-2001 (Cases), SP-2002 (Audit) schemas guided all downstream
     code

2. **Immediate Repo Implementation**
   - DON'T test services with mocks only
   - CREATE Drizzle implementations immediately after defining ports
   - Example: Phase 1.1.1 service tests passed, but production routes would fail
     (missing repos)

3. **DI Wiring Discipline**
   - Add to BOTH `ApDeps` interface AND `buildDeps()` function
   - Verify with non-null check in service: `if (!deps.repo) throw Error`
   - Example: Phase 1.1.4 audit trail worked because DI was wired correctly

4. **Import Path Precision**
   - Use `@afenda/db` NOT `@afenda/db/schema` (no subpath export)
   - Use kernel domain types: `@afenda/supplier-kernel/domain`
   - Example: Fixed all 3 repo implementations after checking package.json
     exports

5. **Layer-by-Layer Testing**
   - Test after each layer completion: contracts → service → repo → route →
     frontend
   - Catch errors early before they compound
   - Example: 282/282 tests pass because we tested incrementally

### Common Pitfalls 🚨 (Avoided)

1. ❌ **Relying on Mock-Only Tests**
   - **What happened:** Phase 1.1.1-1.1.2 services had 49 passing tests but no
     repo implementations
   - **Fix:** Created DrizzleSupplierCaseRepo, DrizzleCaseTimelineRepo,
     DrizzleOnboardingSubmissionRepo
   - **Lesson:** Tests must cover REAL implementations, not just interfaces

2. ❌ **Incomplete DI Wiring**
   - **What happened:** `IOnboardingSubmissionRepo` imported in service but not
     in `ApDeps`
   - **Fix:** Added to interface + wired in runtime.ts
   - **Lesson:** DI changes require 3 files: service → ap-deps.ts → runtime.ts

3. ❌ **Wrong Import Paths**
   - **What happened:** `@afenda/db/schema` module not found (no subpath export)
   - **Fix:** Changed to `@afenda/db` barrel export
   - **Lesson:** Always verify package.json exports before assuming subpaths
     exist

4. ❌ **Type Import Convenience**
   - **What happened:** Importing `CaseStatus` from service file (not exported)
   - **Fix:** Import from canonical source `@afenda/supplier-kernel/domain`
   - **Lesson:** Don't assume re-exports exist, use original source

### Test Coverage Requirement

- **Minimum:** 80% branch coverage for all service functions
- **Target:** 90%+ for production-critical paths (permissions, validation, state
  transitions)
- **Pattern:** 3 test cases per function — happy path, error path, edge case

---

## 6. Development Workflow

### Step-by-Step Execution (Zero Debugging Hell)

#### Phase 1.1.5 (CAP-LOC) — 8 Steps

1. **Create DB Schema** (~30 min)
   - Add `portalCompanyLocations` table to schema
   - Export from `@afenda/db`
   - Run migration: `pnpm db:generate` then `pnpm db:push`

2. **Create Contracts** (~15 min)
   - Add SP-2003 section to `packages/contracts/src/portal/index.ts`
   - Define `LocationTypeSchema`, `CompanyLocationSchema`,
     `LocationListQuerySchema`
   - Export types

3. **Create Service** (~45 min)
   - File: `supplier-portal-location.ts`
   - Define domain types, port interface, service functions
   - Add error codes to `ap-error-codes.ts`: `LOCATION_NOT_FOUND`,
     `REPO_NOT_CONFIGURED`

4. **Create Repo** (~30 min)
   - File: `drizzle-company-location-repo.ts`
   - Implement `ICompanyLocationRepo` with `findByTenantId()`, `findById()`
   - Use relational queries for simple lookups

5. **Wire DI** (~10 min)
   - Add `companyLocationRepo?: ICompanyLocationRepo` to `ApDeps`
   - Import + instantiate in `runtime.ts`
   - Verify no TypeScript errors

6. **Add Routes** (~20 min)
   - Add 2 endpoints to `supplier-portal-routes.ts`
   - Import service functions
   - Follow existing pattern (tenantId validation, error mapping)

7. **Create Tests** (~45 min)
   - File: `supplier-portal-location.test.ts`
   - Test: list all, filter by type, tenant scope, error cases
   - Target: 6 tests, 100% coverage
   - Run: `pnpm --filter @afenda/finance test supplier-portal-location.test`

8. **Create Frontend** (~60 min)
   - Add queries to `portal.queries.ts`
   - Create page: `/portal/company/page.tsx`
   - Create block: `portal-location-card.tsx`
   - Add nav link
   - Test in browser: `pnpm dev`

**Total Time:** ~4.5 hours

#### Phase 1.1.6 (CAP-DIR) — 8 Steps

1. **Create DB Schema** (~25 min)
   - Add `portalDirectoryEntries` table + `departmentEnum`
   - Export from `@afenda/db`
   - Run migration

2. **Create Contracts** (~15 min)
   - Add SP-2004 section
   - Define `DepartmentSchema`, `DirectoryEntrySchema`,
     `DirectoryListQuerySchema`

3. **Create Service** (~60 min)
   - File: `supplier-portal-directory.ts`
   - Define domain types, DTO types, port interface
   - Implement `maskEmail()` privacy function
   - Service functions: `getDirectory()`, `getDirectoryEntry()`

4. **Create Repo** (~30 min)
   - File: `drizzle-directory-repo.ts`
   - Implement `IDirectoryRepo`
   - Multi-filter query (department, escalationOnly)
   - Order by `displayOrder` + `fullName`

5. **Wire DI** (~10 min)
   - Add `directoryRepo?: IDirectoryRepo` to `ApDeps`
   - Wire in `runtime.ts`

6. **Add Routes** (~20 min)
   - Add 2 endpoints to `supplier-portal-routes.ts`

7. **Create Tests** (~60 min)
   - File: `supplier-portal-directory.test.ts`
   - Test: privacy masking, filtering, escalation-only, errors
   - Target: 10 tests, 100% coverage

8. **Create Frontend** (~75 min)
   - Add queries
   - Create page: `/portal/directory/page.tsx`
   - Create blocks: `portal-directory-section.tsx`
   - Add nav link
   - Test in browser

**Total Time:** ~5 hours

**Combined Total:** ~9.5 hours for both phases

---

## 7. Testing Strategy

### Unit Tests (Service Layer)

**Location:** `packages/modules/finance/src/slices/ap/services/__tests__/`

**Coverage Targets:**

- Service functions: 100% line coverage
- Error branches: All error codes tested
- Edge cases: Empty results, null values, scope violations

**Execution:**

```bash
# Test specific file
pnpm --filter @afenda/finance test supplier-portal-location.test

# Test all portal services
pnpm --filter @afenda/finance test supplier-portal

# Coverage report
pnpm --filter @afenda/finance test:coverage
```

### Integration Tests (Route Layer)

**Location:** `apps/e2e/tests/portal/`

**Scenarios:**

- Authenticated supplier can view own locations
- Authenticated supplier canNOT view other tenant's locations
- Unauthenticated requests return 401
- Invalid filters return 400

**Execution:**

```bash
pnpm --filter @afenda/e2e test portal-location
```

### E2E Tests (Browser)

**Location:** `apps/e2e/tests/portal/`

**Scenarios:**

- Full page load with data
- Empty state rendering
- Card interactions
- Navigation flow

**Execution:**

```bash
pnpm --filter @afenda/e2e test:ui portal-location
```

---

## 8. Pre-Flight Checklist

### Before Starting Development

- [ ] Read full plan document (this file)
- [ ] Review Phase 1.1.1-1.1.4 code patterns (service, repo, route)
- [ ] Verify kernel tests still pass:
      `pnpm --filter @afenda/supplier-kernel test` (expect 201/201)
- [ ] Check DB connection: `pnpm db:studio`
- [ ] Confirm dev server runs: `pnpm dev` (should start without errors)

### After Completing Each Phase

#### Phase 1.1.5 (CAP-LOC) Checklist

- [ ] Schema: `portal_company_location` table exists in DB
- [ ] Contracts: SP-2003 exports in `@afenda/contracts/portal`
- [ ] Service: `supplier-portal-location.ts` with 2 functions
- [ ] Repo: `drizzle-company-location-repo.ts` implements `ICompanyLocationRepo`
- [ ] DI: `companyLocationRepo` wired in `ApDeps` + `runtime.ts`
- [ ] Routes: 2 endpoints added to `supplier-portal-routes.ts`
- [ ] Tests: 6/6 tests pass in `supplier-portal-location.test.ts`
- [ ] Frontend: `/portal/company` page renders with location cards
- [ ] Navigation: "Company" link visible in sidebar
- [ ] TypeScript: Zero errors in modified files
- [ ] Full suite: 288 tests pass (282 baseline + 6 new)

#### Phase 1.1.6 (CAP-DIR) Checklist

- [ ] Schema: `portal_directory_entry` table + `departmentEnum` exist
- [ ] Contracts: SP-2004 exports in `@afenda/contracts/portal`
- [ ] Service: `supplier-portal-directory.ts` with privacy masking
- [ ] Repo: `drizzle-directory-repo.ts` implements `IDirectoryRepo`
- [ ] DI: `directoryRepo` wired in `ApDeps` + `runtime.ts`
- [ ] Routes: 2 endpoints added
- [ ] Tests: 10/10 tests pass in `supplier-portal-directory.test.ts`
- [ ] Frontend: `/portal/directory` page renders with department sections
- [ ] Navigation: "Directory" link visible in sidebar
- [ ] TypeScript: Zero errors
- [ ] Full suite: 298 tests pass (288 + 10 new)

### Final Verification (Both Phases Complete)

- [ ] All 298 unit tests pass
- [ ] Kernel tests unchanged: 201/201
- [ ] No TS errors: `pnpm type-check`
- [ ] Dev server runs: `pnpm dev`
- [ ] Both pages accessible in browser:
  - [ ] http://localhost:3000/portal/company
  - [ ] http://localhost:3000/portal/directory
- [ ] Sidebar navigation works
- [ ] Empty states render correctly (no data)
- [ ] Data states render correctly (with seeded locations/directory)
- [ ] API endpoints return 200 OK with valid auth token
- [ ] API endpoints return 401 without auth token

---

## Appendix A: Error Codes

Add to `ap-error-codes.ts`:

```typescript
// 404 — Location/Directory Not Found
AP_LOCATION_NOT_FOUND: 'AP_LOCATION_NOT_FOUND',
AP_DIRECTORY_ENTRY_NOT_FOUND: 'AP_DIRECTORY_ENTRY_NOT_FOUND',

// 422 — Repo Configuration
AP_REPO_NOT_CONFIGURED: 'AP_REPO_NOT_CONFIGURED',
```

Add to error mapper:

```typescript
case 'AP_LOCATION_NOT_FOUND':
case 'AP_DIRECTORY_ENTRY_NOT_FOUND':
  return 404;
case 'AP_REPO_NOT_CONFIGURED':
  return 500; // Internal configuration error
```

---

## Appendix B: Seed Data (Optional)

For local development testing, create seed script:

**File:** `packages/db/src/seed/portal-seed.ts`

```typescript
import { db } from '../client.js';
import {
  portalCompanyLocations,
  portalDirectoryEntries,
} from '../schema/portal.js';
import { uuidv7 } from '@afenda/core';

const TENANT_ID = 'your-test-tenant-id';

export async function seedPortalData() {
  // Seed locations
  await db.insert(portalCompanyLocations).values([
    {
      id: uuidv7(),
      tenantId: TENANT_ID,
      name: 'Corporate Headquarters',
      locationType: 'HQ',
      addressLine1: '123 Main Street',
      city: 'Bangkok',
      country: 'TH',
      isActive: true,
    },
    {
      id: uuidv7(),
      tenantId: TENANT_ID,
      name: 'Distribution Center North',
      locationType: 'WAREHOUSE',
      addressLine1: '789 Industrial Road',
      city: 'Pathum Thani',
      country: 'TH',
      isActive: true,
    },
  ]);

  // Seed directory
  await db.insert(portalDirectoryEntries).values([
    {
      id: uuidv7(),
      tenantId: TENANT_ID,
      fullName: 'Jane Smith',
      title: 'AP Manager',
      department: 'ACCOUNTS_PAYABLE',
      emailAddress: 'jane.smith@company.com',
      showFullEmail: false,
      isEscalationContact: true,
      displayOrder: 1,
      isActive: true,
    },
    {
      id: uuidv7(),
      tenantId: TENANT_ID,
      fullName: 'Bob Johnson',
      title: 'CFO',
      department: 'EXECUTIVE',
      emailAddress: 'bob.johnson@company.com',
      showFullEmail: true,
      showPhone: true,
      phoneNumber: '+66-2-999-8888',
      isEscalationContact: true,
      displayOrder: 0,
      isActive: true,
    },
  ]);

  console.log('✅ Portal seed data inserted');
}
```

---

## Summary

This plan provides a **complete, step-by-step blueprint** to implement Phases
1.1.5 and 1.1.6 **without debugging hell**:

1. ✅ **Contract-first** Zod schemas ensure API stability
2. ✅ **Immediate repo implementation** avoids mock-only testing pitfalls
3. ✅ **DI wiring discipline** ensures production readiness
4. ✅ **Import path precision** based on verified package exports
5. ✅ **Layer-by-layer testing** catches errors early

**Expected Outcomes:**

- Phase 1.1.5: 6 new tests → **288 total passing**
- Phase 1.1.6: 10 new tests → **298 total passing**
- Zero tech debt carried forward to Phase 1.1.7
- Production-ready foundation for P19 (escalation) and P20 (case management)

**Timeline:** ~9.5 hours total development time (can be split across 2-3 work
sessions)

---

**Next Phase After 1.1.6:** Phase 1.1.7 — Invitation Flow (magic link
onboarding)
