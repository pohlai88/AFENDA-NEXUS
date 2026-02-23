export interface OutboxEvent {
  readonly tenantId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

export interface IOutboxWriter {
  write(event: OutboxEvent): Promise<void>;
}
