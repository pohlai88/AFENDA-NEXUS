/**
 * @afenda/worker — Background job processor (Graphile Worker).
 *
 * Drains the transactional outbox (erp.outbox) via a Graphile Worker cron task.
 * Uses direct DB connection (bypasses PgBouncer) for LISTEN/NOTIFY support.
 *
 * Tasks:
 *   - drain-outbox: Polls erp.outbox every 10s, dispatches events to handlers
 */
import postgres from "postgres";
import { run, parseCronItems } from "graphile-worker";
import { loadConfig, createLogger } from "@afenda/platform";
import { createDirectClient, createOutboxDrainer } from "@afenda/db";
import {
  createEventHandlerRegistry,
  registerFinanceHandlers,
} from "./event-handlers.js";
import { createDrainOutboxTask } from "./tasks/drain-outbox.js";

const logger = createLogger({ level: "info", service: "afenda-worker" });

async function main(): Promise<void> {
  logger.info("Starting Afenda worker...");

  // 1. Load config
  const config = await loadConfig();

  // 2. Create direct DB client (worker needs LISTEN/NOTIFY, bypasses PgBouncer)
  const db = createDirectClient({ connectionString: config.DATABASE_URL_DIRECT });

  // 3. Create outbox drainer + event handler registry
  const drainer = createOutboxDrainer(db);
  const registry = createEventHandlerRegistry(logger);
  registerFinanceHandlers(registry, logger);

  // 4. Create Graphile Worker task functions
  const drainOutbox = createDrainOutboxTask({ drainer, registry, logger });

  // 5. LISTEN/NOTIFY — subscribe to outbox_new for real-time processing
  const listener = postgres(config.DATABASE_URL_DIRECT, { max: 1, ssl: "require" });
  let draining = false;
  await listener.listen("outbox_new", async (_payload: unknown) => {
    if (draining) return;
    draining = true;
    try {
      logger.info("outbox_new notification received — draining");
      await drainOutbox();
    } catch (err) {
      logger.error("LISTEN drain error", { error: String(err) });
    } finally {
      draining = false;
    }
  });
  logger.info("LISTEN outbox_new — real-time outbox processing active");

  // 6. Define cron schedule (reduced to 60s fallback — LISTEN handles real-time)
  const cronItems = parseCronItems([
    {
      task: "drain-outbox",
      match: "* * * * *",
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
      "drain-outbox": async (_payload, helpers) => {
        helpers.logger.info("drain-outbox cron fallback triggered");
        await drainOutbox();
      },
    },
  });

  logger.info("Worker ready — LISTEN/NOTIFY + cron fallback active");

  // 8. Await runner (blocks until shutdown signal)
  await runner.promise;

  // Cleanup listener on shutdown
  await listener.end();
}

main().catch((err) => {
  logger.error("Fatal error", { error: String(err) });
  process.exit(1);
});
