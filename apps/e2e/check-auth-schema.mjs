// Check neon_auth schema tables using fetch-based neon serverless
// Run with: node check-auth-schema.mjs

const connStr = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connStr) throw new Error('No DB URL in env');

// Use the neon http module
const { neon } = await import('../../node_modules/@neondatabase/serverless/index.mjs');

const sql = neon(connStr);

// List all schemas
const schemas = await sql`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`;
console.log(
  'Schemas:',
  schemas.map((r) => r.schema_name)
);

// List neon_auth tables if they exist
const tables = await sql`
  SELECT table_name, table_type 
  FROM information_schema.tables 
  WHERE table_schema = 'neon_auth' 
  ORDER BY table_name
`;
console.log('neon_auth tables:', tables);

// Also check platform schema auth tables
const platTables = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'platform' AND table_name LIKE 'auth_%'
  ORDER BY table_name
`;
console.log(
  'platform auth tables:',
  platTables.map((r) => r.table_name)
);
