/**
 * FI-01: Financial instrument entity — IFRS 9.
 */

export type InstrumentClassification = 'AMORTIZED_COST' | 'FVOCI' | 'FVTPL';

export type InstrumentType =
  | 'DEBT_HELD'
  | 'DEBT_ISSUED'
  | 'EQUITY_INVESTMENT'
  | 'DERIVATIVE'
  | 'LOAN_RECEIVABLE'
  | 'TRADE_RECEIVABLE';

export type FairValueLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export interface FinancialInstrument {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly instrumentType: InstrumentType;
  readonly classification: InstrumentClassification;
  readonly fairValueLevel: FairValueLevel | null;
  readonly nominalAmount: bigint;
  readonly carryingAmount: bigint;
  readonly fairValue: bigint | null;
  readonly effectiveInterestRateBps: number;
  readonly contractualRateBps: number;
  readonly currencyCode: string;
  readonly maturityDate: Date | null;
  readonly counterpartyId: string;
  readonly glAccountId: string;
  readonly isDerecognized: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
