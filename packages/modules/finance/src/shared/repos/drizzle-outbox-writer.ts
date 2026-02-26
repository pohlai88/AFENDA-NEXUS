import { desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { outbox } from '@afenda/db';
import { getOutboxMeta } from '@afenda/api-kit';
import type { IOutboxWriter, OutboxEvent, OutboxEntry } from '../ports/outbox-writer.js';

export class DrizzleOutboxWriter implements IOutboxWriter {
  constructor(private readonly tx: TenantTx) {}

  async write(event: OutboxEvent): Promise<void> {
    const meta = getOutboxMeta();
    await this.tx.insert(outbox).values({
      tenantId: event.tenantId,
      eventType: event.eventType,
      payload: event.payload,
      correlationId: event.correlationId ?? meta.correlationId ?? null,
    });
  }

  async findRecent(limit: number): Promise<OutboxEntry[]> {
    const rows = await this.tx
      .select({
        id: outbox.id,
        eventType: outbox.eventType,
        createdAt: outbox.createdAt,
        payload: outbox.payload,
      })
      .from(outbox)
      .orderBy(desc(outbox.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      createdAt: r.createdAt,
      payload: r.payload,
    }));
  }
}
