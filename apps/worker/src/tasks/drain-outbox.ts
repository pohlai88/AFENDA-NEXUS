/**
 * Graphile Worker task: drain-outbox
 *
 * Polls erp.outbox for unprocessed rows, dispatches to event handlers,
 * and marks processed. Uses FOR UPDATE SKIP LOCKED for safe concurrency.
 */
import { randomUUID } from 'node:crypto';
import type { OutboxDrainer } from '@afenda/db';
import type { Logger } from '@afenda/platform';
import { runWithContext } from '@afenda/platform';
import { getEventMeta } from '@afenda/finance/infra';
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
      const correlationId = row.correlationId ?? randomUUID();
      const meta = getEventMeta(row.eventType);
      if (!row.correlationId) {
        logger.warn('Outbox row missing correlationId, generated fallback', {
          outboxId: row.id,
          eventType: row.eventType,
          correlationId,
        });
      }

      logger.info('Processing outbox event', {
        eventType: row.eventType,
        tier: meta.tier,
        family: meta.family,
        correlationId,
        outboxId: row.id,
      });

      try {
        await runWithContext({ correlationId }, async () => {
          await registry.dispatch(row);
        });
        await drainer.markProcessed(row.id);
      } catch (err) {
        logger.error('Failed to process outbox event', {
          outboxId: row.id,
          eventType: row.eventType,
          correlationId,
          error: String(err),
        });
        // Don't mark as processed — will be retried on next poll
      }
    }
  };
}
