import type { TenantTx } from "@afenda/db";
import { outbox } from "@afenda/db";
import type { IOutboxWriter, OutboxEvent } from "../ports/outbox-writer.js";

export class DrizzleOutboxWriter implements IOutboxWriter {
  constructor(private readonly tx: TenantTx) {}

  async write(event: OutboxEvent): Promise<void> {
    await this.tx.insert(outbox).values({
      tenantId: event.tenantId,
      eventType: event.eventType,
      payload: event.payload,
    });
  }
}
