/**
 * Group entity — represents a legal entity within a consolidation group.
 */

export type GroupEntityType = "PARENT" | "SUBSIDIARY" | "ASSOCIATE" | "JOINT_VENTURE";

export interface GroupEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly name: string;
  readonly entityType: GroupEntityType;
  readonly parentEntityId: string | null;
  readonly baseCurrency: string;
  readonly countryCode: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
