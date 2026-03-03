import { and, asc, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierMessages } from '@afenda/db';
import type {
  MessageEntity,
  IMessageRepo,
  MessageListQuery,
  SenderType,
} from '../services/supplier-portal-messaging.js';

type MessageRow = typeof supplierMessages.$inferSelect;

/**
 * Phase 1.2.1: Message Repository (Drizzle implementation)
 * Manages individual supplier messages within threads.
 */

function mapToDomain(row: MessageRow): MessageEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    threadId: row.threadId,
    body: row.body,
    senderType: row.senderType as SenderType,
    senderId: row.senderId,
    readAt: row.readAt,
    readBy: row.readBy,
    attachmentIds: (row.attachmentIds as string[] | null) ?? [],
    idempotencyKey: row.idempotencyKey,
    proofHash: row.proofHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMessageRepo implements IMessageRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(data: MessageEntity): Promise<MessageEntity> {
    const [row] = await this.tx
      .insert(supplierMessages)
      .values({
        id: data.id,
        tenantId: data.tenantId,
        threadId: data.threadId,
        body: data.body,
        senderType: data.senderType,
        senderId: data.senderId,
        readAt: data.readAt,
        readBy: data.readBy,
        attachmentIds: data.attachmentIds as string[],
        idempotencyKey: data.idempotencyKey,
        proofHash: data.proofHash,
      } as any)
      .returning();

    if (!row) throw new Error('Failed to create message');
    return mapToDomain(row);
  }

  async findById(tenantId: string, id: string): Promise<MessageEntity | null> {
    const row = await this.tx.query.supplierMessages.findFirst({
      where: and(eq(supplierMessages.tenantId, tenantId), eq(supplierMessages.id, id)),
    });
    return row ? mapToDomain(row) : null;
  }

  async findByIdempotencyKey(tenantId: string, key: string): Promise<MessageEntity | null> {
    const row = await this.tx.query.supplierMessages.findFirst({
      where: and(eq(supplierMessages.tenantId, tenantId), eq(supplierMessages.idempotencyKey, key)),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(
    tenantId: string,
    threadId: string,
    query: MessageListQuery
  ): Promise<{ items: readonly MessageEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(supplierMessages.tenantId, tenantId),
      eq(supplierMessages.threadId, threadId),
    ];

    const rows = await this.tx.query.supplierMessages.findMany({
      where: and(...conditions),
      limit,
      offset,
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    // Count total
    const allRows = await this.tx.query.supplierMessages.findMany({
      where: and(...conditions),
    });

    return {
      items: rows.map(mapToDomain),
      total: allRows.length,
    };
  }

  async markRead(id: string, readAt: Date, readBy: string): Promise<MessageEntity | null> {
    const [row] = await this.tx
      .update(supplierMessages)
      .set({ readAt, readBy, updatedAt: new Date() } as any)
      .where(eq(supplierMessages.id, id))
      .returning();
    return row ? mapToDomain(row) : null;
  }
}
