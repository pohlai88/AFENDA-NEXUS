/**
 * Phase 1.2.1: Messaging Hub service (CAP-MSG).
 *
 * Core design rule: Messages are NOT parallel to cases — they ARE a timeline
 * entry type with a richer source table. Every message write MUST produce a
 * corresponding `supplier_case_timeline` entry in the same transaction.
 *
 * Storage Invariant:
 *   INSERT supplier_message  ──┐
 *   INSERT case_timeline_entry ┘  (same tx, atomically)
 *
 * Auto-case: If no caseId is supplied when starting a thread, the service
 * creates an implicit GENERAL case for the message context.
 *
 * Real-time: SSE polling (not WebSocket) — consumers poll /sse endpoint.
 * Idempotency: Every send carries a 64-char idempotencyKey; duplicate sends
 * are silently no-oped and return the existing message.
 * Permissions: MSG_SEND for sending, PORTAL_ACCESS for reads.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, NotFoundError } from '@afenda/core';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import type { ISupplierCaseRepo, ICaseTimelineRepo } from './supplier-portal-case.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type SenderType = 'SUPPLIER' | 'BUYER';

export interface MessageThread {
  readonly id: string;
  readonly tenantId: string;
  readonly caseId: string;
  readonly supplierId: string;
  readonly subject: string;
  readonly lastMessageAt: Date | null;
  readonly lastMessageBy: string | null;
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
  readonly idempotencyKey: string | null;
  readonly proofHash: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Repository Ports ────────────────────────────────────────────────────────

export interface ThreadListQuery {
  readonly page: number;
  readonly limit: number;
  readonly caseId?: string;
  readonly includeArchived?: boolean;
}

export interface MessageListQuery {
  readonly page: number;
  readonly limit: number;
}

export interface IMessageThreadRepo {
  create(data: MessageThread): Promise<MessageThread>;
  findById(tenantId: string, id: string): Promise<MessageThread | null>;
  findByIdempotencyKey?(tenantId: string, key: string): Promise<MessageThread | null>;
  list(
    tenantId: string,
    supplierId: string,
    query: ThreadListQuery
  ): Promise<{ items: readonly MessageThread[]; total: number }>;
  updateLastMessage(
    id: string,
    lastMessageAt: Date,
    lastMessageBy: string
  ): Promise<MessageThread | null>;
  incrementUnreadCount(id: string, side: 'supplier' | 'buyer'): Promise<MessageThread | null>;
  clearUnreadCount(id: string, side: 'supplier' | 'buyer'): Promise<MessageThread | null>;
}

export interface IMessageRepo {
  create(data: MessageEntity): Promise<MessageEntity>;
  findById(tenantId: string, id: string): Promise<MessageEntity | null>;
  findByIdempotencyKey(tenantId: string, key: string): Promise<MessageEntity | null>;
  list(
    tenantId: string,
    threadId: string,
    query: MessageListQuery
  ): Promise<{ items: readonly MessageEntity[]; total: number }>;
  markRead(id: string, readAt: Date, readBy: string): Promise<MessageEntity | null>;
}

// ─── Input DTOs ─────────────────────────────────────────────────────────────

export interface StartThreadInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly senderType: SenderType;
  /** Optional: link to an existing case. If absent, an implicit GENERAL case is created. */
  readonly caseId?: string;
  readonly subject: string;
  readonly initialMessageBody: string;
  readonly attachmentIds?: readonly string[];
  readonly idempotencyKey?: string;
}

export interface SendMessageInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly threadId: string;
  readonly userId: string;
  readonly senderType: SenderType;
  readonly body: string;
  readonly attachmentIds?: readonly string[];
  readonly idempotencyKey?: string;
}

