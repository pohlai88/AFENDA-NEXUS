import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate as drizzleMigrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Run Drizzle migrations against a direct (non-pooled) connection.
 * Must use DATABASE_URL_DIRECT — drizzle-kit requires direct access.
 *
 * Creates a single-use connection with max:1, runs migrations,
 * then closes the connection cleanly. This prevents the process
 * from hanging after migration completes.
 */
export async function migrate(connectionString: string): Promise<void> {
  const client = postgres(connectionString, {
    max: 1,
    ssl: "require",
    connect_timeout: 30,
    onnotice: () => { },
  });
  const db = drizzle({ client });

  try {
    await drizzleMigrate(db, { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
