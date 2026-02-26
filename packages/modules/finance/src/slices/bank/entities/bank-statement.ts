/**
 * Bank statement entity — imported from bank feeds (OFX, MT940, camt.053).
 */

export type StatementFormat = 'OFX' | 'MT940' | 'CAMT053' | 'CSV' | 'MANUAL';

export interface BankStatement {
  readonly id: string;
  readonly tenantId: string;
  readonly bankAccountId: string;
  readonly bankAccountName: string;
  readonly statementDate: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly openingBalance: bigint;
  readonly closingBalance: bigint;
  readonly currencyCode: string;
  readonly format: StatementFormat;
  readonly lineCount: number;
  readonly importedAt: Date;
  readonly importedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
