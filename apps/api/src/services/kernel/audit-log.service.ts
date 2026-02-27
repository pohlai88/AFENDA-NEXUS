import type { DbClient } from '@afenda/db';
import { auditLogs } from '@afenda/db';
import { eq, desc, sql, and } from 'drizzle-orm';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  occurredAt: Date;
}

/**
 * Tenant-scoped audit log query. Returns paginated entries.
 */
export async function getAuditLog(
  db: DbClient,
  tenantId: string,
  opts: { page: number; limit: number; action?: string; tableName?: string }
): Promise<{ data: AuditLogEntry[]; total: number }> {
  const conditions = [eq(auditLogs.tenantId, tenantId)];
  if (opts.action) conditions.push(eq(auditLogs.action, opts.action));
  if (opts.tableName) conditions.push(eq(auditLogs.tableName, opts.tableName));

  const where = and(...conditions);
  const offset = (opts.page - 1) * opts.limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        oldData: auditLogs.oldData,
        newData: auditLogs.newData,
        ipAddress: auditLogs.ipAddress,
        occurredAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.occurredAt))
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(where),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
}
