import type { FiscalPeriod } from '../entities/fiscal-period.js';

export interface PeriodAuditLogInput {
  readonly tenantId: string;
  readonly periodId: string;
  readonly fromStatus: FiscalPeriod['status'];
  readonly toStatus: FiscalPeriod['status'];
  readonly userId: string;
  readonly reason?: string;
  readonly correlationId?: string;
}

export interface IPeriodAuditRepo {
  log(input: PeriodAuditLogInput): Promise<void>;
}
