import type { IIdempotencyStore } from "./idempotency-store.js";
import type { IOutboxWriter } from "./outbox-writer.js";

export interface SharedDeps {
  readonly idempotencyStore: IIdempotencyStore;
  readonly outboxWriter: IOutboxWriter;
}