export interface ListThreadsInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly caseId?: string;
  readonly includeArchived?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface ListMessagesInput {
  readonly tenantId: string;
  readonly threadId: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface MarkMessageReadInput {
  readonly tenantId: string;
  readonly messageId: string;
  readonly threadId: string;
  readonly readBy: string;
  /** Which unread counter to decrement after marking read */
  readonly readerSide: 'supplier' | 'buyer';
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface MessagingServiceDeps {
  readonly messageThreadRepo: IMessageThreadRepo;
  readonly messageRepo: IMessageRepo;
  readonly supplierCaseRepo: ISupplierCaseRepo;
  readonly caseTimelineRepo: ICaseTimelineRepo;
  readonly supplierRepo: ISupplierRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function writeProofEntry(
  writer: IProofChainWriter | undefined,
  input: {
    eventType: ProofEventType;
    entityId: string;
    entityType: string;
    actorId: string;
    actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM';
    payload?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!writer) return null;
  try {
    const result = await writer.write(
      {
        eventId: crypto.randomUUID(),
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorType: input.actorType,
        actorId: input.actorId,
        eventAt: new Date(),
        payload: input.payload ?? {},
        previousHash: null,
      },
      undefined
    );
    return result?.contentHash ?? null;
  } catch {
    // Proof chain is fire-and-forget; don't fail the business operation
    return null;
  }
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Start a new message thread (optionally linked to a case).
 *
 * Flow:
 *   1. Validate supplier exists
 *   2. Resolve or create the linked case (implicit GENERAL if no caseId)
 *   3. Create the thread
 *   4. Insert the initial message
 *   5. Append a `message` timeline entry to the case
 *   6. Write proof chain entry
 *   7. Emit SUPPLIER_MESSAGE_THREAD_STARTED event via outbox
 *
 * @returns Created thread + initial message
 */
export async function startThread(
  input: StartThreadInput,
  deps: MessagingServiceDeps
): Promise<Result<{ thread: MessageThread; message: MessageEntity }>> {
  // 1. Validate supplier exists
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }

  // 2. Validate subject
  if (!input.subject || input.subject.trim().length < 2) {
    return err(new AppError('VALIDATION', 'Thread subject must be at least 2 characters'));
  }
  if (!input.initialMessageBody || input.initialMessageBody.trim().length < 1) {
    return err(new AppError('VALIDATION', 'Initial message body cannot be empty'));
  }

  // 3. Resolve case — either validate existing or create implicit GENERAL case
  let resolvedCaseId: string;

  if (input.caseId) {
    const existingCase = await deps.supplierCaseRepo.findById(input.caseId);
    if (!existingCase) {
      return err(new NotFoundError('Case', input.caseId));
    }
    if (existingCase.tenantId !== input.tenantId) {
      return err(new AppError('FORBIDDEN', 'Case does not belong to this tenant'));
    }
    resolvedCaseId = existingCase.id;
  } else {
    // Create implicit GENERAL case
    const now = new Date();
    const seq = await deps.supplierCaseRepo.nextTicketSequence(input.tenantId);
    const tenantPrefix = input.tenantId.slice(0, 3).toUpperCase();
    const ticketNumber = `CASE-${tenantPrefix}-${now.getFullYear()}-${String(seq).padStart(5, '0')}`;

    const newCase = await deps.supplierCaseRepo.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      ticketNumber,
      supplierId: input.supplierId,
      category: 'GENERAL',
      priority: 'MEDIUM',
      subject: input.subject.trim(),
      description: `Auto-created case for messaging thread: ${input.subject.trim()}`,
      status: 'SUBMITTED',
      assignedTo: null,
      coAssignees: [],
      linkedEntityId: null,
      linkedEntityType: null,
      slaDeadline: null,
      resolution: null,
      rootCause: null,
      correctiveAction: null,
      resolvedBy: null,
      resolvedAt: null,
      escalationId: null,
      proofChainHead: null,
      createdBy: input.userId,
      createdAt: now,
      updatedAt: now,
    });
    resolvedCaseId = newCase.id;
  }

  const now = new Date();

  // 4. Create thread
  const thread: MessageThread = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    caseId: resolvedCaseId,
    supplierId: input.supplierId,
    subject: input.subject.trim(),
    lastMessageAt: now,
    lastMessageBy: input.userId,
    supplierUnreadCount: input.senderType === 'BUYER' ? 1 : 0,
    buyerUnreadCount: input.senderType === 'SUPPLIER' ? 1 : 0,
    isSupplierArchived: false,
    isBuyerArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  const createdThread = await deps.messageThreadRepo.create(thread);

  // 5. Create initial message
  const message: MessageEntity = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    threadId: createdThread.id,
    body: input.initialMessageBody.trim(),
    senderType: input.senderType,
    senderId: input.userId,
    readAt: null,
    readBy: null,
    attachmentIds: input.attachmentIds ?? [],
    idempotencyKey: input.idempotencyKey ?? null,
    proofHash: null,
    createdAt: now,
    updatedAt: now,
  };

  const createdMessage = await deps.messageRepo.create(message);

  // 6. Append timeline entry (storage invariant: message → timeline)
  await deps.caseTimelineRepo.append({
    id: crypto.randomUUID(),
    caseId: resolvedCaseId,
    tenantId: input.tenantId,
    entryType: 'message',
    refId: createdMessage.id,
    refType: 'supplier_message',
    actorId: input.userId,
    actorType: input.senderType,
    content: {
      threadId: createdThread.id,
      subject: createdThread.subject,
      preview: createdMessage.body.slice(0, 120),
    },
    proofHash: null,
    createdAt: now,
  });

  // 7. Write proof chain (fire-and-forget)
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'MESSAGE_SENT',
    entityId: createdMessage.id,
    entityType: 'supplier_message',
    actorId: input.userId,
    actorType: input.senderType,
    payload: {
      threadId: createdThread.id,
      caseId: resolvedCaseId,
      subject: createdThread.subject,
    },
  });

  // Update message proofHash if we got one
  const finalMessage = proofHash ? { ...createdMessage, proofHash } : createdMessage;

  // 8. Emit event via outbox
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_MESSAGE_THREAD_STARTED,
    payload: {
      threadId: createdThread.id,
      caseId: resolvedCaseId,
      supplierId: input.supplierId,
      subject: createdThread.subject,
      senderType: input.senderType,
      senderId: input.userId,
    },
  });

  return ok({ thread: createdThread, message: finalMessage });
}

