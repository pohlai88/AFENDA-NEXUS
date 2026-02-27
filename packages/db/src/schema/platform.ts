import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { platformSchema } from './_schemas';
import { tenantStatusEnum } from './_enums';
import { pkId, tenantCol, timestamps } from './_common';

// ─── platform.tenant ────────────────────────────────────────────────────────

export const tenants = platformSchema.table(
  'tenant',
  {
    ...pkId(),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 63 }).notNull(),
    status: tenantStatusEnum('status').notNull().default('ACTIVE'),
    settings: jsonb('settings').notNull().default({}),
    // Kernel v1: metadata columns (0021_kernel_layer)
    displayName: text('display_name'),
    logoUrl: text('logo_url'),
    planTier: varchar('plan_tier', { length: 20 }).notNull().default('free'),
    settingsVersion: integer('settings_version').notNull().default(1),
    settingsUpdatedBy: uuid('settings_updated_by'),
    settingsUpdatedAt: timestamp('settings_updated_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_tenant_slug').on(t.slug)]
).enableRLS();

// ─── platform.company ───────────────────────────────────────────────────────

export const companies = platformSchema.table(
  'company',
  {
    ...pkId(),
    ...tenantCol(),
    name: text('name').notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    baseCurrencyId: uuid('base_currency_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_company_code_tenant').on(t.tenantId, t.code)]
).enableRLS();

// ─── platform.user ──────────────────────────────────────────────────────────

export const users = platformSchema.table(
  'user',
  {
    ...pkId(),
    ...tenantCol(),
    email: varchar('email', { length: 255 }).notNull(),
    displayName: text('display_name').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_user_email_tenant').on(t.tenantId, t.email)]
).enableRLS();

// ─── platform.user_preference (Kernel v1 — P3) ──────────────────────────────

export const userPreferences = platformSchema.table('user_preference', {
  userId: uuid('user_id').primaryKey(),
  preferences: jsonb('preferences').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
}).enableRLS();

// ─── platform.system_config (Kernel v1 — P4) ────────────────────────────────

export const systemConfig = platformSchema.table('system_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull().default({}),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
}).enableRLS();

// ─── platform.admin_user (Kernel v1 — P4) ───────────────────────────────────

export const adminUsers = platformSchema.table('admin_user', {
  userId: uuid('user_id').primaryKey(),
  scope: varchar('scope', { length: 50 }).notNull().default('full'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
}).enableRLS();

// ─── platform.admin_action_log (Kernel v1 — P4) ─────────────────────────────

export const adminActionLogs = platformSchema.table('admin_action_log', {
  ...pkId(),
  adminUserId: uuid('admin_user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetTenantId: uuid('target_tenant_id'),
  targetUserId: uuid('target_user_id'),
  details: jsonb('details'),
  requestId: varchar('request_id', { length: 64 }),
  occurredAt: timestamp('occurred_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
}, (t) => [
  index('idx_admin_action_user').on(t.adminUserId, t.occurredAt),
  index('idx_admin_action_tenant').on(t.targetTenantId, t.occurredAt),
]).enableRLS();
