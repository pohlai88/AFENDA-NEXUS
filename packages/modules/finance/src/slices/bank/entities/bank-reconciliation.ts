/**
 * Bank reconciliation entity — tracks the reconciliation status for a bank account period.
 */

export type ReconciliationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED_OFF';

export interface BankReconciliation {
  readonly id: string;
  readonly tenantId: string;
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
  readonly status: ReconciliationStatus;
  readonly matchedCount: number;
  readonly unmatchedCount: number;
  readonly signedOffAt: Date | null;
  readonly signedOffBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
