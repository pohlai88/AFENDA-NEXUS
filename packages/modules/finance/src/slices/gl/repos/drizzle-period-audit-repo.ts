import type { TenantTx } from '@afenda/db';
import { auditLogs } from '@afenda/db';
import type {
  IPeriodAuditRepo,
  PeriodAuditLogInput,
} from '../../../slices/gl/ports/period-audit-repo.js';

export class DrizzlePeriodAuditRepo implements IPeriodAuditRepo {
  constructor(private readonly tx: TenantTx) {}

  async log(input: PeriodAuditLogInput): Promise<void> {
    await this.tx.insert(auditLogs).values({
      tenantId: input.tenantId,
      userId: input.userId,
      action: `PERIOD_${input.toStatus}`,
      tableName: 'erp.fiscal_period',
      recordId: input.periodId,
      oldData: { status: input.fromStatus },
      newData: {
        status: input.toStatus,
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      },
    });
  }
}
