import { createDirectClient } from '../client.js';

/**
 * Creates a database client for seeding operations.
 * 
 * CRITICAL: Always uses DATABASE_URL_DIRECT (non-pooled connection).
 * Pooled connections use PgBouncer in transaction mode which can cause
 * errors during migrations and long-running seed transactions.
 * 
 * @throws {Error} If DATABASE_URL_DIRECT is not set
 * @throws {Error} If connection string contains '-pooler' (pooled connection)
 */
export function createSeedClient() {
  const connectionString = process.env.DATABASE_URL_DIRECT;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL_DIRECT is required for seeding and migrations.\n' +
      'Set it to your Neon direct (non-pooled) connection string.'
    );
  }
  
  // Hard-fail if pooled connection detected
  const url = new URL(connectionString);
  if (url.hostname.includes('-pooler')) {
    throw new Error(
      'Cannot use pooled connection for seeding.\n' +
      'DATABASE_URL_DIRECT must be a direct connection (without -pooler).\n' +
      `Current hostname: ${url.hostname}\n` +
      'Update your .env file to use the direct connection string from Neon.'
    );
  }
  
  return createDirectClient({ connectionString });
}
