export interface OutboxEvent {
  readonly tenantId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId?: string | null;
}

export interface OutboxEntry {
  readonly id: string;
  readonly eventType: string;
  readonly createdAt: Date;
  readonly payload: unknown;
}

export interface IOutboxWriter {
  write(event: OutboxEvent): Promise<void>;
  findRecent?(limit: number): Promise<OutboxEntry[]>;
}
