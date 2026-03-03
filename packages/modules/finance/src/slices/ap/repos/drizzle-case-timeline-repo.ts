import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierCaseTimeline } from '@afenda/db';
import type {
  CaseTimelineEntry,
  ICaseTimelineRepo,
  TimelineEntryType,
} from '../services/supplier-portal-case.js';

type TimelineRow = typeof supplierCaseTimeline.$inferSelect;

/**
 * SP-3002: Case Timeline Repository (Drizzle implementation)
 * Phase 1.1.1 — append-only stream for case activity
 */

function mapToDomain(row: TimelineRow): CaseTimelineEntry {
  return {
    id: row.id,
    caseId: row.caseId,
    tenantId: row.tenantId,
    entryType: row.entryType as TimelineEntryType,
    refId: row.refId ?? null,
    refType: row.refType ?? null,
    actorId: row.actorId,
    actorType: row.actorType as CaseTimelineEntry['actorType'],
    content: row.content as Record<string, unknown> | null,
    proofHash: row.proofHash ?? null,
    createdAt: row.createdAt,
  };
}

export class DrizzleCaseTimelineRepo implements ICaseTimelineRepo {
  constructor(private readonly tx: TenantTx) {}

  async append(entry: CaseTimelineEntry): Promise<CaseTimelineEntry> {
    const [row] = await this.tx
      .insert(supplierCaseTimeline)
      .values({
        id: entry.id,
        caseId: entry.caseId,
        tenantId: entry.tenantId,
        entryType: entry.entryType,
        refId: entry.refId,
        refType: entry.refType,
        actorId: entry.actorId,
        actorType: entry.actorType,
        content: entry.content as Record<string, unknown>,
        proofHash: entry.proofHash,
      })
      .returning();

    if (!row) throw new Error('Failed to create timeline entry');
    return mapToDomain(row);
  }

  async findByCaseId(
    caseId: string,
    query: { page: number; limit: number; entryType?: TimelineEntryType }
  ): Promise<{ items: readonly CaseTimelineEntry[]; total: number }> {
    const conditions: SQL[] = [eq(supplierCaseTimeline.caseId, caseId)];

    if (query.entryType) {
      conditions.push(eq(supplierCaseTimeline.entryType, query.entryType));
    }

    const where = and(...conditions);
    const offset = (query.page - 1) * query.limit;

    const [countResult] = await this.tx
      .select({ count: count() })
      .from(supplierCaseTimeline)
      .where(where);

    const total = countResult?.count ?? 0;

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const rows = await this.tx
      .select()
      .from(supplierCaseTimeline)
      .where(where)
      .orderBy(desc(supplierCaseTimeline.createdAt))
      .limit(query.limit)
      .offset(offset);

    return {
      items: rows.map(mapToDomain),
      total,
    };
  }
}
