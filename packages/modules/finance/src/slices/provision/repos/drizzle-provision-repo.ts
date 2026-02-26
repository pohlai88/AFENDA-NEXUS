import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { provisions } from '@afenda/db';
import type { Provision } from '../entities/provision.js';
import type { IProvisionRepo, CreateProvisionInput } from '../ports/provision-repo.js';

type Row = typeof provisions.$inferSelect;

function mapToDomain(row: Row): Provision {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    provisionNumber: row.provisionNumber,
    description: row.description,
    provisionType: row.provisionType as Provision['provisionType'],
    status: row.status as Provision['status'],
    recognitionDate: row.recognitionDate,
    expectedSettlementDate: row.expectedSettlementDate,
    initialAmount: row.initialAmount,
    currentAmount: row.currentAmount,
    discountRateBps: row.discountRateBps,
    currencyCode: row.currencyCode,
    glAccountId: row.glAccountId,
    isContingentLiability: row.isContingentLiability,
    contingentLiabilityNote: row.contingentLiabilityNote,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProvisionRepo implements IProvisionRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<Provision | null> {
    const rows = await this.db.select().from(provisions).where(eq(provisions.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly Provision[]> {
    const rows = await this.db.select().from(provisions).where(eq(provisions.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly Provision[]> {
    const rows = await this.db.select().from(provisions);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateProvisionInput): Promise<Provision> {
    const [row] = await this.db
      .insert(provisions)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: Provision['status']): Promise<Provision> {
    const [row] = await this.db
      .update(provisions)
      .set({ status })
      .where(eq(provisions.id, id))
      .returning();
    return mapToDomain(row!);
  }

  async updateAmount(id: string, currentAmount: bigint): Promise<Provision> {
    const [row] = await this.db
      .update(provisions)
      .set({ currentAmount })
      .where(eq(provisions.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
