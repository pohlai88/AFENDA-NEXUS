/**
 * Transactional Outbox table — §2.6 / §10 compliance.
 *
 * Written in the same DB transaction as the business change.
 * Drained by the worker process via Graphile Worker.
 */

export interface OutboxRow {
  readonly id: string;
  readonly tenantId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: Date;
  readonly processedAt: Date | null;
}

export interface OutboxWriter {
  write(row: Omit<OutboxRow, "id" | "createdAt" | "processedAt">): Promise<void>;
}

export interface OutboxDrainer {
  drain(batchSize: number): Promise<OutboxRow[]>;
  markProcessed(id: string): Promise<void>;
}

// SQL for reference (applied via migration):
// CREATE TABLE outbox (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   tenant_id UUID NOT NULL,
//   event_type TEXT NOT NULL,
//   payload JSONB NOT NULL DEFAULT '{}',
//   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
//   processed_at TIMESTAMPTZ
// );
// CREATE INDEX idx_outbox_unprocessed ON outbox(created_at) WHERE processed_at IS NULL;
