import type {
  FinancialInstrument,
  InstrumentClassification,
} from '../entities/financial-instrument.js';

export interface CreateFinInstrumentInput {
  readonly companyId: string;
  readonly instrumentType: FinancialInstrument['instrumentType'];
  readonly classification: InstrumentClassification;
  readonly fairValueLevel: FinancialInstrument['fairValueLevel'];
  readonly nominalAmount: bigint;
  readonly carryingAmount: bigint;
  readonly fairValue: bigint | null;
  readonly effectiveInterestRateBps: number;
  readonly contractualRateBps: number;
  readonly currencyCode: string;
  readonly maturityDate: Date | null;
  readonly counterpartyId: string;
  readonly glAccountId: string;
}

export interface IFinInstrumentRepo {
  findById(id: string): Promise<FinancialInstrument | null>;
  findAll(): Promise<readonly FinancialInstrument[]>;
  findByCompany(companyId: string): Promise<readonly FinancialInstrument[]>;
  create(tenantId: string, input: CreateFinInstrumentInput): Promise<FinancialInstrument>;
  updateClassification(
    id: string,
    classification: InstrumentClassification
  ): Promise<FinancialInstrument>;
  markDerecognized(id: string): Promise<FinancialInstrument>;
}
