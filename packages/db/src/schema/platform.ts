import { boolean, jsonb, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { platformSchema } from "./_schemas";
import { tenantStatusEnum } from "./_enums";
import { pkId, tenantCol, timestamps } from "./_common";

// ─── platform.tenant ────────────────────────────────────────────────────────

export const tenants = platformSchema.table(
  "tenant",
  {
    ...pkId(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 63 }).notNull(),
    status: tenantStatusEnum("status").notNull().default("ACTIVE"),
    settings: jsonb("settings").notNull().default({}),
    ...timestamps(),
  },
  (t) => [uniqueIndex("uq_tenant_slug").on(t.slug)],
);

// ─── platform.company ───────────────────────────────────────────────────────

export const companies = platformSchema.table(
  "company",
  {
    ...pkId(),
    ...tenantCol(),
    name: text("name").notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    baseCurrencyId: uuid("base_currency_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex("uq_company_code_tenant").on(t.tenantId, t.code)],
);

// ─── platform.user ──────────────────────────────────────────────────────────

export const users = platformSchema.table(
  "user",
  {
    ...pkId(),
    ...tenantCol(),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: text("display_name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex("uq_user_email_tenant").on(t.tenantId, t.email)],
);
