import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  schemaFilter: ["platform", "erp", "audit", "public"],
  entities: {
    roles: { provider: "neon" },
  },
  extensionsFilters: ["postgis"],
  migrations: {
    schema: "public",
  },
  verbose: true,
  strict: true,
});
