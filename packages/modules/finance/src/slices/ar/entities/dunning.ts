export type DunningRunStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'CANCELLED';
export type DunningLevel = 1 | 2 | 3 | 4;

export interface DunningRun {
  readonly id: string;
  readonly tenantId: string;
  readonly runDate: Date;
  readonly status: DunningRunStatus;
  readonly letters: readonly DunningLetter[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DunningLetter {
  readonly id: string;
  readonly dunningRunId: string;
  readonly customerId: string;
  readonly level: DunningLevel;
  readonly invoiceIds: readonly string[];
  readonly totalOverdue: bigint;
  readonly currencyCode: string;
  readonly sentAt: Date | null;
}