/**
 * Send a message on an existing thread.
 *
 * Idempotency: If idempotencyKey is provided and already exists → return
 * existing message (no-op). Duplicate key collision is silent.
 *
 * Flow:
 *   1. Validate thread exists and belongs to this tenant
 *   2. Idempotency check
 *   3. Insert message
 *   4. Append timeline entry to case
 *   5. Update thread.lastMessageAt and unread counter
 *   6. Write proof chain
 *   7. Emit SUPPLIER_MESSAGE_SENT event
 *
 * @returns Created (or existing) message entity
 */
export async function sendMessage(
  input: SendMessageInput,
  deps: MessagingServiceDeps
): Promise<Result<MessageEntity>> {
  // 1. Validate thread
  const thread = await deps.messageThreadRepo.findById(input.tenantId, input.threadId);
  if (!thread) {
    return err(new NotFoundError('MessageThread', input.threadId));
  }
  if (thread.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Thread does not belong to this supplier'));
  }

  // 2. Body validation
  if (!input.body || input.body.trim().length < 1) {
    return err(new AppError('VALIDATION', 'Message body cannot be empty'));
  }

  // 3. Idempotency check
  if (input.idempotencyKey) {
    const existing = await deps.messageRepo.findByIdempotencyKey(
      input.tenantId,
      input.idempotencyKey
    );
    if (existing) {
      // Silent no-op: return the already-created message
      return ok(existing);
    }
  }

  const now = new Date();

  // 4. Create message
  const message: MessageEntity = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    threadId: input.threadId,
    body: input.body.trim(),
    senderType: input.senderType,
    senderId: input.userId,
    readAt: null,
    readBy: null,
    attachmentIds: input.attachmentIds ?? [],
    idempotencyKey: input.idempotencyKey ?? null,
    proofHash: null,
    createdAt: now,
    updatedAt: now,
  };

  const createdMessage = await deps.messageRepo.create(message);

  // 5. Append timeline entry (storage invariant)
  await deps.caseTimelineRepo.append({
    id: crypto.randomUUID(),
    caseId: thread.caseId,
    tenantId: input.tenantId,
    entryType: 'message',
    refId: createdMessage.id,
    refType: 'supplier_message',
    actorId: input.userId,
    actorType: input.senderType,
    content: {
      threadId: input.threadId,
      preview: createdMessage.body.slice(0, 120),
    },
    proofHash: null,
    createdAt: now,
  });

  // 6. Update thread metadata (lastMessage + unread counter for the OTHER side)
  const unreadSide: 'supplier' | 'buyer' = input.senderType === 'SUPPLIER' ? 'buyer' : 'supplier';
  await deps.messageThreadRepo.updateLastMessage(input.threadId, now, input.userId);
  await deps.messageThreadRepo.incrementUnreadCount(input.threadId, unreadSide);

  // 7. Write proof chain (fire-and-forget)
  const proofHash = await writeProofEntry(deps.proofChainWriter, {
    eventType: 'MESSAGE_SENT',
    entityId: createdMessage.id,
    entityType: 'supplier_message',
    actorId: input.userId,
    actorType: input.senderType,
    payload: {
      threadId: input.threadId,
      caseId: thread.caseId,
    },
  });

  const finalMessage = proofHash ? { ...createdMessage, proofHash } : createdMessage;

  // 8. Emit event via outbox
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_MESSAGE_SENT,
    payload: {
      messageId: createdMessage.id,
      threadId: input.threadId,
      caseId: thread.caseId,
      supplierId: input.supplierId,
      senderType: input.senderType,
      senderId: input.userId,
    },
  });

  return ok(finalMessage);
}

