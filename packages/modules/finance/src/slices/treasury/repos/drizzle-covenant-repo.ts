import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { covenants } from '@afenda/db';
import type { Covenant } from '../entities/covenant.js';
import type { ICovenantRepo, CreateCovenantInput } from '../ports/covenant-repo.js';

type Row = typeof covenants.$inferSelect;

function mapToDomain(row: Row): Covenant {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    lenderId: row.lenderId,
    lenderName: row.lenderName,
    covenantType: row.covenantType as Covenant['covenantType'],
    description: row.description,
    thresholdValue: row.thresholdValue,
    currentValue: row.currentValue,
    status: row.status as Covenant['status'],
    testFrequency: row.testFrequency,
    lastTestDate: row.lastTestDate,
    nextTestDate: row.nextTestDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCovenantRepo implements ICovenantRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<Covenant | null> {
    const rows = await this.db.select().from(covenants).where(eq(covenants.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly Covenant[]> {
    const rows = await this.db.select().from(covenants).where(eq(covenants.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly Covenant[]> {
    const rows = await this.db.select().from(covenants);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateCovenantInput): Promise<Covenant> {
    const [row] = await this.db
      .insert(covenants)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }

  async updateTestResult(
    id: string,
    currentValue: number,
    status: Covenant['status'],
    lastTestDate: Date
  ): Promise<Covenant> {
    const [row] = await this.db
      .update(covenants)
      .set({ currentValue, status, lastTestDate })
      .where(eq(covenants.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
