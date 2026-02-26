import type { BankReconciliation } from '../entities/bank-reconciliation.js';

export interface CreateBankReconciliationInput {
  readonly bankAccountId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly statementBalance: bigint;
  readonly glBalance: bigint;
  readonly adjustedStatementBalance: bigint;
  readonly adjustedGlBalance: bigint;
  readonly outstandingChecks: bigint;
  readonly depositsInTransit: bigint;
  readonly difference: bigint;
  readonly currencyCode: string;
  readonly matchedCount: number;
  readonly unmatchedCount: number;
}

export interface IBankReconciliationRepo {
  findById(id: string): Promise<BankReconciliation | null>;
  findByBankAccount(bankAccountId: string): Promise<readonly BankReconciliation[]>;
  findAll(): Promise<readonly BankReconciliation[]>;
  create(tenantId: string, input: CreateBankReconciliationInput): Promise<BankReconciliation>;
  signOff(id: string, signedOffBy: string): Promise<BankReconciliation>;
}
