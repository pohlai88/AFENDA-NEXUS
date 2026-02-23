import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export interface ConnectionOptions {
  connectionString: string;
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
  onnotice?: (notice: postgres.Notice) => void;
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
function baseOptions(opts: ConnectionOptions, pool: "pooled" | "direct") {
  return {
    max: opts.max ?? (pool === "pooled" ? 10 : 3),
    ssl: "require" as const,
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
  const client = postgres(opts.connectionString, baseOptions(opts, "pooled"));
  return drizzle({ client, schema, logger: false });
}

/**
 * Direct connection — Graphile Worker (LISTEN/NOTIFY), drizzle-kit migrate.
 * Uses Neon direct endpoint (DATABASE_URL_DIRECT without -pooler).
 *
 * max:3 — Worker needs few connections; direct bypasses PgBouncer.
 */
export function createDirectClient(opts: ConnectionOptions) {
  const client = postgres(opts.connectionString, baseOptions(opts, "direct"));
  return drizzle({ client, schema, logger: false });
}

export type DbClient = ReturnType<typeof createPooledClient>;
