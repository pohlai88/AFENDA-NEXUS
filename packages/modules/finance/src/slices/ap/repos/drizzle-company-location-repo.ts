/**
 * Drizzle implementation of ICompanyLocationRepo (Phase 1.1.5 CAP-LOC)
 */
import type { TenantTx } from '@afenda/db';
import { portalCompanyLocations } from '@afenda/db';
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
      conditions.push(eq(portalCompanyLocations.locationType, query.locationType));
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

  private mapToDomain(row: typeof portalCompanyLocations.$inferSelect): CompanyLocation {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      locationType: row.locationType as LocationType,
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
