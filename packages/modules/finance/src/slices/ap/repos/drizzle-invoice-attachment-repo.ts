import { eq, and, desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { documentAttachments, documentLinks } from '@afenda/db';
import type {
  InvoiceAttachment,
  IInvoiceAttachmentRepo,
  CreateAttachmentInput,
} from '../entities/invoice-attachment.js';

type DocRow = typeof documentAttachments.$inferSelect;
type LinkRow = typeof documentLinks.$inferSelect;

function mapToDomain(doc: DocRow, link: LinkRow): InvoiceAttachment {
  return {
    id: doc.documentId,
    tenantId: doc.tenantId,
    invoiceId: link.entityId,
    fileName: doc.fileName,
    mimeType: doc.declaredMime ?? 'application/octet-stream',
    storageKey: doc.storageKey,
    fileSizeBytes: doc.declaredSize ?? 0,
    uploadedBy: doc.createdBy ?? link.linkedBy,
    createdAt: doc.createdAt,
  };
}

/**
 * B7: Invoice attachment repo — bridges the AP InvoiceAttachment interface
 * to the existing document_attachment + document_link tables.
 *
 * Creates a document_attachment row for the file metadata, then a
 * document_link row linking it to the AP_INVOICE entity.
 */
export class DrizzleInvoiceAttachmentRepo implements IInvoiceAttachmentRepo {
  constructor(private readonly tx: TenantTx) {}

  async attach(input: CreateAttachmentInput): Promise<InvoiceAttachment> {
    const [docRow] = await this.tx
      .insert(documentAttachments)
      .values({
        tenantId: input.tenantId,
        bucket: 'ap-attachments',
        storageKey: input.storageKey,
        fileName: input.fileName,
        declaredMime: input.mimeType,
        declaredSize: input.fileSizeBytes,
        status: 'STORED',
        integrityStatus: 'PENDING',
        scanStatus: 'NOT_SCANNED',
        createdBy: input.uploadedBy,
      })
      .returning();

    const [linkRow] = await this.tx
      .insert(documentLinks)
      .values({
        documentId: docRow!.documentId,
        tenantId: input.tenantId,
        entityType: 'AP_INVOICE',
        entityId: input.invoiceId,
        linkedBy: input.uploadedBy,
      })
      .returning();

    return mapToDomain(docRow!, linkRow!);
  }

  async findByInvoice(invoiceId: string): Promise<InvoiceAttachment[]> {
    const links = await this.tx.query.documentLinks.findMany({
      where: and(eq(documentLinks.entityType, 'AP_INVOICE'), eq(documentLinks.entityId, invoiceId)),
      orderBy: [desc(documentLinks.linkedAt)],
    });

    if (links.length === 0) return [];

    const results: InvoiceAttachment[] = [];
    for (const link of links) {
      const doc = await this.tx.query.documentAttachments.findFirst({
        where: eq(documentAttachments.documentId, link.documentId),
      });
      if (doc) {
        results.push(mapToDomain(doc, link));
      }
    }

    return results;
  }

  async remove(id: string): Promise<void> {
    await this.tx.delete(documentLinks).where(eq(documentLinks.documentId, id));

    await this.tx
      .update(documentAttachments)
      .set({ deletedAt: new Date() })
      .where(eq(documentAttachments.documentId, id));
  }
}
