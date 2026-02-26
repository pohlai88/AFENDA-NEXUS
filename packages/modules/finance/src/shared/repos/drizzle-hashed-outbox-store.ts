import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { outbox } from '@afenda/db';
import { getOutboxMeta } from '@afenda/api-kit';
import type { OutboxEvent } from '../ports/outbox-writer.js';
import type { HashedOutboxEntry, IHashedOutboxStore } from '../services/tamper-resistant-outbox.js';

type OutboxRow = typeof outbox.$inferSelect;

function mapToHashed(row: OutboxRow): HashedOutboxEntry {
  return {
    id: row.id,
    eventType: row.eventType,
    createdAt: row.createdAt,
    payload: row.payload,
    contentHash: row.contentHash ?? '',
    previousHash: row.previousHash ?? null,
  };
}

export class DrizzleHashedOutboxStore implements IHashedOutboxStore {
  constructor(private readonly tx: TenantTx) {}

  async writeHashed(
    event: OutboxEvent,
    contentHash: string,
    previousHash: string | null
  ): Promise<HashedOutboxEntry> {
    const meta = getOutboxMeta();
    const [row] = await this.tx
      .insert(outbox)
      .values({
        tenantId: event.tenantId,
        eventType: event.eventType,
        payload: event.payload,
        correlationId: event.correlationId ?? meta.correlationId ?? null,
        contentHash,
        previousHash,
      })
      .returning();

    return mapToHashed(row!);
  }

  async findLatest(tenantId: string): Promise<HashedOutboxEntry | null> {
    const row = await this.tx.query.outbox.findFirst({
      where: eq(outbox.tenantId, tenantId),
      orderBy: [desc(outbox.createdAt), desc(outbox.id)],
    });
    return row ? mapToHashed(row) : null;
  }

  async findRange(
    tenantId: string,
    fromId: string,
    toId: string
  ): Promise<readonly HashedOutboxEntry[]> {
    const rows = await this.tx.query.outbox.findMany({
      where: and(eq(outbox.tenantId, tenantId), gte(outbox.id, fromId), lte(outbox.id, toId)),
      orderBy: [outbox.createdAt, outbox.id],
    });
    return rows.map(mapToHashed);
  }

  async findAll(tenantId: string, limit: number): Promise<readonly HashedOutboxEntry[]> {
    const rows = await this.tx.query.outbox.findMany({
      where: eq(outbox.tenantId, tenantId),
      orderBy: [outbox.createdAt, outbox.id],
      limit,
    });
    return rows.map(mapToHashed);
  }
}
