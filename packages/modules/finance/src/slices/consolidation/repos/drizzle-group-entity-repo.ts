import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { groupEntities } from '@afenda/db';
import type { GroupEntity } from '../entities/group-entity.js';
import type { IGroupEntityRepo, CreateGroupEntityInput } from '../ports/group-entity-repo.js';

type Row = typeof groupEntities.$inferSelect;

function mapToDomain(row: Row): GroupEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    name: row.name,
    entityType: row.entityType as GroupEntity['entityType'],
    parentEntityId: row.parentEntityId,
    baseCurrency: row.baseCurrency,
    countryCode: row.countryCode,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleGroupEntityRepo implements IGroupEntityRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<GroupEntity | null> {
    const rows = await this.db
      .select()
      .from(groupEntities)
      .where(eq(groupEntities.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<GroupEntity | null> {
    const rows = await this.db
      .select()
      .from(groupEntities)
      .where(eq(groupEntities.companyId, companyId))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByParent(parentEntityId: string): Promise<readonly GroupEntity[]> {
    const rows = await this.db
      .select()
      .from(groupEntities)
      .where(eq(groupEntities.parentEntityId, parentEntityId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly GroupEntity[]> {
    const rows = await this.db.select().from(groupEntities);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateGroupEntityInput): Promise<GroupEntity> {
    const [row] = await this.db
      .insert(groupEntities)
      .values({
        tenantId,
        companyId: input.companyId,
        name: input.name,
        entityType: input.entityType,
        parentEntityId: input.parentEntityId,
        baseCurrency: input.baseCurrency,
        countryCode: input.countryCode,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(
    id: string,
    input: Partial<CreateGroupEntityInput & { isActive: boolean }>
  ): Promise<GroupEntity> {
    const [row] = await this.db
      .update(groupEntities)
      .set(input)
      .where(eq(groupEntities.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
