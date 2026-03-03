/**
 * Portal Messaging tables (Phase 1.2.1 — SP-5001, SP-3001)
 *
 * Two tables:
 *   1. erp.supplier_message_thread  — thread metadata, links to case
 *   2. erp.supplier_message         — individual messages
 *
 * Invariant: Every thread links to a supplier_case (explicit or implicit).
 * Every message → supplier_case_timeline entry (same transaction).
 */
import { sql } from 'drizzle-orm';
import { index, integer, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { senderTypeEnum } from './_enums';
import { supplierCases } from './portal-case';
import { suppliers } from './erp';

// ─── erp.supplier_message_thread ────────────────────────────────────────────

/**
 * Message thread metadata. Every thread anchors to a case.
 * If no explicit case provided, service layer creates implicit "GENERAL" category case.
 */
export const supplierMessageThreads = erpSchema
  .table(
    'supplier_message_thread',
    {
      ...pkId(),
      ...tenantCol(),

      // Core relationships
      caseId: uuid('case_id')
        .notNull()
        .references(() => supplierCases.id, { onDelete: 'cascade' }),
      supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id, { onDelete: 'cascade' }),

      // Thread metadata
      subject: varchar('subject', { length: 255 }).notNull(),
      lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
      lastMessageBy: uuid('last_message_by').notNull(), // User ID (buyer or supplier)
      supplierUnreadCount: integer('supplier_unread_count').notNull().default(0),
      buyerUnreadCount: integer('buyer_unread_count').notNull().default(0),
      isSupplierArchived: boolean('is_supplier_archived').notNull().default(false),
      isBuyerArchived: boolean('is_buyer_archived').notNull().default(false),

      ...timestamps(),
    },
    (t) => [
      index('idx_message_thread_case').on(t.tenantId, t.caseId),
      index('idx_message_thread_supplier').on(t.tenantId, t.supplierId),
      index('idx_message_thread_last_msg').on(t.tenantId, t.lastMessageAt),
    ]
  )
  .enableRLS();

// ─── erp.supplier_message ───────────────────────────────────────────────────

/**
 * Individual messages within a thread.
 * Every insert → corresponding supplier_case_timeline entry (same tx).
 */
export const supplierMessages = erpSchema
  .table(
    'supplier_message',
    {
      ...pkId(),
      ...tenantCol(),

      // Relationships
      threadId: uuid('thread_id')
        .notNull()
        .references(() => supplierMessageThreads.id, { onDelete: 'cascade' }),

      // Message content
      body: text('body').notNull(),
      senderType: senderTypeEnum('sender_type').notNull(),
      senderId: uuid('sender_id').notNull(), // User ID

      // Metadata
      readAt: timestamp('read_at', { withTimezone: true }), // Null = unread
      readBy: uuid('read_by'), // Who marked it read (opposite party)
      attachmentIds: uuid('attachment_ids')
        .array()
        .notNull()
        .default(sql`'{}'::uuid[]`), // References to document vault

      // Idempotency
      idempotencyKey: varchar('idempotency_key', { length: 64 }),

      // Proof chain
      proofHash: varchar('proof_hash', { length: 64 }), // From proof chain writer

      ...timestamps(),
    },
    (t) => [
      index('idx_message_thread').on(t.tenantId, t.threadId, t.createdAt),
      index('idx_message_sender').on(t.tenantId, t.senderId),
      index('idx_message_idempotency').on(t.idempotencyKey),
    ]
  )
  .enableRLS();
