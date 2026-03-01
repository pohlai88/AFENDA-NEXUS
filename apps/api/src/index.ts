/**
 * @afenda/api — Fastify REST API server.
 *
 * Thin entry point — delegates to buildApp() for the full Fastify setup,
 * then starts the HTTP listener.
 */
import './tracing.js';
import { loadConfig, createLogger } from '@afenda/platform';
import {
  createPooledClient,
  createReadOnlyClient,
  createDbSession,
  createHealthCheck,
} from '@afenda/db';
import { buildApp } from './build-app.js';
import { autoSeedIfNeeded } from './auto-seed.js';

const logger = createLogger({ level: 'info', service: 'afenda-api' });

async function main(): Promise<void> {
  logger.info('Starting Afenda API server...');

  // 1. Load config
  const config = await loadConfig();

  // 2. Create DB client + session
  const dbOpts = {
    connectionString: config.DATABASE_URL,
    sslMode: config.DATABASE_SSL_MODE,
  };
  const db = createPooledClient(dbOpts);
  const dbReadOnly =
    config.DATABASE_URL_READONLY &&
    createReadOnlyClient({
      connectionString: config.DATABASE_URL_READONLY,
      sslMode: config.DATABASE_SSL_MODE,
    });
  const session = createDbSession({ db });
  const readOnlySession = dbReadOnly ? createDbSession({ db: dbReadOnly }) : null;

  // 2.5. Auto-seed database if enabled (development only, with safeguards)
  await autoSeedIfNeeded(logger);

  // 3. Build Fastify app (plugins, middleware, routes, swagger, rate limiting)
  const app = await buildApp({
    config,
    db,
    session,
    readOnlySession,
    healthCheck: createHealthCheck(db),
    logger,
  });

  // 4. Start server
  const address = await app.listen({ port: config.PORT_API, host: '0.0.0.0' });
  logger.info(`API server ready on ${address}`);
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
