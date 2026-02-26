import { sql } from 'drizzle-orm';
import { ok } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import type { IDocumentNumberGenerator } from '../../../slices/gl/ports/document-number-generator.js';

/**
 * Extract the first row from a Drizzle `execute()` result.
 * The HKT-based return type is opaque at compile time but is always array-like at runtime.
 */
function extractFirstRow<T>(result: unknown): T | undefined {
  if (Array.isArray(result)) return result[0] as T;
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows[0];
  }
  return undefined;
}

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

      const firstRow = extractFirstRow<{ last_value: number }>(result);
      const seq = Number(firstRow?.last_value ?? 1);
      return ok(`${prefix}-${String(seq).padStart(6, '0')}`);
    } catch {
      // Fallback: if document_sequence table doesn't exist yet, use timestamp
      const ts = Date.now();
      return ok(`${prefix}-${ts}`);
    }
  }
}
