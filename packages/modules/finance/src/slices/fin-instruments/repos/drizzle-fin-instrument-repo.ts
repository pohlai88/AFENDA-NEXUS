import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { financialInstruments } from '@afenda/db';
import type {
  FinancialInstrument,
  InstrumentClassification,
} from '../entities/financial-instrument.js';
import type { IFinInstrumentRepo, CreateFinInstrumentInput } from '../ports/fin-instrument-repo.js';

type Row = typeof financialInstruments.$inferSelect;

function mapToDomain(row: Row): FinancialInstrument {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    instrumentType: row.instrumentType as FinancialInstrument['instrumentType'],
    classification: row.classification as FinancialInstrument['classification'],
    fairValueLevel: row.fairValueLevel as FinancialInstrument['fairValueLevel'],
    nominalAmount: row.nominalAmount,
    carryingAmount: row.carryingAmount,
    fairValue: row.fairValue,
    effectiveInterestRateBps: row.effectiveInterestRateBps,
    contractualRateBps: row.contractualRateBps,
    currencyCode: row.currencyCode,
    maturityDate: row.maturityDate,
    counterpartyId: row.counterpartyId,
    glAccountId: row.glAccountId,
    isDerecognized: row.isDerecognized,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFinInstrumentRepo implements IFinInstrumentRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<FinancialInstrument | null> {
    const rows = await this.db
      .select()
      .from(financialInstruments)
      .where(eq(financialInstruments.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly FinancialInstrument[]> {
    const rows = await this.db.select().from(financialInstruments);
    return rows.map(mapToDomain);
  }

  async findByCompany(companyId: string): Promise<readonly FinancialInstrument[]> {
    const rows = await this.db
      .select()
      .from(financialInstruments)
      .where(eq(financialInstruments.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateFinInstrumentInput): Promise<FinancialInstrument> {
    const [row] = await this.db
      .insert(financialInstruments)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }

  async updateClassification(
    id: string,
    classification: InstrumentClassification
  ): Promise<FinancialInstrument> {
    const [row] = await this.db
      .update(financialInstruments)
      .set({ classification })
      .where(eq(financialInstruments.id, id))
      .returning();
    return mapToDomain(row!);
  }

  async markDerecognized(id: string): Promise<FinancialInstrument> {
    const [row] = await this.db
      .update(financialInstruments)
      .set({ isDerecognized: true })
      .where(eq(financialInstruments.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
