import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { auditLogs } from '@afenda/db';
import type { IAuditLogRepo, AuditLogRow } from '../services/supplier-portal-audit.js';

/**
 * SP-5005: Audit Log Repository (Drizzle implementation)
 * Reads from audit.audit_log for supplier-facing activity timeline.
 */

export class DrizzleAuditLogRepo implements IAuditLogRepo {
  constructor(private readonly db: TenantTx) {}

  async findByTenantAndTables(
    tenantId: string,
    tables: readonly string[],
    filters: { action?: string; resource?: string },
    page: number,
    limit: number
  ): Promise<{
    rows: readonly AuditLogRow[];
    total: number;
  }> {
    if (tables.length === 0) {
      return { rows: [], total: 0 };
    }

    const conditions: SQL[] = [
      eq(auditLogs.tenantId, tenantId),
      inArray(auditLogs.tableName, [...tables]),
    ];

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(auditLogs)
      .where(and(...conditions));

    const total = countResult?.count ?? 0;

    if (total === 0) {
      return { rows: [], total: 0 };
    }

    // Get paginated rows
    const rows = await this.db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        ipAddress: auditLogs.ipAddress,
        occurredAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.occurredAt))
      .limit(limit)
      .offset(offset);

    return { rows, total };
  }
}
