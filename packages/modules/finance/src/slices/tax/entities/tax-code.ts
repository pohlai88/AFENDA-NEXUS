/**
 * Tax code entity — hierarchical tax code (country → state → city).
 * Supports multi-jurisdiction tax lookups.
 */

export type JurisdictionLevel = "COUNTRY" | "STATE" | "CITY" | "SPECIAL";

export interface TaxCode {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly jurisdictionLevel: JurisdictionLevel;
  readonly countryCode: string;
  readonly stateCode: string | null;
  readonly cityCode: string | null;
  readonly parentId: string | null;
  readonly isCompound: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
