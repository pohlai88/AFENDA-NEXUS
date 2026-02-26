import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

export interface ConnectionOptions {
  connectionString: string;
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
  onnotice?: (notice: postgres.Notice) => void;
  /** sslmode=verify-full for highest security. Default: require. */
  sslMode?: 'require' | 'verify-full';
}

/** Neon-recommended connection params (security + latency). See NEON-DRIZZLE-BEST-PRACTICES.md */
const NEON_CONNECTION_PARAMS = {
  sslmode: 'require',
  channel_binding: 'require',
  sslnegotiation: 'direct', // PG17+; reduces latency ~100ms (Neon connection-latency docs)
} as const;

export interface EnsureNeonConnectionStringOptions {
  /** Use verify-full for highest security (Neon recommends). Requires system CA bundle. */
  sslMode?: 'require' | 'verify-full';
}

/**
 * Ensures Neon connection string includes recommended params (Neon AI rules + docs).
 * - sslmode=require (or verify-full when opts.sslMode), channel_binding=require — security
 * - sslnegotiation=direct — latency (PG17+ clients; ignored by older drivers)
 * Safe to call on already-valid URLs.
 */
export function ensureNeonConnectionString(
  url: string,
  opts?: EnsureNeonConnectionStringOptions
): string {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const sslMode = opts?.sslMode ?? 'require';
    params.set('sslmode', sslMode);
    params.set('channel_binding', 'require');
    if (!params.has('sslnegotiation') || params.get('sslnegotiation') !== 'direct') {
      params.set('sslnegotiation', 'direct');
    }
    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Shared postgres.js options tuned for Neon Postgres.
 *
 * - ssl: "require" — Neon enforces TLS; explicit require prevents downgrade
 * - idle_timeout: 20s — Neon suspends idle computes; release connections before that
 * - connect_timeout: 10s — Neon cold-start is ~500ms; 10s covers worst-case autoscale
 * - max_lifetime: 30min — rotate connections to respect Neon PgBouncer server_lifetime
 * - connection.application_name — identifies connections in pg_stat_activity
 */
function baseOptions(opts: ConnectionOptions, pool: 'pooled' | 'direct') {
  return {
    max: opts.max ?? (pool === 'pooled' ? 10 : 3),
    ssl: 'require' as const,
    idle_timeout: opts.idleTimeout ?? 20,
    connect_timeout: opts.connectTimeout ?? 10,
    max_lifetime: 60 * 30,
    connection: {
      application_name: `afenda_${pool}`,
    },
    onnotice: opts.onnotice,
  };
}

/**
 * Pooled connection — Fastify API, Next.js SSR (high concurrency).
 * Uses Neon PgBouncer endpoint (DATABASE_URL with -pooler suffix).
 *
 * prepare: true (default) — Neon PgBouncer supports protocol-level
 * prepared statements (max_prepared_statements=1000). Do NOT set
 * prepare: false — that disables query plan caching and hurts performance.
 *
 * Pool sizing: max:10 is conservative and safe across Neon's full
 * autoscaling range (0.25→8 CU = 104→3357 max_connections).
 */
export function createPooledClient(opts: ConnectionOptions) {
  const url = ensureNeonConnectionString(opts.connectionString, { sslMode: opts.sslMode });
  const client = postgres(url, baseOptions({ ...opts, connectionString: url }, 'pooled'));
  return drizzle({ client, schema, logger: false });
}

/**
 * Direct connection — Graphile Worker (LISTEN/NOTIFY), drizzle-kit migrate.
 * Uses Neon direct endpoint (DATABASE_URL_DIRECT without -pooler).
 *
 * max:3 — Worker needs few connections; direct bypasses PgBouncer.
 */
export function createDirectClient(opts: ConnectionOptions) {
  const url = ensureNeonConnectionString(opts.connectionString, { sslMode: opts.sslMode });
  const client = postgres(url, baseOptions({ ...opts, connectionString: url }, 'direct'));
  return drizzle({ client, schema, logger: false });
}

/**
 * Read-only connection — for future Neon read replicas (analytics, reporting).
 * Pass DATABASE_URL_READONLY when available. Use for trial balance, financial
 * statements, dashboards. Never use for writes or transactional reads.
 *
 * When connection string is empty/falsy, returns null (caller should fall back
 * to pooled/direct for read-only queries).
 */
export function createReadOnlyClient(opts: ConnectionOptions): DbClient | null {
  const raw = opts.connectionString?.trim();
  if (!raw) return null;
  const url = ensureNeonConnectionString(raw, { sslMode: opts.sslMode });
  const base = baseOptions({ ...opts, connectionString: url }, 'pooled');
  const client = postgres(url, {
    ...base,
    max: opts.max ?? 5,
    connection: { ...base.connection, application_name: 'afenda_readonly' },
  });
  return drizzle({ client, schema, logger: false });
}

export type DbClient = ReturnType<typeof createPooledClient>;
