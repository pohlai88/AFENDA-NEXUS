import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { leaseModifications } from '@afenda/db';
import type { LeaseModification } from '../entities/lease-modification.js';
import type {
  ILeaseModificationRepo,
  CreateLeaseModificationInput,
} from '../ports/lease-modification-repo.js';

type Row = typeof leaseModifications.$inferSelect;

function mapToDomain(row: Row): LeaseModification {
  return {
    id: row.id,
    tenantId: row.tenantId,
    leaseContractId: row.leaseContractId,
    modificationDate: row.modificationDate,
    modificationType: row.modificationType as LeaseModification['modificationType'],
    description: row.description,
    previousLeaseTermMonths: row.previousLeaseTermMonths,
    newLeaseTermMonths: row.newLeaseTermMonths,
    previousMonthlyPayment: row.previousMonthlyPayment,
    newMonthlyPayment: row.newMonthlyPayment,
    previousDiscountRateBps: row.previousDiscountRateBps,
    newDiscountRateBps: row.newDiscountRateBps,
    liabilityAdjustment: row.liabilityAdjustment,
    rouAssetAdjustment: row.rouAssetAdjustment,
    gainLossOnModification: row.gainLossOnModification,
    currencyCode: row.currencyCode,
    modifiedBy: row.modifiedBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleLeaseModificationRepo implements ILeaseModificationRepo {
  constructor(private readonly db: TenantTx) {}

  async findByLease(leaseContractId: string): Promise<readonly LeaseModification[]> {
    const rows = await this.db
      .select()
      .from(leaseModifications)
      .where(eq(leaseModifications.leaseContractId, leaseContractId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateLeaseModificationInput): Promise<LeaseModification> {
    const [row] = await this.db
      .insert(leaseModifications)
      .values({
        tenantId,
        ...input,
      })
      .returning();
    return mapToDomain(row!);
  }
}