/**
 * List message threads for a supplier (paginated).
 *
 * @returns Paginated thread list with unread badges
 */
export async function listThreads(
  input: ListThreadsInput,
  deps: MessagingServiceDeps
): Promise<
  Result<{
    items: readonly MessageThread[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>
> {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  const result = await deps.messageThreadRepo.list(input.tenantId, input.supplierId, {
    page,
    limit,
    caseId: input.caseId,
    includeArchived: input.includeArchived ?? false,
  });

  return ok({
    items: result.items,
    total: result.total,
    page,
    limit,
    hasMore: result.total > page * limit,
  });
}

/**
 * List messages within a thread (paginated, chronological).
 *
 * @returns Paginated message list
 */
export async function listMessages(
  input: ListMessagesInput,
  deps: MessagingServiceDeps
): Promise<
  Result<{
    items: readonly MessageEntity[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>
> {
  const page = input.page ?? 1;
  const limit = input.limit ?? 50;

  const result = await deps.messageRepo.list(input.tenantId, input.threadId, {
    page,
    limit,
  });

  return ok({
    items: result.items,
    total: result.total,
    page,
    limit,
    hasMore: result.total > page * limit,
  });
}

/**
 * Mark a message as read and decrement the unread counter on the thread.
 *
 * No-op if the message is already read (idempotent).
 * Decrements the appropriate side's unread count (floored at 0).
 *
 * @returns Updated message entity
 */
export async function markMessageRead(
  input: MarkMessageReadInput,
  deps: MessagingServiceDeps
): Promise<Result<MessageEntity>> {
  // 1. Find message
  const message = await deps.messageRepo.findById(input.tenantId, input.messageId);
  if (!message) {
    return err(new NotFoundError('Message', input.messageId));
  }

  // 2. Validate thread ownership
  if (message.threadId !== input.threadId) {
    return err(new AppError('VALIDATION', 'Message does not belong to this thread'));
  }

  // 3. No-op if already read
  if (message.readAt !== null) {
    return ok(message);
  }

  const now = new Date();

  // 4. Mark message as read
  const updated = await deps.messageRepo.markRead(input.messageId, now, input.readBy);
  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to mark message as read'));
  }

  // 5. Decrement unread count on thread
  await deps.messageThreadRepo.clearUnreadCount(input.threadId, input.readerSide);

  // 6. Write proof chain (fire-and-forget)
  await writeProofEntry(deps.proofChainWriter, {
    eventType: 'MESSAGE_READ',
    entityId: input.messageId,
    entityType: 'supplier_message',
    actorId: input.readBy,
    actorType: input.readerSide === 'supplier' ? 'SUPPLIER' : 'BUYER',
    payload: {
      threadId: input.threadId,
      readAt: now.toISOString(),
    },
  });

  // 7. Emit event via outbox
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_MESSAGE_READ,
    payload: {
      messageId: input.messageId,
      threadId: input.threadId,
      readBy: input.readBy,
      readerSide: input.readerSide,
    },
  });

  return ok(updated);
}
