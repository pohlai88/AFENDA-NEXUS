/**
 * TP-00a: Transfer pricing policy entity — OECD Guidelines.
 * Persisted policy defining the arm's-length method and benchmark range
 * for a company's intercompany transactions.
 */

export interface TpPolicy {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly policyName: string;
  readonly method: string;
  readonly benchmarkLowBps: number;
  readonly benchmarkMedianBps: number;
  readonly benchmarkHighBps: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
