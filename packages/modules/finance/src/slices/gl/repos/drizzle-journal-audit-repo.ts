import { eq } from "drizzle-orm";
import { ok } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { auditLogs } from "@afenda/db";
import type { JournalAuditEntry } from "../entities/journal-audit.js";
import type { IJournalAuditRepo, AuditLogInput } from "../../../slices/gl/ports/journal-audit-repo.js";

export class DrizzleJournalAuditRepo implements IJournalAuditRepo {
  constructor(private readonly tx: TenantTx) { }

  async log(input: AuditLogInput): Promise<void> {
    await this.tx.insert(auditLogs).values({
      tenantId: input.tenantId,
      userId: input.userId,
      action: `JOURNAL_${input.toStatus}`,
      tableName: "erp.gl_journal",
      recordId: input.journalId,
      oldData: input.fromStatus ? { status: input.fromStatus } : null,
      newData: {
        status: input.toStatus,
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      },
    });
  }

  async findByJournalId(journalId: string): Promise<Result<JournalAuditEntry[]>> {
    const rows = await this.tx.query.auditLogs.findMany({
      where: eq(auditLogs.recordId, journalId),
      orderBy: (t, { asc }) => [asc(t.occurredAt)],
    });

    return ok(
      rows.map((r) => {
        const newData = r.newData as Record<string, unknown> | null;
        return {
          id: r.id,
          journalId: r.recordId!,
          tenantId: r.tenantId,
          fromStatus: (r.oldData as { status: string } | null)?.status as JournalAuditEntry["fromStatus"] ?? null,
          toStatus: (newData?.status as JournalAuditEntry["toStatus"]) ?? "DRAFT",
          userId: r.userId!,
          reason: newData?.reason as string | undefined,
          correlationId: newData?.correlationId as string | undefined,
          occurredAt: r.occurredAt,
        };
      }),
    );
  }
}
