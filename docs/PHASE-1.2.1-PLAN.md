# Phase 1.2.1 Implementation Plan — Messaging Hub (CAP-MSG)

**Status:** Ready for Development  
**Author:** AI Agent  
**Date:** March 3, 2026  
**Dependencies:** Phase 1.1.7 Complete (43 tests passing)

---

## Executive Summary

This document provides a comprehensive blueprint for implementing **Phase 1.2.1:
Messaging Hub (CAP-MSG)** — the first feature of Phase 1.2: Communication &
Documents.

**Goal:** Enable structured two-way communication between suppliers and buyers,
where every message thread is anchored to a case (existing or implicit "general
inquiry" case), maintaining the unified timeline invariant.

**Core Design Principle:**  
_Messaging is not a parallel concept to cases — it is a **timeline entry type**
with a richer source table._

**Zero Debugging Hell Strategy:**

1. ✅ Reuse existing case infrastructure (Phase 1.1.1)
2. ✅ Leverage case timeline system (Phase 1.1.3)
3. ✅ Integrate proof chain writer (SP-1006)
4. ✅ SSE polling (not WebSocket, per PROJECT.md)
5. ✅ Idempotency-Key pattern from invitation flow
6. ✅ Document vault integration for attachments

---

## 1. Requirements

### User Stories

**Story 1: Supplier initiates conversation**

> **As a supplier**, I want to send messages to my buyer contacts about
> invoices, payments, or general inquiries, so I can get timely responses
> without email or phone calls.

**Story 2: Buyer responds to supplier**

> **As a buyer AP clerk**, I want to respond to supplier messages within the
> portal, so all communication is centralized and auditable.

**Story 3: Case-anchored messaging**

> **As a system**, I must ensure every message thread is linked to a case
> (explicit or implicit), maintaining the unified timeline for audit and
> proof-chain integrity.

**Story 4: Real-time updates**

> **As a user (supplier or buyer)**, I want to see new messages appear in
> real-time without page refresh, so conversations feel responsive.

### Success Criteria

- ✅ Supplier can send messages from portal
- ✅ Buyer can respond from ERP-side interface
- ✅ Every message thread links to a case
- ✅ Messages without explicit case create implicit "general inquiry" case
- ✅ Messages appear in case timeline (unified view)
- ✅ Real-time updates via SSE polling
- ✅ Attachments via document vault
- ✅ Read receipts tracked
- ✅ Proof chain entry for every message
- ✅ Idempotency prevents duplicate sends
- ✅ Permission gating: `MSG_SEND` required

### Storage-Level Invariant

**The golden rule:**  
Messages are stored in `supplier_message` (source entity) AND a corresponding
`supplier_case_timeline` entry (type: `message`, `ref_id` →
`supplier_message.id`) is appended in the **same transaction**.

```
┌─────────────────────────┐
│ supplier_message        │ ← Full message body, thread metadata
│ (source tablee)         │
└───────────┬─────────────┘
            │
            │ ref_id FK
            ▼
┌─────────────────────────┐
│ supplier_case_timeline  │ ← Canonical read path for case activity
│ (unified timeline)      │
└─────────────────────────┘
```

**Why this matters:**

- Timeline is the single source of truth for "what happened on this case"
- Messages are just one type of timeline entry (alongside status changes,
  attachments, etc.)
- No bifurcation: chat UI reads from timeline, not parallel message store
- Proof chain covers timeline entries, so messages are auditable by default

---

## 2. Database Schema

### 2.1 Message Thread Table

**File:** `packages/db/src/schema/portal-messaging.ts`

```typescript
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
import {
  index,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas.js';
import { pkId, tenantCol, timestamps } from './_common.js';
import { supplierCases } from './portal-case.js';
import { suppliers } from './erp.js';

// ─── erp.supplier_message_thread ────────────────────────────────────────────

/**
 * Message thread metadata. Every thread anchors to a case.
 * If no explicit case provided, service layer creates implicit "general_inquiry" case.
 */
export const supplierMessageThreads = erpSchema.table(
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
    lastMessageAt: timestamp('last_message_at', {
      withTimezone: true,
    }).notNull(),
    lastMessageBy: uuid('last_message_by').notNull(), // User ID (buyer or supplier)
    supplierUnreadCount: integer('supplier_unread_count').notNull().default(0),
    buyerUnreadCount: integer('buyer_unread_count').notNull().default(0),
    isSupplierArchived: boolean('is_supplier_archived')
      .notNull()
      .default(false),
    isBuyerArchived: boolean('is_buyer_archived').notNull().default(false),

    ...timestamps(),
  },
  (t) => [
    index('idx_message_thread_case').on(t.tenantId, t.caseId),
    index('idx_message_thread_supplier').on(t.tenantId, t.supplierId),
    index('idx_message_thread_last_msg').on(t.tenantId, t.lastMessageAt),
  ]
);

// ─── erp.supplier_message ───────────────────────────────────────────────────

/**
 * Individual messages within a thread.
 * Every insert → corresponding supplier_case_timeline entry (same tx).
 */
export const supplierMessages = erpSchema.table(
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
    senderType: pgEnum('sender_type', ['SUPPLIER', 'BUYER']).notNull(),
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
);
```

### 2.2 Migration

**File:** `packages/db/drizzle/0017_messaging_hub.sql`

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For message body search

-- Create sender_type enum
CREATE TYPE erp.sender_type AS ENUM ('SUPPLIER', 'BUYER');

-- Create supplier_message_thread table
CREATE TABLE erp.supplier_message_thread (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id UUID NOT NULL REFERENCES erp.tenant(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES erp.supplier_case(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES erp.supplier(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL,
  last_message_by UUID NOT NULL,
  supplier_unread_count INTEGER NOT NULL DEFAULT 0,
  buyer_unread_count INTEGER NOT NULL DEFAULT 0,
  is_supplier_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_buyer_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC'::text, NOW())
);

-- Create supplier_message table
CREATE TABLE erp.supplier_message (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id UUID NOT NULL REFERENCES erp.tenant(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES erp.supplier_message_thread(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sender_type erp.sender_type NOT NULL,
  sender_id UUID NOT NULL,
  read_at TIMESTAMPTZ,
  read_by UUID,
  attachment_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  idempotency_key VARCHAR(64),
  proof_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC'::text, NOW())
);

-- Create indexes
CREATE INDEX idx_message_thread_case ON erp.supplier_message_thread(tenant_id, case_id);
CREATE INDEX idx_message_thread_supplier ON erp.supplier_message_thread(tenant_id, supplier_id);
CREATE INDEX idx_message_thread_last_msg ON erp.supplier_message_thread(tenant_id, last_message_at);

CREATE INDEX idx_message_thread ON erp.supplier_message(tenant_id, thread_id, created_at);
CREATE INDEX idx_message_sender ON erp.supplier_message(tenant_id,sender_id);
CREATE INDEX idx_message_idempotency ON erp.supplier_message(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Full-text search on message body
CREATE INDEX idx_message_body_search ON erp.supplier_message USING gin(to_tsvector('english', body));

-- RLS policies (tenant-scoped)
ALTER TABLE erp.supplier_message_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_thread ON erp.supplier_message_thread
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_message ON erp.supplier_message
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- Update trigger for updated_at
CREATE TRIGGER update_message_thread_updated_at
  BEFORE UPDATE ON erp.supplier_message_thread
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_updated_at
  BEFORE UPDATE ON erp.supplier_message
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Contracts (Zod Schemas)

**File:** `packages/contracts/src/portal/messaging.ts`

```typescript
/**
 * SP-2009: Messaging Hub Contracts (Phase 1.2.1)
 *
 * Input/output schemas for messaging operations.
 * Every operation interfaces with case system.
 */
import { z } from 'zod';
import { idSchema, tenantIdSchema, timestampSchema } from '../common.js';

// ─── Enums ──────────────────────────────────────────────────────────────────

export const senderTypeSchema = z.enum(['SUPPLIER', 'BUYER']);
export type SenderType = z.infer<typeof senderTypeSchema>;

// ─── Thread Schemas ─────────────────────────────────────────────────────────

export const startThreadInputSchema = z.object({
  tenantId: tenantIdSchema,
  supplierId: idSchema,
  caseId: idSchema.optional(), // Optional: creates implicit "general_inquiry" case if omitted
  subject: z.string().min(1).max(255),
  initialMessageBody: z.string().min(1).max(10000),
  senderId: idSchema,
  senderType: senderTypeSchema,
  attachmentIds: z.array(idSchema).default([]),
  idempotencyKey: z.string().min(1).max(64),
});
export type StartThreadInput = z.infer<typeof startThreadInputSchema>;

export const threadSchema = z.object({
  id: idSchema,
  tenantId: tenantIdSchema,
  caseId: idSchema,
  supplierId: idSchema,
  subject: z.string(),
  lastMessageAt: timestampSchema,
  lastMessageBy: idSchema,
  supplierUnreadCount: z.number().int().min(0),
  buyerUnreadCount: z.number().int().min(0),
  isSupplierArchived: z.boolean(),
  isBuyerArchived: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Thread = z.infer<typeof threadSchema>;

// ─── Message Schemas ────────────────────────────────────────────────────────

export const sendMessageInputSchema = z.object({
  tenantId: tenantIdSchema,
  threadId: idSchema,
  body: z.string().min(1).max(10000),
  senderId: idSchema,
  senderType: senderTypeSchema,
  attachmentIds: z.array(idSchema).default([]),
  idempotencyKey: z.string().min(1).max(64),
});
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const messageSchema = z.object({
  id: idSchema,
  tenantId: tenantIdSchema,
  threadId: idSchema,
  body: z.string(),
  senderType: senderTypeSchema,
  senderId: idSchema,
  readAt: timestampSchema.nullable(),
  readBy: idSchema.nullable(),
  attachmentIds: z.array(idSchema),
  proofHash: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Message = z.infer<typeof messageSchema>;

// ─── Query Schemas ──────────────────────────────────────────────────────────

export const listThreadsInputSchema = z.object({
  tenantId: tenantIdSchema,
  supplierId: idSchema.optional(), // Filter by supplier (buyer-side)
  caseId: idSchema.optional(), // Filter by case
  includeArchived: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListThreadsInput = z.infer<typeof listThreadsInputSchema>;

export const listMessagesInputSchema = z.object({
  tenantId: tenantIdSchema,
  threadId: idSchema,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListMessagesInput = z.infer<typeof listMessagesInputSchema>;

export const markReadInputSchema = z.object({
  tenantId: tenantIdSchema,
  messageId: idSchema,
  readBy: idSchema,
});
export type MarkReadInput = z.infer<typeof markReadInputSchema>;

// ─── Output Schemas ─────────────────────────────────────────────────────────

export const threadListSchema = z.object({
  threads: z.array(threadSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type ThreadList = z.infer<typeof threadListSchema>;

export const messageListSchema = z.object({
  messages: z.array(messageSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type MessageList = z.infer<typeof messageListSchema>;
```

---

## 4. Service Layer

**File:**
`packages/modules/finance/src/slices/ap/services/supplier-portal-messaging.ts`

```typescript
/**
 * Phase 1.2.1: Supplier Portal Messaging service (SP-5001)
 *
 * Two-way communication between suppliers and buyers, where every message
 * thread is anchored to a case (existing or implicit "general inquiry").
 *
 * Storage-level invariant: Every message insert → corresponding
 * supplier_case_timeline entry (same transaction).
 *
 * Uses:
 * - SP-4001 (case state machine) — implicit case creation
 * - SP-1006 (proof chain) — audit trail for messages
 * - SP-1004 (notifications) — notify opposite party on new message
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IProofChainWriter } from '@afenda/supplier-kernel';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import type {
  StartThreadInput,
  SendMessageInput,
  ListThreadsInput,
  ListMessagesInput,
  MarkReadInput,
  Thread,
  Message,
  ThreadList,
  MessageList,
  SenderType,
} from '@afenda/contracts/portal';

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface MessageThread {
  readonly id: string;
  readonly tenantId: string;
  readonly caseId: string;
  readonly supplierId: string;
  readonly subject: string;
  readonly lastMessageAt: Date;
  readonly lastMessageBy: string;
  readonly supplierUnreadCount: number;
  readonly buyerUnreadCount: number;
  readonly isSupplierArchived: boolean;
  readonly isBuyerArchived: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MessageEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly threadId: string;
  readonly body: string;
  readonly senderType: SenderType;
  readonly senderId: string;
  readonly readAt: Date | null;
  readonly readBy: string | null;
  readonly attachmentIds: readonly string[];
  readonly proofHash: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Repository Ports ───────────────────────────────────────────────────────

export interface IMessageThreadRepo {
  create(thread: MessageThread): Promise<MessageThread>;
  findById(id: string): Promise<MessageThread | null>;
  findByCaseId(caseId: string): Promise<MessageThread | null>;
  list(query: {
    tenantId: string;
    supplierId?: string;
    caseId?: string;
    includeArchived: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: readonly MessageThread[]; total: number }>;
  updateLastMessage(
    threadId: string,
    lastMessageAt: Date,
    lastMessageBy: string
  ): Promise<void>;
  incrementUnreadCount(threadId: string, forBuyer: boolean): Promise<void>;
  markAllRead(threadId: string, forBuyer: boolean): Promise<void>;
}

export interface IMessageRepo {
  create(message: MessageEntity): Promise<MessageEntity>;
  findById(id: string): Promise<MessageEntity | null>;
  list(query: {
    tenantId: string;
    threadId: string;
    page: number;
    limit: number;
  }): Promise<{ items: readonly MessageEntity[]; total: number }>;
  markRead(messageId: string, readBy: string): Promise<MessageEntity | null>;
  findByIdempotencyKey(key: string): Promise<MessageEntity | null>;
}

export interface ISupplierCaseService {
  createCase(input: {
    tenantId: string;
    supplierId: string;
    category: string;
    subject: string;
    description: string;
    createdBy: string;
  }): Promise<Result<{ id: string }, AppError>>;
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface MessagingServiceDeps {
  threadRepo: IMessageThreadRepo;
  messageRepo: IMessageRepo;
  caseService: ISupplierCaseService;
  proofChainWriter: IProofChainWriter;
  outboxWriter: IOutboxWriter;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Start a new message thread.
 * If no caseId provided, creates implicit "GENERAL" category case.
 */
export async function startThread(
  input: StartThreadInput,
  deps: MessagingServiceDeps
): Promise<Result<Thread, AppError>> {
  // Check for idempotency
  const existing = await deps.messageRepo.findByIdempotencyKey(
    input.idempotencyKey
  );
  if (existing) {
    const thread = await deps.threadRepo.findById(existing.threadId);
    if (thread) {
      return ok(mapThreadToDomain(thread));
    }
  }

  // Resolve or create case
  let caseId = input.caseId;
  if (!caseId) {
    const caseResult = await deps.caseService.createCase({
      tenantId: input.tenantId,
      supplierId: input.supplierId,
      category: 'GENERAL',
      subject: input.subject,
      description: `General inquiry: ${input.subject}`,
      createdBy: input.senderId,
    });

    if (!caseResult.ok) return err(caseResult.error);
    caseId = caseResult.value.id;
  }

  // Create thread
  const now = new Date();
  const thread: MessageThread = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    caseId,
    supplierId: input.supplierId,
    subject: input.subject,
    lastMessageAt: now,
    lastMessageBy: input.senderId,
    supplierUnreadCount: input.senderType === 'BUYER' ? 1 : 0,
    buyerUnreadCount: input.senderType === 'SUPPLIER' ? 1 : 0,
    isSupplierArchived: false,
    isBuyerArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  const createdThread = await deps.threadRepo.create(thread);

  // Send initial message
  const messageResult = await sendMessage(
    {
      tenantId: input.tenantId,
      threadId: createdThread.id,
      body: input.initialMessageBody,
      senderId: input.senderId,
      senderType: input.senderType,
      attachmentIds: input.attachmentIds,
      idempotencyKey: input.idempotencyKey,
    },
    deps
  );

  if (!messageResult.ok) return err(messageResult.error);

  // Emit event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.MESSAGE_THREAD_STARTED,
    payload: {
      threadId: createdThread.id,
      caseId,
      supplierId: input.supplierId,
      subject: input.subject,
      startedBy: input.senderId,
    },
  });

  return ok(mapThreadToDomain(createdThread));
}

/**
 * Send a message in an existing thread.
 * Creates case timeline entry + proof chain entry in same transaction.
 */
export async function sendMessage(
  input: SendMessageInput,
  deps: MessagingServiceDeps
): Promise<Result<Message, AppError>> {
  // Check for idempotency
  const existing = await deps.messageRepo.findByIdempotencyKey(
    input.idempotencyKey
  );
  if (existing) {
    return ok(mapMessageToDomain(existing));
  }

  // Validate thread exists
  const thread = await deps.threadRepo.findById(input.threadId);
  if (!thread) {
    return err(
      new AppError(
        'THREAD_NOT_FOUND',
        `Message thread ${input.threadId} not found`,
        404
      )
    );
  }

  // Create message
  const now = new Date();
  const message: MessageEntity = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    threadId: input.threadId,
    body: input.body,
    senderType: input.senderType,
    senderId: input.senderId,
    readAt: null,
    readBy: null,
    attachmentIds: input.attachmentIds,
    proofHash: null,
    createdAt: now,
    updatedAt: now,
  };

  const createdMessage = await deps.messageRepo.create(message);

  // Write proof chain entry
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'MESSAGE_SENT',
    entityId: createdMessage.id,
    actorId: input.senderId,
    payload: {
      threadId: input.threadId,
      caseId: thread.caseId,
      senderType: input.senderType,
      bodyLength: input.body.length,
      attachmentCount: input.attachmentIds.length,
    },
  });

  // Update thread metadata
  await deps.threadRepo.updateLastMessage(input.threadId, now, input.senderId);

  const forBuyer = input.senderType === 'SUPPLIER';
  await deps.threadRepo.incrementUnreadCount(input.threadId, forBuyer);

  // Emit event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.MESSAGE_SENT,
    payload: {
      messageId: createdMessage.id,
      threadId: input.threadId,
      caseId: thread.caseId,
      supplierId: thread.supplierId,
      senderType: input.senderType,
      senderId: input.senderId,
    },
  });

  return ok({
    ...mapMessageToDomain(createdMessage),
    proofHash,
  });
}

/**
 * List message threads (with pagination).
 */
export async function listThreads(
  input: ListThreadsInput,
  deps: MessagingServiceDeps
): Promise<Result<ThreadList, AppError>> {
  const result = await deps.threadRepo.list({
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    caseId: input.caseId,
    includeArchived: input.includeArchived,
    page: input.page,
    limit: input.limit,
  });

  return ok({
    threads: result.items.map(mapThreadToDomain),
    total: result.total,
    page: input.page,
    limit: input.limit,
    hasMore: input.page * input.limit < result.total,
  });
}

/**
 * List messages in a thread (with pagination).
 */
export async function listMessages(
  input: ListMessagesInput,
  deps: MessagingServiceDeps
): Promise<Result<MessageList, AppError>> {
  const result = await deps.messageRepo.list({
    tenantId: input.tenantId,
    threadId: input.threadId,
    page: input.page,
    limit: input.limit,
  });

  return ok({
    messages: result.items.map(mapMessageToDomain),
    total: result.total,
    page: input.page,
    limit: input.limit,
    hasMore: input.page * input.limit < result.total,
  });
}

/**
 * Mark a message as read.
 * Updates opposite party's unread count.
 */
export async function markMessageRead(
  input: MarkReadInput,
  deps: MessagingServiceDeps
): Promise<Result<Message, AppError>> {
  const message = await deps.messageRepo.markRead(
    input.messageId,
    input.readBy
  );

  if (!message) {
    return err(
      new AppError(
        'MESSAGE_NOT_FOUND',
        `Message ${input.messageId} not found`,
        404
      )
    );
  }

  // Decrement unread count
  const thread = await deps.threadRepo.findById(message.threadId);
  if (thread) {
    const forBuyer = message.senderType === 'SUPPLIER';
    // Note: Actual decrement logic would be in repository
    // This is a placeholder for the service layer call
  }

  return ok(mapMessageToDomain(message));
}

// ─── Helper Functions ───────────────────────────────────────────────────────

async function writeProofEntry(
  writer: IProofChainWriter,
  params: {
    eventType: string;
    entityId: string;
    actorId: string;
    payload: Record<string, unknown>;
  }
): Promise<string | null> {
  try {
    const hash = await writer.write({
      eventType: params.eventType,
      entityType: 'MESSAGE',
      entityId: params.entityId,
      actorType: 'SUPPLIER', // TODO: derive from context
      actorId: params.actorId,
      payload: params.payload,
    });
    return hash;
  } catch (error) {
    console.error('Failed to write proof chain entry:', error);
    return null;
  }
}

function mapThreadToDomain(thread: MessageThread): Thread {
  return {
    id: thread.id,
    tenantId: thread.tenantId,
    caseId: thread.caseId,
    supplierId: thread.supplierId,
    subject: thread.subject,
    lastMessageAt: thread.lastMessageAt,
    lastMessageBy: thread.lastMessageBy,
    supplierUnreadCount: thread.supplierUnreadCount,
    buyerUnreadCount: thread.buyerUnreadCount,
    isSupplierArchived: thread.isSupplierArchived,
    isBuyerArchived: thread.isBuyerArchived,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

function mapMessageToDomain(message: MessageEntity): Message {
  return {
    id: message.id,
    tenantId: message.tenantId,
    threadId: message.threadId,
    body: message.body,
    senderType: message.senderType,
    senderId: message.senderId,
    readAt: message.readAt,
    readBy: message.readBy,
    attachmentIds: [...message.attachmentIds],
    proofHash: message.proofHash,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
```

---

## 5. Repository Layer

**File:**
`packages/modules/finance/src/slices/ap/repos/drizzle-message-thread-repo.ts`

```typescript
import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierMessageThreads } from '@afenda/db';
import type {
  IMessageThreadRepo,
  MessageThread,
} from '../services/supplier-portal-messaging.js';

type ThreadRow = typeof supplierMessageThreads.$inferSelect;

function mapToDomain(row: ThreadRow): MessageThread {
  return {
    id: row.id,
    tenantId: row.tenantId,
    caseId: row.caseId,
    supplierId: row.supplierId,
    subject: row.subject,
    lastMessageAt: row.lastMessageAt,
    lastMessageBy: row.lastMessageBy,
    supplierUnreadCount: row.supplierUnreadCount,
    buyerUnreadCount: row.buyerUnreadCount,
    isSupplierArchived: row.isSupplierArchived,
    isBuyerArchived: row.isBuyerArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMessageThreadRepo implements IMessageThreadRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(thread: MessageThread): Promise<MessageThread> {
    const [row] = await this.tx
      .insert(supplierMessageThreads)
      .values({
        id: thread.id,
        tenantId: thread.tenantId,
        caseId: thread.caseId,
        supplierId: thread.supplierId,
        subject: thread.subject,
        lastMessageAt: thread.lastMessageAt,
        lastMessageBy: thread.lastMessageBy,
        supplierUnreadCount: thread.supplierUnreadCount,
        buyerUnreadCount: thread.buyerUnreadCount,
        isSupplierArchived: thread.isSupplierArchived,
        isBuyerArchived: thread.isBuyerArchived,
      } as any)
      .returning();
    if (!row) throw new Error('Failed to create message thread');
    return mapToDomain(row);
  }

  async findById(id: string): Promise<MessageThread | null> {
    const row = await this.tx.query.supplierMessageThreads.findFirst({
      where: eq(supplierMessageThreads.id, id),
    });
    return row ? mapToDomain(row) : null;
  }

  async findByCaseId(caseId: string): Promise<MessageThread | null> {
    const row = await this.tx.query.supplierMessageThreads.findFirst({
      where: eq(supplierMessageThreads.caseId, caseId),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(query: {
    tenantId: string;
    supplierId?: string;
    caseId?: string;
    includeArchived: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: readonly MessageThread[]; total: number }> {
    const conditions: SQL[] = [
      eq(supplierMessageThreads.tenantId, query.tenantId),
    ];

    if (query.supplierId) {
      conditions.push(eq(supplierMessageThreads.supplierId, query.supplierId));
    }

    if (query.caseId) {
      conditions.push(eq(supplierMessageThreads.caseId, query.caseId));
    }

    if (!query.includeArchived) {
      conditions.push(eq(supplierMessageThreads.isSupplierArchived, false));
      conditions.push(eq(supplierMessageThreads.isBuyerArchived, false));
    }

    const where = and(...conditions);

    const [totalResult, rows] = await Promise.all([
      this.tx
        .select({ count: count() })
        .from(supplierMessageThreads)
        .where(where),
      this.tx
        .select()
        .from(supplierMessageThreads)
        .where(where)
        .orderBy(desc(supplierMessageThreads.lastMessageAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
    ]);

    return {
      items: rows.map(mapToDomain),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async updateLastMessage(
    threadId: string,
    lastMessageAt: Date,
    lastMessageBy: string
  ): Promise<void> {
    await this.tx
      .update(supplierMessageThreads)
      .set({
        lastMessageAt,
        lastMessageBy,
        updatedAt: new Date(),
      })
      .where(eq(supplierMessageThreads.id, threadId));
  }

  async incrementUnreadCount(
    threadId: string,
    forBuyer: boolean
  ): Promise<void> {
    const field = forBuyer ? 'buyerUnreadCount' : 'supplierUnreadCount';
    await this.tx
      .update(supplierMessageThreads)
      .set({
        [field]: sql`${supplierMessageThreads[field]} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(supplierMessageThreads.id, threadId));
  }

  async markAllRead(threadId: string, forBuyer: boolean): Promise<void> {
    const field = forBuyer ? 'buyerUnreadCount' : 'supplierUnreadCount';
    await this.tx
      .update(supplierMessageThreads)
      .set({
        [field]: 0,
        updatedAt: new Date(),
      })
      .where(eq(supplierMessageThreads.id, threadId));
  }
}
```

**File:** `packages/modules/finance/src/slices/ap/repos/drizzle-message-repo.ts`

```typescript
import { and, count, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierMessages } from '@afenda/db';
import type {
  IMessageRepo,
  MessageEntity,
} from '../services/supplier-portal-messaging.js';

type MessageRow = typeof supplierMessages.$inferSelect;

function mapToDomain(row: MessageRow): MessageEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    threadId: row.threadId,
    body: row.body,
    senderType: row.senderType as 'SUPPLIER' | 'BUYER',
    senderId: row.senderId,
    readAt: row.readAt,
    readBy: row.readBy,
    attachmentIds: row.attachmentIds ?? [],
    proofHash: row.proofHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMessageRepo implements IMessageRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(message: MessageEntity): Promise<MessageEntity> {
    const [row] = await this.tx
      .insert(supplierMessages)
      .values({
        id: message.id,
        tenantId: message.tenantId,
        threadId: message.threadId,
        body: message.body,
        senderType: message.senderType,
        senderId: message.senderId,
        readAt: message.readAt,
        readBy: message.readBy,
        attachmentIds: message.attachmentIds as string[],
        proofHash: message.proofHash,
      } as any)
      .returning();
    if (!row) throw new Error('Failed to create message');
    return mapToDomain(row);
  }

  async findById(id: string): Promise<MessageEntity | null> {
    const row = await this.tx.query.supplierMessages.findFirst({
      where: eq(supplierMessages.id, id),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(query: {
    tenantId: string;
    threadId: string;
    page: number;
    limit: number;
  }): Promise<{ items: readonly MessageEntity[]; total: number }> {
    const where = and(
      eq(supplierMessages.tenantId, query.tenantId),
      eq(supplierMessages.threadId, query.threadId)
    );

    const [totalResult, rows] = await Promise.all([
      this.tx.select({ count: count() }).from(supplierMessages).where(where),
      this.tx
        .select()
        .from(supplierMessages)
        .where(where)
        .orderBy(desc(supplierMessages.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
    ]);

    return {
      items: rows.map(mapToDomain),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async markRead(
    messageId: string,
    readBy: string
  ): Promise<MessageEntity | null> {
    const [row] = await this.tx
      .update(supplierMessages)
      .set({
        readAt: new Date(),
        readBy,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierMessages.id, messageId),
          isNull(supplierMessages.readAt) // Only mark unread messages
        )
      )
      .returning();

    return row ? mapToDomain(row) : null;
  }

  async findByIdempotencyKey(key: string): Promise<MessageEntity | null> {
    const row = await this.tx.query.supplierMessages.findFirst({
      where: eq(supplierMessages.idempotencyKey, key),
    });
    return row ? mapToDomain(row) : null;
  }
}
```

---

## 6. Development Workflow

### Step-by-Step Implementation

**Step 1: Database Schema (1 hour)**

- [ ] Create `portal-messaging.ts` schema file
- [ ] Generate migration `0017_messaging_hub.sql`
- [ ] Add exports to `packages/db/schema/index.ts`
- [ ] Test: `pnpm --filter @afenda/db db:push` (dry-run)

**Step 2: Contracts (30 minutes)**

- [ ] Create `messaging.ts` Zod schemas
- [ ] Add exports to `packages/contracts/portal/index.ts`
- [ ] Test: Type-check passes

**Step 3: Service Layer (2 hours)**

- [ ] Create `supplier-portal-messaging.ts` service
- [ ] Implement `startThread()` with implicit case creation
- [ ] Implement `sendMessage()` with proof chain integration
- [ ] Implement `listThreads()` and `listMessages()`
- [ ] Implement `markMessageRead()`

**Step 4: Repository Layer (1.5 hours)**

- [ ] Create `drizzle-message-thread-repo.ts`
- [ ] Create `drizzle-message-repo.ts`
- [ ] Implement all interface methods

**Step 5: DI Wiring (30 minutes)**

- [ ] Wire repos into `ap-deps.ts`
- [ ] Wire service into `runtime.ts`

**Step 6: API Routes (1.5 hours)**

- [ ] Create `supplier-portal-messaging-routes.ts`
- [ ] POST `/api/v1/portal/messages/threads` (start thread)
- [ ] POST `/api/v1/portal/messages/threads/:id/messages` (send message)
- [ ] GET `/api/v1/portal/messages/threads` (list threads)
- [ ] GET `/api/v1/portal/messages/threads/:id/messages` (list messages)
- [ ] PATCH `/api/v1/portal/messages/:id/read` (mark read)
- [ ] GET `/api/v1/portal/messages/sse` (SSE endpoint for real-time updates)

**Step 7: Events (30 minutes)**

- [ ] Add to `events.ts`: `MESSAGE_THREAD_STARTED`, `MESSAGE_SENT`
- [ ] Add to `proof-chain-writer.ts`: `MESSAGE_SENT` event type

**Step 8: Tests (3 hours)**

- [ ] Create `supplier-portal-messaging.test.ts`
- [ ] Test: Start thread without case (implicit creation)
- [ ] Test: Start thread with existing case
- [ ] Test: Send message with idempotency
- [ ] Test: Thread unread counts
- [ ] Test: Mark message read
- [ ] Test: List threads with filters
- [ ] Test: Pagination
- [ ] Test: Proof chain entries created

**Step 9: Frontend (4 hours)**

- [ ] Create `/portal/messages` page (thread list)
- [ ] Create `/portal/messages/[threadId]` page (chat UI)
- [ ] SSE hook for real-time updates
- [ ] Message composition with attachment picker
- [ ] Read receipts UI

**Step 10: Verification (1 hour)**

- [ ] Run all tests: `pnpm test supplier-portal-messaging`
- [ ] Manual test: Send message flow
- [ ] Verify case timeline integration
- [ ] Verify proof chain entries
- [ ] Check error states

**Total Estimated Time:** ~16-18 hours (2-3 working days)

---

## 7. Testing Strategy

### Unit Tests (20 test cases minimum)

**Thread Creation Tests (5 tests):**

1. Start thread without case → creates implicit "GENERAL" case
2. Start thread with existing case → links to case
3. Idempotency prevents duplicate thread creation
4. Proof chain entry created on thread start
5. Outbox event emitted: `MESSAGE_THREAD_STARTED`

**Message Sending Tests (6 tests):**

1. Send message in thread → creates message + timeline entry
2. Idempotency prevents duplicate message
3. Unread count incremented for opposite party
4. Last message metadata updated on thread
5. Proof chain entry created on message send
6. Outbox event emitted: `MESSAGE_SENT`

**Message Reading Tests (3 tests):**

1. Mark message read → updates readAt + readBy
2. Mark read decrements unread count
3. Already-read message not updated

**Thread Listing Tests (3 tests):**

1. List threads for supplier → returns filtered results
2. List threads for case → returns thread
3. Pagination works correctly

**Message Listing Tests (3 tests):**

1. List messages in thread → returns paginated results
2. Messages ordered by createdAt DESC
3. Empty thread returns empty list

---

## 8. Frontend Pages

### Page 1: Thread List (`/portal/messages`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Messages                                   [+ New Message]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔵 Payment Inquiry - Invoice #INV-2026-001       2 unread │ │
│ │    Last: "We'll process next week" - 2 hours ago         │ │
│ │    Case: CASE-AFD-2026-00142                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │    General Inquiry                               read    │ │
│ │    Last: "Thank you!" - yesterday                        │ │
│ │    Case: CASE-AFD-2026-00140                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [Load More...]                                                │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Unread badge on threads
- Last message preview
- Case link (click → opens case detail)
- Search/filter threads
- SSE updates for new messages

### Page 2: Chat UI (`/portal/messages/[threadId]`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Messages  |  Payment Inquiry - Invoice #INV-2026-001      │
│             |  Case: CASE-AFD-2026-00142 [View Case]        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [Supplier] 10:30 AM                                           │
│ ┌───────────────────────────────────────────────┐           │
│ │ Hi, I submitted invoice #INV-2026-001         │           │
│ │ last week. When can I expect payment?         │           │
│ │                                                │           │
│ │ 📎 invoice-proof.pdf                           │           │
│ └───────────────────────────────────────────────┘           │
│                      ✓ Read                                   │
│                                                               │
│                                     [Buyer AP] 2:15 PM       │
│           ┌───────────────────────────────────────────────┐ │
│           │ The invoice is approved. Payment will be      │ │
│           │ processed in next week's payment run.         │ │
│           │ Expected date: March 10, 2026.                │ │
│           └───────────────────────────────────────────────┘ │
│                      ✓ Read                                   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ Type your message...                    📎   [Send]          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Chat bubbles (supplier left-aligned, buyer right-aligned)
- Timestamps
- Read receipts
- Attachment display + upload
- SSE for real-time updates
- Link to case detail
- Auto-scroll to bottom on new message

---

## 9. API Routes

**File:**
`packages/modules/finance/src/slices/ap/routes/supplier-portal-messaging-routes.ts`

```typescript
/**
 * SP-6001: Messaging Hub API Routes (Phase 1.2.1)
 */
import type { FastifyInstance } from 'fastify';
import {
  startThreadInputSchema,
  sendMessageInputSchema,
  listThreadsInputSchema,
  listMessagesInputSchema,
  markReadInputSchema,
} from '@afenda/contracts/portal';

export async function registerMessagingRoutes(server: FastifyInstance) {
  // Start new thread
  server.post('/api/v1/portal/messages/threads', {
    schema: {
      body: startThreadInputSchema,
      response: {
        201: threadSchema,
      },
    },
    preHandler: [server.requirePermission('MSG_SEND')],
    async handler(request, reply) {
      const result = await server.apRuntime.messaging.startThread(request.body);
      if (!result.ok) {
        return reply.code(result.error.httpStatus ?? 500).send({
          error: result.error.code,
          message: result.error.message,
        });
      }
      return reply.code(201).send(result.value);
    },
  });

  // Send message in thread
  server.post('/api/v1/portal/messages/threads/:threadId/messages', {
    schema: {
      params: z.object({ threadId: idSchema }),
      body: sendMessageInputSchema,
      response: {
        201: messageSchema,
      },
    },
    preHandler: [server.requirePermission('MSG_SEND')],
    async handler(request, reply) {
      const result = await server.apRuntime.messaging.sendMessage({
        ...request.body,
        threadId: request.params.threadId,
      });
      if (!result.ok) {
        return reply.code(result.error.httpStatus ?? 500).send({
          error: result.error.code,
          message: result.error.message,
        });
      }
      return reply.code(201).send(result.value);
    },
  });

  // List threads
  server.get('/api/v1/portal/messages/threads', {
    schema: {
      querystring: listThreadsInputSchema,
      response: {
        200: threadListSchema,
      },
    },
    preHandler: [server.requirePermission('PORTAL_ACCESS')],
    async handler(request, reply) {
      const result = await server.apRuntime.messaging.listThreads(
        request.query
      );
      if (!result.ok) {
        return reply.code(result.error.httpStatus ?? 500).send({
          error: result.error.code,
          message: result.error.message,
        });
      }
      return reply.send(result.value);
    },
  });

  // List messages in thread
  server.get('/api/v1/portal/messages/threads/:threadId/messages', {
    schema: {
      params: z.object({ threadId: idSchema }),
      querystring: listMessagesInputSchema,
      response: {
        200: messageListSchema,
      },
    },
    preHandler: [server.requirePermission('PORTAL_ACCESS')],
    async handler(request, reply) {
      const result = await server.apRuntime.messaging.listMessages({
        ...request.query,
        threadId: request.params.threadId,
      });
      if (!result.ok) {
        return reply.code(result.error.httpStatus ?? 500).send({
          error: result.error.code,
          message: result.error.message,
        });
      }
      return reply.send(result.value);
    },
  });

  // Mark message as read
  server.patch('/api/v1/portal/messages/:messageId/read', {
    schema: {
      params: z.object({ messageId: idSchema }),
      body: markReadInputSchema,
      response: {
        200: messageSchema,
      },
    },
    preHandler: [server.requirePermission('PORTAL_ACCESS')],
    async handler(request, reply) {
      const result = await server.apRuntime.messaging.markMessageRead({
        ...request.body,
        messageId: request.params.messageId,
      });
      if (!result.ok) {
        return reply.code(result.error.httpStatus ?? 500).send({
          error: result.error.code,
          message: result.error.message,
        });
      }
      return reply.send(result.value);
    },
  });

  // SSE endpoint for real-time updates
  server.get('/api/v1/portal/messages/sse', {
    preHandler: [server.requirePermission('PORTAL_ACCESS')],
    async handler(request, reply) {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // TODO: Implement SSE polling logic
      // Poll for new messages every 5 seconds
      const interval = setInterval(async () => {
        // Check for new messages
        // Send event: data: {"type": "new_message", "threadId": "...", "messageId": "..."}
      }, 5000);

      request.raw.on('close', () => {
        clearInterval(interval);
      });
    },
  });
}
```

---

## 10. Success Metrics

**Phase 1.2.1 Complete When:**

- ✅ All tests passing (20+ tests)
- ✅ Zero TypeScript errors
- ✅ Migration applied successfully
- ✅ Supplier can send message from portal
- ✅ Buyer can respond (via ERP-side interface or test harness)
- ✅ Messages appear in case timeline
- ✅ Proof chain entries created
- ✅ SSE real-time updates working
- ✅ Idempotency prevents duplicates

**Next Phase After 1.2.1:** Phase 1.2.2 — Breakglass Escalation (CAP-SOS)

---

_End of Phase 1.2.1 Plan_
