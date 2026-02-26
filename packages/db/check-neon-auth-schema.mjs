/**
 * Query the neon_auth schema to find the users table and verify email.
 * Run from packages/db directory which has postgres driver available.
 */
import postgres from 'postgres';

const connStr = process.env.DATABASE_URL_DIRECT;
if (!connStr) throw new Error('DATABASE_URL_DIRECT not set');

const sql = postgres(connStr, { ssl: 'require', max: 1 });

// 1. List schemas
const schemas = await sql`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`;
console.log(
  'Schemas:',
  schemas.map((r) => r.schema_name)
);

// 2. List user-related tables in neon_auth and platform
const tables = await sql`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema IN ('neon_auth', 'platform') 
    AND table_name ILIKE '%user%'
  ORDER BY table_schema, table_name
`;
console.log('User tables:', tables);

// 3. Check columns in platform.auth_user
const cols = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'platform' AND table_name = 'auth_user'
  ORDER BY ordinal_position
`;
console.log('platform.auth_user columns:', cols);

// 4. Check if neon_auth tables exist
const neonAuthTables = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'neon_auth'
  ORDER BY table_name
`;
console.log('neon_auth tables:', neonAuthTables);

// 5. Check neon_auth.user columns
const neonUserCols = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns 
  WHERE table_schema = 'neon_auth' AND table_name = 'user'
  ORDER BY ordinal_position
`;
console.log('neon_auth.user columns:', JSON.stringify(neonUserCols, null, 2));

// 6. Show test user if exists
const email = process.env.E2E_EMAIL || 'e2e@afenda.test';
const testUser = await sql`
  SELECT id, email, "emailVerified", "createdAt" 
  FROM neon_auth.user 
  WHERE email = ${email}
`;
console.log('Test user in neon_auth:', testUser);

await sql.end();
