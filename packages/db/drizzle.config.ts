import { defineConfig } from 'drizzle-kit';

// Workaround for drizzle-kit BigInt JSON serialization bug (drizzle-team/drizzle-orm#5278).
// drizzle-kit's diffSchemasOrTables() calls JSON.stringify on schema snapshots
// that contain native BigInt default values from bigint({ mode: 'bigint' }) columns.
// eslint-disable-next-line no-extend-native
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/*.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  schemaFilter: ['platform', 'erp', 'audit', 'public'],
  entities: {
    roles: { provider: 'neon' },
  },
  extensionsFilters: ['postgis'],
  migrations: {
    schema: 'public',
  },
  verbose: true,
  strict: true,
});
