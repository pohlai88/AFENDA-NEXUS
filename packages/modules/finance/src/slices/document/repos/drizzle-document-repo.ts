import { and, asc, eq, gt, ne, or, sql } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { documentAttachments, documentLinks } from '@afenda/db';
import type {
  DocumentAttachmentRow,
  DocumentLinkRow,
  FindByEntityPaginatedResult,
  InsertDocumentAttachmentInput,
  InsertDocumentLinkInput,
  IDocumentAttachmentRepo,
  IDocumentLinkRepo,
} from '../ports/document-repo.js';

export class DrizzleDocumentAttachmentRepo implements IDocumentAttachmentRepo {
  constructor(private readonly tx: TenantTx) {}

  async insert(input: InsertDocumentAttachmentInput): Promise<DocumentAttachmentRow> {
    const [row] = await this.tx
      .insert(documentAttachments)
      .values({
        tenantId: input.tenantId,
        keyVersion: input.keyVersion ?? 1,
        bucket: input.bucket,
        storageKey: input.storageKey,
        provider: input.provider ?? 'R2',
        fileName: input.fileName,
        fileNameOriginal: input.fileNameOriginal ?? null,
        declaredSize: input.declaredSize ?? null,
        declaredMime: input.declaredMime ?? null,
        checksumSha256: input.checksumSha256 ?? null,
        status: input.status,
        integrityStatus: input.integrityStatus,
        scanStatus: input.scanStatus ?? 'NOT_SCANNED',
        category: input.category
          ? (input.category as
              | 'INVOICE'
              | 'RECEIPT'
              | 'CONTRACT'
              | 'BANK_STATEMENT'
              | 'BOARD_MINUTES'
              | 'TAX_NOTICE'
              | 'VALUATION_REPORT'
              | 'LEGAL_OPINION'
              | 'INSURANCE_POLICY'
              | 'CORRESPONDENCE'
              | 'OTHER')
          : null,
        description: input.description ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();
    if (!row) throw new Error('Insert failed');
    return this.toRow(row);
  }

  async insertOnConflictDoNothing(
    input: InsertDocumentAttachmentInput
  ): Promise<{ inserted: boolean; row?: DocumentAttachmentRow }> {
    if (!input.checksumSha256) {
      const [row] = await this.tx
        .insert(documentAttachments)
        .values({
          tenantId: input.tenantId,
          keyVersion: input.keyVersion ?? 1,
          bucket: input.bucket,
          storageKey: input.storageKey,
          provider: input.provider ?? 'R2',
          fileName: input.fileName,
          fileNameOriginal: input.fileNameOriginal ?? null,
          declaredSize: input.declaredSize ?? null,
          declaredMime: input.declaredMime ?? null,
          checksumSha256: null,
          status: input.status,
          integrityStatus: input.integrityStatus,
          scanStatus: input.scanStatus ?? 'NOT_SCANNED',
          category: input.category
            ? (input.category as
                | 'INVOICE'
                | 'RECEIPT'
                | 'CONTRACT'
                | 'BANK_STATEMENT'
                | 'BOARD_MINUTES'
                | 'TAX_NOTICE'
                | 'VALUATION_REPORT'
                | 'LEGAL_OPINION'
                | 'INSURANCE_POLICY'
                | 'CORRESPONDENCE'
                | 'OTHER')
            : null,
          description: input.description ?? null,
          createdBy: input.createdBy ?? null,
        })
        .returning();
      return { inserted: !!row, row: row ? this.toRow(row) : undefined };
    }
    const [row] = await this.tx
      .insert(documentAttachments)
      .values({
        tenantId: input.tenantId,
        keyVersion: input.keyVersion ?? 1,
        bucket: input.bucket,
        storageKey: input.storageKey,
        provider: input.provider ?? 'R2',
        fileName: input.fileName,
        fileNameOriginal: input.fileNameOriginal ?? null,
        declaredSize: input.declaredSize ?? null,
        declaredMime: input.declaredMime ?? null,
        checksumSha256: input.checksumSha256,
        status: input.status,
        integrityStatus: input.integrityStatus,
        scanStatus: input.scanStatus ?? 'NOT_SCANNED',
        category: input.category
          ? (input.category as
              | 'INVOICE'
              | 'RECEIPT'
              | 'CONTRACT'
              | 'BANK_STATEMENT'
              | 'BOARD_MINUTES'
              | 'TAX_NOTICE'
              | 'VALUATION_REPORT'
              | 'LEGAL_OPINION'
              | 'INSURANCE_POLICY'
              | 'CORRESPONDENCE'
              | 'OTHER')
          : null,
        description: input.description ?? null,
        createdBy: input.createdBy ?? null,
      })
      .onConflictDoNothing({
        target: [documentAttachments.tenantId, documentAttachments.checksumSha256],
      })
      .returning();
    return { inserted: !!row, row: row ? this.toRow(row) : undefined };
  }

  async findByChecksum(
    tenantId: string,
    checksumSha256: string
  ): Promise<DocumentAttachmentRow | null> {
    const [row] = await this.tx
      .select()
      .from(documentAttachments)
      .where(
        and(
          eq(documentAttachments.tenantId, tenantId),
          eq(documentAttachments.checksumSha256, checksumSha256),
          sql`${documentAttachments.deletedAt} IS NULL`
        )
      )
      .limit(1);
    return row ? this.toRow(row) : null;
  }

  async findById(tenantId: string, documentId: string): Promise<DocumentAttachmentRow | null> {
    const [row] = await this.tx
      .select()
      .from(documentAttachments)
      .where(
        and(
          eq(documentAttachments.tenantId, tenantId),
          eq(documentAttachments.documentId, documentId)
        )
      )
      .limit(1);
    return row ? this.toRow(row) : null;
  }

  async findByChecksumVerified(
    tenantId: string,
    checksumSha256: string,
    excludeDocumentId?: string
  ): Promise<DocumentAttachmentRow | null> {
    const whereConditions = [
      eq(documentAttachments.tenantId, tenantId),
      eq(documentAttachments.checksumSha256, checksumSha256),
      eq(documentAttachments.integrityStatus, 'VERIFIED'),
      eq(documentAttachments.status, 'STORED'),
      sql`${documentAttachments.deletedAt} IS NULL`,
    ] as const;
    const where = excludeDocumentId
      ? and(...whereConditions, ne(documentAttachments.documentId, excludeDocumentId))
      : and(...whereConditions);
    const [row] = await this.tx.select().from(documentAttachments).where(where).limit(1);
    return row ? this.toRow(row) : null;
  }

  async updateStatus(documentId: string, status: DocumentAttachmentRow['status']): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ status, updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async updateIntegrity(
    documentId: string,
    checksumSha256: string,
    integrityStatus: DocumentAttachmentRow['integrityStatus']
  ): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ checksumSha256, integrityStatus, updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async updateIntegrityFailed(documentId: string): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ integrityStatus: 'FAILED', updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async updateObserved(
    documentId: string,
    observedSize: number,
    observedMime: string
  ): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ observedSize, observedMime, updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async softDelete(documentId: string, deletedBy: string): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({
        status: 'DELETED',
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async updateStorageDeleted(documentId: string): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ storageDeletedAt: new Date(), updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  async updateStorageKey(documentId: string, storageKey: string): Promise<void> {
    await this.tx
      .update(documentAttachments)
      .set({ storageKey, updatedAt: new Date() })
      .where(eq(documentAttachments.documentId, documentId));
  }

  private toRow(r: typeof documentAttachments.$inferSelect): DocumentAttachmentRow {
    return {
      documentId: r.documentId,
      tenantId: r.tenantId,
      keyVersion: r.keyVersion,
      bucket: r.bucket,
      storageKey: r.storageKey,
      provider: r.provider,
      fileName: r.fileName,
      fileNameOriginal: r.fileNameOriginal ?? null,
      declaredSize: r.declaredSize,
      declaredMime: r.declaredMime,
      observedSize: r.observedSize,
      observedMime: r.observedMime,
      checksumSha256: r.checksumSha256,
      status: r.status as DocumentAttachmentRow['status'],
      integrityStatus: r.integrityStatus as DocumentAttachmentRow['integrityStatus'],
      scanStatus: r.scanStatus as DocumentAttachmentRow['scanStatus'],
      category: r.category,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      createdBy: r.createdBy,
      deletedAt: r.deletedAt,
      deletedBy: r.deletedBy,
      storageDeletedAt: r.storageDeletedAt,
    };
  }
}

export class DrizzleDocumentLinkRepo implements IDocumentLinkRepo {
  constructor(private readonly tx: TenantTx) {}

  async insert(input: InsertDocumentLinkInput): Promise<DocumentLinkRow> {
    const [row] = await this.tx
      .insert(documentLinks)
      .values({
        documentId: input.documentId,
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        linkedBy: input.linkedBy,
        linkedCompanyId: input.linkedCompanyId ?? null,
      })
      .returning();
    if (!row) throw new Error('Insert failed');
    return this.toRow(row);
  }

  async findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<DocumentLinkRow[]> {
    const rows = await this.tx
      .select()
      .from(documentLinks)
      .where(
        and(
          eq(documentLinks.tenantId, tenantId),
          eq(documentLinks.entityType, entityType as DocumentLinkRow['entityType']),
          eq(documentLinks.entityId, entityId)
        )
      );
    return rows.map((r) => this.toRow(r));
  }

  async findByEntityPaginated(
    tenantId: string,
    entityType: string,
    entityId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<FindByEntityPaginatedResult> {
    const baseWhere = and(
      eq(documentLinks.tenantId, tenantId),
      eq(documentLinks.entityType, entityType as DocumentLinkRow['entityType']),
      eq(documentLinks.entityId, entityId)
    );

    let cursorCondition = undefined;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
          linkedAt: string;
          documentId: string;
        };
        const cursorDate = new Date(decoded.linkedAt);
        cursorCondition = or(
          gt(documentLinks.linkedAt, cursorDate),
          and(
            eq(documentLinks.linkedAt, cursorDate),
            gt(documentLinks.documentId, decoded.documentId)
          )
        );
      } catch {
        // Invalid cursor, ignore
      }
    }

    const take = limit + 1;
    const rows = await this.tx
      .select()
      .from(documentLinks)
      .where(cursorCondition ? and(baseWhere, cursorCondition) : baseWhere)
      .orderBy(asc(documentLinks.linkedAt), asc(documentLinks.documentId))
      .limit(take);

    const hasMore = rows.length > limit;
    const links = (hasMore ? rows.slice(0, limit) : rows).map((r) => this.toRow(r));
    let nextCursor: string | undefined;
    const last = links[links.length - 1];
    if (hasMore && last) {
      nextCursor = Buffer.from(
        JSON.stringify({ linkedAt: last.linkedAt.toISOString(), documentId: last.documentId }),
        'utf8'
      ).toString('base64url');
    }

    return { links, nextCursor };
  }

  async findByDocument(tenantId: string, documentId: string): Promise<DocumentLinkRow[]> {
    const rows = await this.tx
      .select()
      .from(documentLinks)
      .where(and(eq(documentLinks.tenantId, tenantId), eq(documentLinks.documentId, documentId)));
    return rows.map((r) => this.toRow(r));
  }

  async deleteByDocumentId(tenantId: string, documentId: string): Promise<void> {
    await this.tx
      .delete(documentLinks)
      .where(and(eq(documentLinks.tenantId, tenantId), eq(documentLinks.documentId, documentId)));
  }

  async exists(
    tenantId: string,
    entityType: string,
    entityId: string,
    documentId: string
  ): Promise<boolean> {
    const [row] = await this.tx
      .select({ documentId: documentLinks.documentId })
      .from(documentLinks)
      .where(
        and(
          eq(documentLinks.tenantId, tenantId),
          eq(documentLinks.entityType, entityType as DocumentLinkRow['entityType']),
          eq(documentLinks.entityId, entityId),
          eq(documentLinks.documentId, documentId)
        )
      )
      .limit(1);
    return !!row;
  }

  private toRow(r: typeof documentLinks.$inferSelect): DocumentLinkRow {
    return {
      documentId: r.documentId,
      tenantId: r.tenantId,
      entityType: r.entityType as DocumentLinkRow['entityType'],
      entityId: r.entityId,
      linkedBy: r.linkedBy,
      linkedAt: r.linkedAt,
      linkedCompanyId: r.linkedCompanyId,
    };
  }
}
