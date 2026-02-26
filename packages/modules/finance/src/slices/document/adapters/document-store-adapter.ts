/**
 * IDocumentStore adapter — delegates to DocumentAttachmentService.
 * Provides backward compatibility with the document-attachment calculator.
 */
import type {
  DocumentAttachment,
  DocumentLink,
  LinkedEntityType,
} from '../../../shared/ports/document-attachment.js';
import type { DocumentAttachmentService } from '../services/document-attachment-service.js';

export interface DocumentStoreAdapterContext {
  tenantId: string;
  userId: string;
}

/**
 * Adapter that implements IDocumentStore by delegating to DocumentAttachmentService.
 * Requires tenant context for all operations.
 */
export function createDocumentStoreAdapter(
  service: DocumentAttachmentService,
  ctx: DocumentStoreAdapterContext
) {
  return {
    async link(
      documentId: string,
      entityType: LinkedEntityType,
      entityId: string,
      userId: string
    ): Promise<DocumentLink> {
      await service.complete({
        tenantId: ctx.tenantId,
        userId: userId || ctx.userId,
        documentId,
        entityType,
        entityId,
      });
      const list = await service.list({
        tenantId: ctx.tenantId,
        entityType,
        entityId,
      });
      const doc = list.documents.find((d) => d.documentId === documentId);
      if (!doc) throw new Error('Document not found after link');
      return {
        documentId,
        entityType,
        entityId,
        linkedBy: userId || ctx.userId,
        linkedAt: new Date().toISOString(),
      };
    },

    async findByEntity(
      entityType: LinkedEntityType,
      entityId: string
    ): Promise<readonly DocumentAttachment[]> {
      const result = await service.list({
        tenantId: ctx.tenantId,
        entityType,
        entityId,
      });
      return result.documents.map((d) => ({
        documentId: d.documentId,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType ?? 'application/octet-stream',
        category: (d.category as DocumentAttachment['category']) ?? 'OTHER',
        description: '',
        uploadedBy: '',
        uploadedAt: d.createdAt,
        storageRef: d.documentId,
        checksum: '',
      }));
    },

    async getDownloadUrl(documentId: string): Promise<string> {
      return service.getDownloadUrl(ctx.tenantId, ctx.userId, documentId);
    },

    async remove(documentId: string): Promise<void> {
      await service.remove(ctx.tenantId, ctx.userId, documentId);
    },

    /**
     * attach is not fully supported via this adapter — use REST API (init, presign/upload, complete) for uploads.
     * This method throws; the REST flow is the primary interface for document uploads.
     */
    async attach(
      _entityType: LinkedEntityType,
      _entityId: string,
      _meta: Omit<DocumentAttachment, 'documentId'>
    ): Promise<DocumentAttachment> {
      throw new Error(
        'Use REST API (POST /documents/init, presign, complete) for document uploads. attach() is not supported.'
      );
    },
  };
}
