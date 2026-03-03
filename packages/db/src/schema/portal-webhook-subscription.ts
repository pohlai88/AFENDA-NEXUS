/**
 * SP-3012: portal_webhook_subscription table (CAP-API P18)
 *
 * Supplier-facing webhook subscriptions. Suppliers register endpoint URLs to
 * receive real-time push notifications for portal events (invoice status
 * changes, payment events, case updates, etc.).
 *
 * Security model:
 *   - Each subscription has a signingSecret (32-byte random hex) used to sign
 *     delivery payloads with HMAC-SHA256 (X-Afenda-Signature header).
 *   - Secrets are never returned after creation (write-only).
 *   - Subscriptions are tenant-scoped and supplier-scoped.
 *   - Maximum 10 active subscriptions per supplier (enforced in service layer).
 *
 * Delivery guarantees:
 *   - At-least-once via the tamper-resistant outbox.
 *   - Failed deliveries are retried up to 5 times with exponential backoff.
 *   - After 5 failures, subscription is marked SUSPENDED.
 */
import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const webhookStatusEnum = pgEnum('portal_webhook_status', [
  'ACTIVE',
  'PAUSED',
  'SUSPENDED', // auto-suspended after delivery failures
  'DELETED',
]);

export const portalWebhookSubscription = pgTable('portal_webhook_subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),

  // Human-readable label set by the supplier
  label: text('label').notNull(),

  // HTTPS endpoint to receive webhook payloads
  endpointUrl: text('endpoint_url').notNull(),

  // HMAC-SHA256 signing secret — never returned after creation
  signingSecret: text('signing_secret').notNull(),

  // Comma-separated event types this subscription listens to
  // e.g. "invoice.status_changed,payment.sent,case.updated"
  eventTypes: text('event_types').notNull(),

  status: webhookStatusEnum('status').notNull().default('ACTIVE'),

  // Delivery health tracking
  failureCount: integer('failure_count').notNull().default(0),
  lastDeliveredAt: timestamp('last_delivered_at', { withTimezone: true }),
  lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
  lastFailureReason: text('last_failure_reason'),

  // Lifecycle
  createdBy: text('created_by').notNull(),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type PortalWebhookSubscription = typeof portalWebhookSubscription.$inferSelect;
export type NewPortalWebhookSubscription = typeof portalWebhookSubscription.$inferInsert;
