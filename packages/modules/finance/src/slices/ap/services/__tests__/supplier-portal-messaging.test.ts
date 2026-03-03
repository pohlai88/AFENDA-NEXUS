/**
 * Phase 1.2.1: Messaging Hub service unit tests (CAP-MSG).
 *
 * Tests all 5 service functions:
 *   1. startThread — start new message thread (with/without caseId)
 *   2. sendMessage — send message on existing thread (with idempotency)
 *   3. listThreads — paginated thread listing
 *   4. listMessages — paginated message listing
 *   5. markMessageRead — mark read + decrement unread count
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startThread,
  sendMessage,
  listThreads,
  listMessages,
  markMessageRead,
  type MessagingServiceDeps,
  type MessageThread,
  type MessageEntity,
  type IMessageThreadRepo,
  type IMessageRepo,
} from './supplier-portal-messaging';

// ─── Constants ───────────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';
const CASE_ID = '00000000-0000-0000-0000-000000000004';
const THREAD_ID = '00000000-0000-0000-0000-000000000005';
const MESSAGE_ID = '00000000-0000-0000-0000-000000000006';

// ─── Mock Factories ──────────────────────────────────────────────────────────

function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
  return {
    id: THREAD_ID,
    tenantId: TENANT_ID,
    caseId: CASE_ID,
    supplierId: SUPPLIER_ID,
    subject: 'Invoice Query',
    lastMessageAt: new Date(),
    lastMessageBy: USER_ID,
    supplierUnreadCount: 0,
    buyerUnreadCount: 1,
    isSupplierArchived: false,
    isBuyerArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMessage(overrides: Partial<MessageEntity> = {}): MessageEntity {
  return {
    id: MESSAGE_ID,
    tenantId: TENANT_ID,
    threadId: THREAD_ID,
    body: 'Hello, I have a question about invoice INV-001',
    senderType: 'SUPPLIER',
    senderId: USER_ID,
    readAt: null,
    readBy: null,
    attachmentIds: [],
    idempotencyKey: null,
    proofHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<MessagingServiceDeps> = {}): MessagingServiceDeps {
  const messageThreadRepo: IMessageThreadRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findById: vi.fn().mockResolvedValue(makeThread()),
    list: vi.fn().mockResolvedValue({ items: [makeThread()], total: 1 }),
    updateLastMessage: vi.fn().mockResolvedValue(makeThread()),
    incrementUnreadCount: vi.fn().mockResolvedValue(makeThread()),
    clearUnreadCount: vi.fn().mockResolvedValue(makeThread()),
  };

  const messageRepo: IMessageRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findById: vi.fn().mockResolvedValue(makeMessage()),
    findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({ items: [makeMessage()], total: 1 }),
    markRead: vi.fn().mockImplementation(async (id, readAt, readBy) => ({
      ...makeMessage(),
      id,
      readAt,
      readBy,
    })),
  };

  const supplierCaseRepo = {
    findById: vi.fn().mockResolvedValue({
      id: CASE_ID,
      tenantId: TENANT_ID,
      supplierId: SUPPLIER_ID,
    }),
    create: vi.fn().mockImplementation(async (data) => data),
    nextTicketSequence: vi.fn().mockResolvedValue(1),
    // minimal interface surface
  } as any;

  const caseTimelineRepo = {
    append: vi.fn().mockImplementation(async (data) => data),
    findByCaseId: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  } as any;

  return {
    messageThreadRepo,
    messageRepo,
    supplierCaseRepo,
    caseTimelineRepo,
    supplierRepo: {
      findById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: SUPPLIER_ID, tenantId: TENANT_ID, status: 'ACTIVE' },
      }),
    } as any,
    outboxWriter: {
      write: vi.fn().mockResolvedValue(undefined),
    } as any,
    proofChainWriter: {
      write: vi.fn().mockResolvedValue({ contentHash: 'proof-hash-abc' }),
    } as any,
    ...overrides,
  };
}

// ─── Tests: startThread ──────────────────────────────────────────────────────

describe('startThread', () => {
  it('creates thread and initial message linked to existing case', async () => {
    const deps = makeDeps();
    const result = await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        caseId: CASE_ID,
        subject: 'Invoice Query',
        initialMessageBody: 'Hello, I have a question about invoice INV-001',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.thread.caseId).toBe(CASE_ID);
    expect(result.value.thread.subject).toBe('Invoice Query');
    expect(result.value.message.body).toBe('Hello, I have a question about invoice INV-001');
    expect(result.value.message.senderType).toBe('SUPPLIER');
    expect(result.value.thread.buyerUnreadCount).toBe(1); // supplier sent → buyer unread
    expect(result.value.thread.supplierUnreadCount).toBe(0);
  });

  it('creates implicit GENERAL case when no caseId provided', async () => {
    const deps = makeDeps();
    const result = await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        subject: 'General Inquiry',
        initialMessageBody: 'Hello, I have a general question',
      },
      deps
    );

    expect(result.ok).toBe(true);
    // Should have called create on supplierCaseRepo to make GENERAL case
    expect(deps.supplierCaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'GENERAL', priority: 'MEDIUM' })
    );
  });

  it('appends timeline entry to case (storage invariant)', async () => {
    const deps = makeDeps();
    await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        caseId: CASE_ID,
        subject: 'Timeline Test',
        initialMessageBody: 'Body of the message here!',
      },
      deps
    );

    expect(deps.caseTimelineRepo.append).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: CASE_ID,
        entryType: 'message',
        refType: 'supplier_message',
        actorType: 'SUPPLIER',
      })
    );
  });

  it('writes proof chain entry', async () => {
    const deps = makeDeps();
    await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        caseId: CASE_ID,
        subject: 'Test',
        initialMessageBody: 'Test message',
      },
      deps
    );

    expect(deps.proofChainWriter!.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'MESSAGE_SENT' }),
      undefined
    );
  });

  it('emits SUPPLIER_MESSAGE_THREAD_STARTED outbox event', async () => {
    const deps = makeDeps();
    await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        caseId: CASE_ID,
        subject: 'Test subject',
        initialMessageBody: 'Test body',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_MESSAGE_THREAD_STARTED' })
    );
  });

  it('returns error when supplier not found', async () => {
    const deps = makeDeps({
      supplierRepo: {
        findById: vi.fn().mockResolvedValue({ ok: false, error: new Error('not found') }),
      } as any,
    });

    const result = await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: 'bad-id',
        userId: USER_ID,
        senderType: 'SUPPLIER',
        subject: 'Test',
        initialMessageBody: 'Test body',
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('returns error when subject is too short', async () => {
    const deps = makeDeps();
    const result = await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        subject: 'X', // too short (< 2 chars)
        initialMessageBody: 'Body',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
    }
  });

  it('returns error when caseId belongs to different tenant', async () => {
    const deps = makeDeps({
      supplierCaseRepo: {
        findById: vi.fn().mockResolvedValue({
          id: CASE_ID,
          tenantId: 'different-tenant',
          supplierId: SUPPLIER_ID,
        }),
        create: vi.fn(),
        nextTicketSequence: vi.fn(),
      } as any,
    });

    const result = await startThread(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        caseId: CASE_ID,
        subject: 'Valid Subject',
        initialMessageBody: 'Valid body',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });
});

// ─── Tests: sendMessage ──────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('creates message on existing thread', async () => {
    const deps = makeDeps();
    const result = await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Follow-up question about the invoice',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.body).toBe('Follow-up question about the invoice');
    expect(result.value.senderType).toBe('SUPPLIER');
    expect(result.value.threadId).toBe(THREAD_ID);
  });

  it('appends timeline entry (storage invariant)', async () => {
    const deps = makeDeps();
    await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Timeline test body',
      },
      deps
    );

    expect(deps.caseTimelineRepo.append).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'message',
        refType: 'supplier_message',
      })
    );
  });

  it('increments unread count for opposing side (SUPPLIER sends → buyer unread)', async () => {
    const deps = makeDeps();
    await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Test message',
      },
      deps
    );

    expect(deps.messageThreadRepo.incrementUnreadCount).toHaveBeenCalledWith(THREAD_ID, 'buyer');
  });

  it('increments unread count for supplier when BUYER sends', async () => {
    const deps = makeDeps();
    await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'BUYER',
        body: 'Buyer reply',
      },
      deps
    );

    expect(deps.messageThreadRepo.incrementUnreadCount).toHaveBeenCalledWith(THREAD_ID, 'supplier');
  });

  it('idempotency: returns existing message when key already exists', async () => {
    const existingMsg = makeMessage({ id: 'existing-msg-id', idempotencyKey: 'idem-key-123' });
    const deps = makeDeps({
      messageRepo: {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdempotencyKey: vi.fn().mockResolvedValue(existingMsg),
        list: vi.fn(),
        markRead: vi.fn(),
      } as any,
    });

    const result = await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Duplicate message',
        idempotencyKey: 'idem-key-123',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe('existing-msg-id');
    // Should NOT have created a new message
    expect(deps.messageRepo.create).not.toHaveBeenCalled();
  });

  it('returns error when thread not found', async () => {
    const deps = makeDeps({
      messageThreadRepo: {
        findById: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        list: vi.fn(),
        updateLastMessage: vi.fn(),
        incrementUnreadCount: vi.fn(),
        clearUnreadCount: vi.fn(),
      } as any,
    });

    const result = await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: 'nonexistent-thread',
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Test',
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('returns error when thread belongs to different supplier', async () => {
    const deps = makeDeps({
      messageThreadRepo: {
        findById: vi.fn().mockResolvedValue(makeThread({ supplierId: 'different-supplier' })),
        create: vi.fn(),
        list: vi.fn(),
        updateLastMessage: vi.fn(),
        incrementUnreadCount: vi.fn(),
        clearUnreadCount: vi.fn(),
      } as any,
    });

    const result = await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Test',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('emits SUPPLIER_MESSAGE_SENT outbox event', async () => {
    const deps = makeDeps();
    await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Test event emission',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_MESSAGE_SENT' })
    );
  });

  it('writes proof chain on send', async () => {
    const deps = makeDeps();
    await sendMessage(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        threadId: THREAD_ID,
        userId: USER_ID,
        senderType: 'SUPPLIER',
        body: 'Proof chain test',
      },
      deps
    );

    expect(deps.proofChainWriter!.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'MESSAGE_SENT' }),
      undefined
    );
  });
});

// ─── Tests: listThreads ─────────────────────────────────────────────────────

describe('listThreads', () => {
  it('returns paginated thread list with hasMore flag', async () => {
    const deps = makeDeps({
      messageThreadRepo: {
        findById: vi.fn(),
        create: vi.fn(),
        updateLastMessage: vi.fn(),
        incrementUnreadCount: vi.fn(),
        clearUnreadCount: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [makeThread(), makeThread()], total: 5 }),
      } as any,
    });

    const result = await listThreads(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        page: 1,
        limit: 2,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(2);
    expect(result.value.total).toBe(5);
    expect(result.value.hasMore).toBe(true); // total(5) > page(1) * limit(2)
    expect(result.value.page).toBe(1);
    expect(result.value.limit).toBe(2);
  });

  it('uses defaults when page/limit not provided', async () => {
    const deps = makeDeps();
    const result = await listThreads({ tenantId: TENANT_ID, supplierId: SUPPLIER_ID }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.page).toBe(1);
    expect(result.value.limit).toBe(20);
  });

  it('hasMore is false when on last page', async () => {
    const deps = makeDeps({
      messageThreadRepo: {
        findById: vi.fn(),
        create: vi.fn(),
        updateLastMessage: vi.fn(),
        incrementUnreadCount: vi.fn(),
        clearUnreadCount: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [makeThread()], total: 1 }),
      } as any,
    });

    const result = await listThreads(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, page: 1, limit: 20 },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasMore).toBe(false);
  });
});

// ─── Tests: listMessages ────────────────────────────────────────────────────

describe('listMessages', () => {
  it('returns paginated message list in chronological order', async () => {
    const msgs = [makeMessage({ id: 'msg-1' }), makeMessage({ id: 'msg-2' })];
    const deps = makeDeps({
      messageRepo: {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        markRead: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: msgs, total: 2 }),
      } as any,
    });

    const result = await listMessages(
      { tenantId: TENANT_ID, threadId: THREAD_ID, page: 1, limit: 50 },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(2);
    expect(result.value.total).toBe(2);
    expect(result.value.hasMore).toBe(false);
  });

  it('uses defaults (page=1, limit=50) when not provided', async () => {
    const deps = makeDeps();
    const result = await listMessages({ tenantId: TENANT_ID, threadId: THREAD_ID }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.page).toBe(1);
    expect(result.value.limit).toBe(50);
  });
});

// ─── Tests: markMessageRead ─────────────────────────────────────────────────

describe('markMessageRead', () => {
  it('marks message as read and clears unread count', async () => {
    const deps = makeDeps();
    const result = await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: MESSAGE_ID,
        threadId: THREAD_ID,
        readBy: USER_ID,
        readerSide: 'supplier',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.readBy).toBe(USER_ID);
    expect(deps.messageThreadRepo.clearUnreadCount).toHaveBeenCalledWith(THREAD_ID, 'supplier');
  });

  it('is idempotent — returns existing message if already read', async () => {
    const alreadyRead = makeMessage({
      readAt: new Date('2024-01-01'),
      readBy: USER_ID,
    });
    const deps = makeDeps({
      messageRepo: {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue(alreadyRead),
        findByIdempotencyKey: vi.fn(),
        list: vi.fn(),
        markRead: vi.fn(),
      } as any,
    });

    const result = await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: MESSAGE_ID,
        threadId: THREAD_ID,
        readBy: USER_ID,
        readerSide: 'supplier',
      },
      deps
    );

    expect(result.ok).toBe(true);
    // Should NOT call markRead or clearUnreadCount — already read
    expect(deps.messageRepo.markRead).not.toHaveBeenCalled();
    expect(deps.messageThreadRepo.clearUnreadCount).not.toHaveBeenCalled();
  });

  it('returns error when message not found', async () => {
    const deps = makeDeps({
      messageRepo: {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue(null),
        findByIdempotencyKey: vi.fn(),
        list: vi.fn(),
        markRead: vi.fn(),
      } as any,
    });

    const result = await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: 'nonexistent',
        threadId: THREAD_ID,
        readBy: USER_ID,
        readerSide: 'supplier',
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('returns error when message threadId mismatches input threadId', async () => {
    const deps = makeDeps({
      messageRepo: {
        create: vi.fn(),
        findById: vi.fn().mockResolvedValue(makeMessage({ threadId: 'different-thread' })),
        findByIdempotencyKey: vi.fn(),
        list: vi.fn(),
        markRead: vi.fn(),
      } as any,
    });

    const result = await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: MESSAGE_ID,
        threadId: THREAD_ID, // mismatches message.threadId above
        readBy: USER_ID,
        readerSide: 'supplier',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
    }
  });

  it('writes proof chain entry on read', async () => {
    const deps = makeDeps();
    await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: MESSAGE_ID,
        threadId: THREAD_ID,
        readBy: USER_ID,
        readerSide: 'buyer',
      },
      deps
    );

    expect(deps.proofChainWriter!.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'MESSAGE_READ', actorType: 'BUYER' }),
      undefined
    );
  });

  it('emits SUPPLIER_MESSAGE_READ outbox event', async () => {
    const deps = makeDeps();
    await markMessageRead(
      {
        tenantId: TENANT_ID,
        messageId: MESSAGE_ID,
        threadId: THREAD_ID,
        readBy: USER_ID,
        readerSide: 'supplier',
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SUPPLIER_MESSAGE_READ' })
    );
  });
});
