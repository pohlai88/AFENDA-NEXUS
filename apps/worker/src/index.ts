/**
 * @afenda/worker — Background job processor (Graphile Worker).
 *
 * Drains the transactional outbox (erp.outbox) via a Graphile Worker cron task.
 * Uses direct DB connection (bypasses PgBouncer) for LISTEN/NOTIFY support.
 *
 * Tasks:
 *   - drain-outbox: Polls erp.outbox every 10s, dispatches events to handlers
 */
import './tracing.js';
import { createServer } from 'node:http';
import postgres from 'postgres';
import Redis from 'ioredis';
import { run, parseCronItems } from 'graphile-worker';
import { loadConfig, createLogger } from '@afenda/platform';
import { createDirectClient, createDbSession, createOutboxDrainer } from '@afenda/db';
import { createR2Adapter, createMockObjectStore, loadR2Config } from '@afenda/storage';
import { createEventHandlerRegistry, registerFinanceHandlers } from './event-handlers.js';
import { createDrainOutboxTask } from './tasks/drain-outbox.js';

const logger = createLogger({ level: 'info', service: 'afenda-worker' });

async function main(): Promise<void> {
  logger.info('Starting Afenda worker...');

  // 1. Load config
  const config = await loadConfig();

  // 2. Create direct DB client (worker needs LISTEN/NOTIFY, bypasses PgBouncer)
  const db = createDirectClient({
    connectionString: config.DATABASE_URL_DIRECT,
    sslMode: config.DATABASE_SSL_MODE,
  });

  // 3. Create outbox drainer + event handler registry
  const drainer = createOutboxDrainer(db);
  const session = createDbSession({ db });
  const r2Config = loadR2Config(process.env as Record<string, string>);
  const objectStore =
    r2Config.R2_TEST_ENABLED === 'true' || !r2Config.R2_ACCOUNT_ID || !r2Config.R2_ACCESS_KEY_ID
      ? createMockObjectStore()
      : createR2Adapter(r2Config);
  // 3b. Optional Redis for cache invalidation
  const redisUrl = process.env.REDIS_URL;
  let redis: Redis | null = null;
  if (redisUrl) {
    redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
      await redis.connect();
      logger.info('Redis connected for cache invalidation');
    } catch {
      redis = null;
      logger.warn('Redis connection failed — cache invalidation disabled');
    }
  }

  const registry = createEventHandlerRegistry(logger);
  registerFinanceHandlers(registry, logger, {
    objectStore,
    session,
    redis,
    resendApiKey: process.env.RESEND_API_KEY,
  });

  // 4. Create Graphile Worker task functions
  const drainOutbox = createDrainOutboxTask({ drainer, registry, logger });

  // 5. LISTEN/NOTIFY — subscribe to outbox_new for real-time processing
  const listener = postgres(config.DATABASE_URL_DIRECT, { max: 1, ssl: 'require' });
  let draining = false;
  await listener.listen('outbox_new', async (_payload: unknown) => {
    if (draining) return;
    draining = true;
    try {
      logger.info('outbox_new notification received — draining');
      await drainOutbox();
    } catch (err) {
      logger.error('LISTEN drain error', { error: String(err) });
    } finally {
      draining = false;
    }
  });
  logger.info('LISTEN outbox_new — real-time outbox processing active');

  // 6. Define cron schedule (reduced to 60s fallback — LISTEN handles real-time)
  const cronItems = parseCronItems([
    {
      task: 'drain-outbox',
      match: '* * * * *',
      options: { backfillPeriod: 0, maxAttempts: 1 },
    },
  ]);

  // 7. Start Graphile Worker
  const runner = await run({
    connectionString: config.DATABASE_URL_DIRECT,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 5000,
    parsedCronItems: cronItems,
    taskList: {
      'drain-outbox': async (_payload, helpers) => {
        helpers.logger.info('drain-outbox cron fallback triggered');
        await drainOutbox();
      },
    },
  });

  logger.info('Worker ready — LISTEN/NOTIFY + cron fallback active');

  // 8. Health endpoint for container orchestrators
  const healthPort = parseInt(process.env.WORKER_HEALTH_PORT ?? '3002', 10);
  const healthServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'afenda-worker' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  healthServer.listen(healthPort, () => {
    logger.info(`Worker health endpoint listening on :${healthPort}/health`);
  });

  // 9. Await runner (blocks until shutdown signal)
  await runner.promise;

  // Cleanup on shutdown
  healthServer.close();
  if (redis) await redis.quit().catch(() => {});
  await listener.end();
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
