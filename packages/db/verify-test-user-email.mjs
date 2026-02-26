/**
 * Directly verify the test user's email in neon_auth.user.
 * This is required because Neon Auth requires email verification before sign-in.
 */
import postgres from 'postgres';

const connStr = process.env.DATABASE_URL_DIRECT;
if (!connStr) throw new Error('DATABASE_URL_DIRECT not set');

const email = process.env.E2E_EMAIL || 'e2e-user@afenda-test.local';
const sql = postgres(connStr, { ssl: 'require', max: 1 });

try {
  const result = await sql`
    UPDATE neon_auth."user" 
    SET "emailVerified" = true 
    WHERE email = ${email}
    RETURNING id, email, "emailVerified"
  `;
  if (result.length === 0) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log('Email verified successfully:', result[0]);
  }
} finally {
  await sql.end();
}
