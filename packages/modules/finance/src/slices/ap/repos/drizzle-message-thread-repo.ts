import { and, eq, sql } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierMessageThreads } from '@afenda/db';
import type {
  MessageThread,
  IMessageThreadRepo,
  ThreadListQuery,
} from '../services/supplier-portal-messaging.js';

type ThreadRow = typeof supplierMessageThreads.$inferSelect;

/**
 * Phase 1.2.1: Message Thread Repository (Drizzle implementation)
 * Manages supplier message threads linked to cases.
 */

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

  async create(data: MessageThread): Promise<MessageThread> {
    const [row] = await this.tx
      .insert(supplierMessageThreads)
      .values({
        id: data.id,
        tenantId: data.tenantId,
        caseId: data.caseId,
        supplierId: data.supplierId,
        subject: data.subject,
        lastMessageAt: data.lastMessageAt,
        lastMessageBy: data.lastMessageBy,
        supplierUnreadCount: data.supplierUnreadCount,
        buyerUnreadCount: data.buyerUnreadCount,
        isSupplierArchived: data.isSupplierArchived,
        isBuyerArchived: data.isBuyerArchived,
      } as any)
      .returning();

    if (!row) throw new Error('Failed to create message thread');
    return mapToDomain(row);
  }

  async findById(tenantId: string, id: string): Promise<MessageThread | null> {
    const row = await this.tx.query.supplierMessageThreads.findFirst({
      where: and(eq(supplierMessageThreads.tenantId, tenantId), eq(supplierMessageThreads.id, id)),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(
    tenantId: string,
    supplierId: string,
    query: ThreadListQuery
  ): Promise<{ items: readonly MessageThread[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(supplierMessageThreads.tenantId, tenantId),
      eq(supplierMessageThreads.supplierId, supplierId),
    ];

    if (query.caseId) {
      conditions.push(eq(supplierMessageThreads.caseId, query.caseId));
    }

    if (!query.includeArchived) {
      conditions.push(eq(supplierMessageThreads.isSupplierArchived, false));
    }

    const rows = await this.tx.query.supplierMessageThreads.findMany({
      where: and(...conditions),
      limit,
      offset,
      orderBy: (t, { desc }) => [desc(t.lastMessageAt)],
    });

    // Count total for pagination
    const allRows = await this.tx.query.supplierMessageThreads.findMany({
      where: and(...conditions),
    });

    return {
      items: rows.map(mapToDomain),
      total: allRows.length,
    };
  }

  async updateLastMessage(
    id: string,
    lastMessageAt: Date,
    lastMessageBy: string
  ): Promise<MessageThread | null> {
    const [row] = await this.tx
      .update(supplierMessageThreads)
      .set({ lastMessageAt, lastMessageBy, updatedAt: new Date() } as any)
      .where(eq(supplierMessageThreads.id, id))
      .returning();
    return row ? mapToDomain(row) : null;
  }

  async incrementUnreadCount(
    id: string,
    side: 'supplier' | 'buyer'
  ): Promise<MessageThread | null> {
    const col =
      side === 'supplier'
        ? supplierMessageThreads.supplierUnreadCount
        : supplierMessageThreads.buyerUnreadCount;

    const [row] = await this.tx
      .update(supplierMessageThreads)
      .set({ [col.name]: sql`${col} + 1`, updatedAt: new Date() } as any)
      .where(eq(supplierMessageThreads.id, id))
      .returning();
    return row ? mapToDomain(row) : null;
  }

  async clearUnreadCount(id: string, side: 'supplier' | 'buyer'): Promise<MessageThread | null> {
    const colName = side === 'supplier' ? 'supplierUnreadCount' : 'buyerUnreadCount';

    const [row] = await this.tx
      .update(supplierMessageThreads)
      .set({ [colName]: 0, updatedAt: new Date() } as any)
      .where(eq(supplierMessageThreads.id, id))
      .returning();
    return row ? mapToDomain(row) : null;
  }
}
