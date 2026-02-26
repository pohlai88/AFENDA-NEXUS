/**
 * Graphile Worker task: drain-outbox
 *
 * Polls erp.outbox for unprocessed rows, dispatches to event handlers,
 * and marks processed. Uses FOR UPDATE SKIP LOCKED for safe concurrency.
 */
import type { OutboxDrainer } from '@afenda/db';
import type { Logger } from '@afenda/platform';
import type { EventHandlerRegistry } from '../event-handlers.js';

const BATCH_SIZE = 50;

export interface DrainOutboxDeps {
  drainer: OutboxDrainer;
  registry: EventHandlerRegistry;
  logger: Logger;
}

export function createDrainOutboxTask(deps: DrainOutboxDeps) {
  const { drainer, registry, logger } = deps;

  return async () => {
    const rows = await drainer.drain(BATCH_SIZE);
    if (rows.length === 0) return;

    logger.info(`Processing ${rows.length} outbox event(s)`);

    for (const row of rows) {
      try {
        await registry.dispatch(row);
        await drainer.markProcessed(row.id);
      } catch (err) {
        logger.error('Failed to process outbox event', {
          outboxId: row.id,
          eventType: row.eventType,
          error: String(err),
        });
        // Don't mark as processed — will be retried on next poll
      }
    }
  };
}
