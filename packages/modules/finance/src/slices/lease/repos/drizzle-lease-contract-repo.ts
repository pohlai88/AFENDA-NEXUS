import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { leaseContracts } from '@afenda/db';
import type { LeaseContract } from '../entities/lease-contract.js';
import type { ILeaseContractRepo, CreateLeaseContractInput } from '../ports/lease-contract-repo.js';

type Row = typeof leaseContracts.$inferSelect;

function mapToDomain(row: Row): LeaseContract {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    leaseNumber: row.leaseNumber,
    description: row.description,
    lesseeOrLessor: row.lesseeOrLessor as LeaseContract['lesseeOrLessor'],
    leaseType: row.leaseType as LeaseContract['leaseType'],
    status: row.status as LeaseContract['status'],
    counterpartyId: row.counterpartyId,
    counterpartyName: row.counterpartyName,
    assetDescription: row.assetDescription,
    commencementDate: row.commencementDate,
    endDate: row.endDate,
    leaseTermMonths: row.leaseTermMonths,
    currencyCode: row.currencyCode,
    monthlyPayment: row.monthlyPayment,
    annualEscalationBps: row.annualEscalationBps,
    discountRateBps: row.discountRateBps,
    rouAssetAmount: row.rouAssetAmount,
    leaseLiabilityAmount: row.leaseLiabilityAmount,
    isShortTerm: row.isShortTerm,
    isLowValue: row.isLowValue,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleLeaseContractRepo implements ILeaseContractRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<LeaseContract | null> {
    const rows = await this.db
      .select()
      .from(leaseContracts)
      .where(eq(leaseContracts.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly LeaseContract[]> {
    const rows = await this.db
      .select()
      .from(leaseContracts)
      .where(eq(leaseContracts.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly LeaseContract[]> {
    const rows = await this.db.select().from(leaseContracts);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateLeaseContractInput): Promise<LeaseContract> {
    const [row] = await this.db
      .insert(leaseContracts)
      .values({
        tenantId,
        ...input,
      })
      .returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: LeaseContract['status']): Promise<LeaseContract> {
    const [row] = await this.db
      .update(leaseContracts)
      .set({ status })
      .where(eq(leaseContracts.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
