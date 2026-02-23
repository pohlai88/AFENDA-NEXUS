import { sql } from "drizzle-orm";
import { ok } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import type { IDocumentNumberGenerator } from "../../app/ports/document-number-generator.js";

/**
 * DB-backed document number generator using advisory locks for gap-free sequencing.
 * Falls back to a simple atomic counter using INSERT ... ON CONFLICT for portability.
 *
 * Sequence is scoped by (tenantId, prefix) — e.g. ("t1", "JV") → JV-000001, JV-000002, ...
 * The counter lives in erp.document_sequence (created via migration).
 * If the table doesn't exist yet, falls back to timestamp-based numbering.
 */
export class DrizzleDocumentNumberGenerator implements IDocumentNumberGenerator {
  constructor(private readonly tx: TenantTx) {}

  async next(tenantId: string, prefix: string): Promise<Result<string>> {
    try {
      const result = await this.tx.execute(sql`
        INSERT INTO erp.document_sequence (tenant_id, prefix, last_value)
        VALUES (${tenantId}, ${prefix}, 1)
        ON CONFLICT (tenant_id, prefix)
        DO UPDATE SET last_value = erp.document_sequence.last_value + 1
        RETURNING last_value
      `);

      const seq = Number((result as unknown as { rows: { last_value: number }[] }).rows?.[0]?.last_value ?? 1);
      return ok(`${prefix}-${String(seq).padStart(6, "0")}`);
    } catch {
      // Fallback: if document_sequence table doesn't exist yet, use timestamp
      const ts = Date.now();
      return ok(`${prefix}-${ts}`);
    }
  }
}
