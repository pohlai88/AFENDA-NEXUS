import pg from 'pg';
const { Client } = pg;

const connStr = process.env.DATABASE_URL_DIRECT;
if (!connStr) throw new Error('DATABASE_URL_DIRECT not set');

const c = new Client({ connectionString: connStr, ssl: true });
await c.connect();

// Check neon_auth schema tables
const tables = await c.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'neon_auth' ORDER BY table_name"
);
console.log(
  'neon_auth tables:',
  tables.rows.map((r) => r.table_name)
);

// Check users table
const users = await c
  .query('SELECT * FROM neon_auth.users_sync LIMIT 10')
  .catch(() =>
    c.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'neon_auth'"
    )
  );
console.log('users/columns:', JSON.stringify(users.rows, null, 2));

await c.end();
