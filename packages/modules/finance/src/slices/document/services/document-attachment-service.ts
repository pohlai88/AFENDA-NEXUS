/**
 * DocumentAttachmentService — orchestrates document storage, dedup, and linking.
 * Composes IObjectStore + repos + session.
 */
import { createHash } from 'node:crypto';
import type { DbSession, TenantTx } from '@afenda/db';
import { auditLogs } from '@afenda/db';
import type { IObjectStore } from '@afenda/storage';
import { sanitizeFilenameForStorage, extFromMime, validateMimeAgainstSniff } from '@afenda/storage';
import type { LinkedEntityType } from '../../../shared/ports/document-attachment.js';
import { DrizzleDocumentAttachmentRepo } from '../repos/drizzle-document-repo.js';
import { DrizzleDocumentLinkRepo } from '../repos/drizzle-document-repo.js';
import { DrizzleIdempotencyStore } from '../../../shared/repos/drizzle-idempotency.js';
import { DrizzleOutboxWriter } from '../../../shared/repos/drizzle-outbox-writer.js';

const BUCKET = process.env.R2_BUCKET_NAME ?? 'documents';
const KEY_VERSION = 1;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DIRECT_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB for direct upload

function buildStorageKey(tenantId: string, documentId: string, ext: string): string {
  return `v${KEY_VERSION}/${tenantId}/${documentId}${ext}`;
}

export interface DocumentAuditContext {
  ip?: string;
  userAgent?: string;
  traceId?: string;
}

export interface DocumentInitInput {
  tenantId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  category?: string;
  description?: string;
  entityType?: LinkedEntityType;
  entityId?: string;
  linkedCompanyId?: string;
  idempotencyKey?: string;
  auditContext?: DocumentAuditContext;
}

export interface DocumentInitResult {
  documentId: string;
  storageKey: string;
  uploadMethod: 'direct' | 'presigned' | 'multipart';
}

export interface DocumentPresignInput {
  tenantId: string;
  userId: string;
  documentId: string;
  expirySec?: number;
  auditContext?: DocumentAuditContext;
}

export interface DocumentPresignResult {
  uploadUrl: string;
  storageKey: string;
}

export interface DocumentCompleteInput {
  tenantId: string;
  userId: string;
  documentId: string;
  entityType: LinkedEntityType;
  entityId: string;
  linkedCompanyId?: string;
  idempotencyKey?: string;
  auditContext?: DocumentAuditContext;
}

export interface DocumentCompleteResult {
  documentId: string;
  linked: boolean;
  dedupHit?: boolean;
}

export interface DocumentListInput {
  tenantId: string;
  entityType?: LinkedEntityType;
  entityId?: string;
  cursor?: string;
  limit?: number;
  /** When true, include link metadata (entityType, entityId) for each document. */
  includeLinks?: boolean;
}

export interface DocumentDownloadInput {
  tenantId: string;
  userId: string;
  documentId: string;
  filename?: string;
  /** When true, allow download when scanStatus is NOT_SCANNED (e.g. system-generated PDFs). */
  allowNotScanned?: boolean;
  auditContext?: DocumentAuditContext;
}

export interface DocumentListResult {
  documents: Array<{
    documentId: string;
    fileName: string;
    fileSize: number;
    mimeType: string | null;
    category: string | null;
    status: string;
    integrityStatus: string;
    scanStatus: string;
    createdAt: string;
    links?: Array<{ entityType: string; entityId: string }>;
  }>;
  nextCursor?: string;
}

export interface DocumentRemoveInput {
  tenantId: string;
  userId: string;
  documentId: string;
  auditContext?: DocumentAuditContext;
}

export interface DocumentUploadDirectInput {
  tenantId: string;
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType?: string;
  entityType: LinkedEntityType;
  entityId: string;
  linkedCompanyId?: string;
  category?: string;
  description?: string;
  auditContext?: DocumentAuditContext;
}

export interface DocumentUploadDirectResult {
  documentId: string;
  linked: boolean;
  dedupHit: boolean;
}

export class DocumentAttachmentService {
  constructor(
    private readonly session: DbSession,
    private readonly objectStore: IObjectStore
  ) {}

  async init(input: DocumentInitInput): Promise<DocumentInitResult> {
    if (input.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large. Max ${MAX_FILE_SIZE_MB}MB`);
    }

    const { safe: fileName, original: fileNameOriginal } = sanitizeFilenameForStorage(
      input.fileName
    );
    const ext = extFromMime(input.mimeType);
    const uploadMethod =
      input.fileSize < 5 * 1024 * 1024
        ? 'direct'
        : input.fileSize < 50 * 1024 * 1024
          ? 'presigned'
          : 'multipart';

    return this.session.withTenant(
      { tenantId: input.tenantId, userId: input.userId },
      async (tx) => {
        const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);
        const idempotencyStore = new DrizzleIdempotencyStore(tx);

        if (input.idempotencyKey) {
          const result = await idempotencyStore.claimOrGet({
            tenantId: input.tenantId,
            key: input.idempotencyKey,
            commandType: 'document_init',
          });
          if (!result.claimed && result.resultRef) {
            const existing = await attachmentRepo.findById(input.tenantId, result.resultRef);
            if (existing) {
              await this.auditDocument(
                input.tenantId,
                input.userId,
                'document_init',
                result.resultRef,
                {
                  documentId: result.resultRef,
                  entityType: input.entityType,
                  entityId: input.entityId,
                  traceId: input.auditContext?.traceId,
                },
                input.auditContext,
                tx
              );
              return {
                documentId: existing.documentId,
                storageKey: existing.storageKey,
                uploadMethod,
              };
            }
          }
        }

        const row = await attachmentRepo.insert({
          tenantId: input.tenantId,
          keyVersion: KEY_VERSION,
          bucket: BUCKET,
          storageKey: `v${KEY_VERSION}/${input.tenantId}/temp`,
          provider: 'R2',
          fileName,
          fileNameOriginal: fileNameOriginal.slice(0, 255),
          declaredSize: input.fileSize,
          declaredMime: input.mimeType ?? null,
          status: 'PENDING_UPLOAD',
          integrityStatus: 'PENDING',
          scanStatus: 'NOT_SCANNED',
          category: input.category ?? null,
          description: input.description ?? null,
          createdBy: input.userId,
        });

        const storageKey = buildStorageKey(input.tenantId, row.documentId, ext);
        await attachmentRepo.updateStorageKey(row.documentId, storageKey);

        if (input.idempotencyKey && idempotencyStore.recordOutcome) {
          await idempotencyStore.recordOutcome(
            input.tenantId,
            input.idempotencyKey,
            'document_init',
            row.documentId
          );
        }

        await this.auditDocument(
          input.tenantId,
          input.userId,
          'document_init',
          row.documentId,
          {
            documentId: row.documentId,
            entityType: input.entityType,
            entityId: input.entityId,
            traceId: input.auditContext?.traceId,
          },
          input.auditContext,
          tx
        );

        return {
          documentId: row.documentId,
          storageKey,
          uploadMethod,
        };
      }
    );
  }

  async presign(input: DocumentPresignInput): Promise<DocumentPresignResult> {
    const doc = await this.session.withTenant(
      { tenantId: input.tenantId, userId: input.userId },
      async (tx) => {
        const repo = new DrizzleDocumentAttachmentRepo(tx);
        const d = await repo.findById(input.tenantId, input.documentId);
        if (d) {
          await this.auditDocument(
            input.tenantId,
            input.userId,
            'document_presign',
            input.documentId,
            {
              documentId: input.documentId,
              traceId: input.auditContext?.traceId,
            },
            input.auditContext,
            tx
          );
        }
        return d;
      }
    );

    if (!doc) throw new Error('Document not found');
    if (doc.deletedAt) throw new Error('Document deleted');
    if (doc.status !== 'PENDING_UPLOAD') throw new Error('Document not in PENDING_UPLOAD');

    const uploadUrl = await this.objectStore.getSignedUploadUrl(
      { tenantId: input.tenantId, userId: input.userId },
      doc.storageKey,
      {
        contentType: doc.declaredMime ?? 'application/octet-stream',
        contentLength: doc.declaredSize ?? undefined,
      },
      input.expirySec ?? 3600
    );

    return { uploadUrl, storageKey: doc.storageKey };
  }

  async complete(input: DocumentCompleteInput): Promise<DocumentCompleteResult> {
    return this.session.withTenant(
      { tenantId: input.tenantId, userId: input.userId },
      async (tx) => {
        const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);
        const linkRepo = new DrizzleDocumentLinkRepo(tx);
        const outboxWriter = new DrizzleOutboxWriter(tx);
        const idempotencyStore = new DrizzleIdempotencyStore(tx);

        if (input.idempotencyKey) {
          const result = await idempotencyStore.claimOrGet({
            tenantId: input.tenantId,
            key: input.idempotencyKey,
            commandType: 'document_complete',
          });
          if (!result.claimed && result.resultRef) {
            try {
              const parsed = JSON.parse(result.resultRef) as {
                documentId: string;
                linked: boolean;
              };
              await this.auditDocument(
                input.tenantId,
                input.userId,
                'document_complete',
                parsed.documentId,
                {
                  documentId: parsed.documentId,
                  linked: parsed.linked,
                  entityType: input.entityType,
                  entityId: input.entityId,
                  traceId: input.auditContext?.traceId,
                },
                input.auditContext,
                tx
              );
              return parsed;
            } catch {
              return { documentId: input.documentId, linked: false };
            }
          }
        }

        const doc = await attachmentRepo.findById(input.tenantId, input.documentId);
        if (!doc) throw new Error('Document not found');
        if (doc.deletedAt) {
          await outboxWriter.write({
            tenantId: input.tenantId,
            eventType: 'DOCUMENT_R2_DELETE',
            payload: {
              documentId: input.documentId,
              storageKey: doc.storageKey,
              bucket: doc.bucket,
            },
          });
          throw new Error('Document deleted'); // 410
        }
        if (doc.status !== 'PENDING_UPLOAD' && doc.status !== 'STORED') {
          throw new Error('Document not in valid state for complete');
        }

        if (doc.status === 'PENDING_UPLOAD') {
          const head = await this.objectStore.headObject(
            { tenantId: input.tenantId, userId: input.userId },
            doc.storageKey
          );
          if (!head) throw new Error('Object not found in storage');
          await attachmentRepo.updateObserved(
            input.documentId,
            head.size ?? doc.declaredSize ?? 0,
            head.contentType ?? doc.declaredMime ?? 'application/octet-stream'
          );
          await attachmentRepo.updateStatus(input.documentId, 'STORED');
          await outboxWriter.write({
            tenantId: input.tenantId,
            eventType: 'DOCUMENT_VERIFY_CHECKSUM',
            payload: {
              documentId: input.documentId,
              storageKey: doc.storageKey,
              bucket: doc.bucket,
            },
          });
        }

        const exists = await linkRepo.exists(
          input.tenantId,
          input.entityType,
          input.entityId,
          input.documentId
        );
        if (exists) {
          await this.auditDocument(
            input.tenantId,
            input.userId,
            'document_complete',
            input.documentId,
            {
              documentId: input.documentId,
              linked: false,
              entityType: input.entityType,
              entityId: input.entityId,
              traceId: input.auditContext?.traceId,
            },
            input.auditContext,
            tx
          );
          return { documentId: input.documentId, linked: false };
        }

        await linkRepo.insert({
          documentId: input.documentId,
          tenantId: input.tenantId,
          entityType: input.entityType,
          entityId: input.entityId,
          linkedBy: input.userId,
          linkedCompanyId: input.linkedCompanyId ?? null,
        });

        const completeResult: DocumentCompleteResult = {
          documentId: input.documentId,
          linked: true,
        };
        if (input.idempotencyKey && idempotencyStore.recordOutcome) {
          await idempotencyStore.recordOutcome(
            input.tenantId,
            input.idempotencyKey,
            'document_complete',
            JSON.stringify(completeResult)
          );
        }
        await this.auditDocument(
          input.tenantId,
          input.userId,
          'document_complete',
          input.documentId,
          {
            documentId: input.documentId,
            linked: true,
            entityType: input.entityType,
            entityId: input.entityId,
            traceId: input.auditContext?.traceId,
          },
          input.auditContext,
          tx
        );

        return completeResult;
      }
    );
  }

  async getDownloadUrl(
    tenantId: string,
    userId: string,
    documentId: string,
    filename?: string,
    options?: { allowNotScanned?: boolean; auditContext?: DocumentAuditContext }
  ): Promise<string> {
    const auditContext = options?.auditContext;
    const allowNotScanned = options?.allowNotScanned ?? false;

    const doc = await this.session.withTenant({ tenantId, userId }, async (tx) => {
      const repo = new DrizzleDocumentAttachmentRepo(tx);
      return repo.findById(tenantId, documentId);
    });

    if (!doc) throw new Error('Document not found');
    if (doc.deletedAt) throw new Error('Document deleted');
    if (doc.status !== 'STORED') throw new Error('Document not ready');
    if (doc.integrityStatus !== 'VERIFIED') throw new Error('Document not verified');

    const scanAllowed =
      doc.scanStatus === 'CLEAN' || (allowNotScanned && doc.scanStatus === 'NOT_SCANNED');
    if (!scanAllowed) {
      if (doc.scanStatus === 'SUSPECT' || doc.scanStatus === 'FAILED') {
        await this.session.withTenant({ tenantId, userId }, async (tx) => {
          await this.auditDocument(
            tenantId,
            userId,
            'document_scan_block',
            documentId,
            {
              documentId,
              scanStatus: doc.scanStatus,
              traceId: auditContext?.traceId,
            },
            auditContext,
            tx
          );
        });
      }
      throw new Error('Document scan not clean');
    }

    const displayName = sanitizeFilenameForStorage(filename ?? doc.fileName).safe;
    const url = await this.objectStore.getSignedDownloadUrl({ tenantId, userId }, doc.storageKey, {
      filename: displayName,
    });

    await this.session.withTenant({ tenantId, userId }, async (tx) => {
      await this.auditDocument(
        tenantId,
        userId,
        'document_download',
        documentId,
        {
          documentId,
          traceId: auditContext?.traceId,
        },
        auditContext,
        tx
      );
    });

    return url;
  }

  async list(input: DocumentListInput): Promise<DocumentListResult> {
    return this.session.withTenant({ tenantId: input.tenantId }, async (tx) => {
      const linkRepo = new DrizzleDocumentLinkRepo(tx);
      const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);

      if (!input.entityType || !input.entityId) {
        return { documents: [] };
      }

      const limit = Math.min(input.limit ?? 20, 100);
      const { links, nextCursor } = await linkRepo.findByEntityPaginated(
        input.tenantId,
        input.entityType,
        input.entityId,
        input.cursor,
        limit
      );

      const docs: DocumentListResult['documents'] = [];
      for (const link of links) {
        const doc = await attachmentRepo.findById(input.tenantId, link.documentId);
        if (doc && !doc.deletedAt) {
          const item: DocumentListResult['documents'][number] = {
            documentId: doc.documentId,
            fileName: doc.fileName,
            fileSize: doc.declaredSize ?? doc.observedSize ?? 0,
            mimeType: doc.observedMime ?? doc.declaredMime,
            category: doc.category,
            status: doc.status,
            integrityStatus: doc.integrityStatus,
            scanStatus: doc.scanStatus,
            createdAt: doc.createdAt.toISOString(),
          };
          if (input.includeLinks) {
            const docLinks = await linkRepo.findByDocument(input.tenantId, doc.documentId);
            item.links = docLinks.map((l) => ({ entityType: l.entityType, entityId: l.entityId }));
          }
          docs.push(item);
        }
      }

      return { documents: docs, nextCursor };
    });
  }

  /**
   * Direct upload (< 5MB): compute SHA-256, insert-first dedup, putObject, create link.
   * Plan §1–§2: server computes checksum; only winner uploads; loser reuses existing.
   */
  async uploadDirect(input: DocumentUploadDirectInput): Promise<DocumentUploadDirectResult> {
    if (input.fileBuffer.length > MAX_DIRECT_UPLOAD_BYTES) {
      throw new Error(`Direct upload max ${MAX_DIRECT_UPLOAD_BYTES / 1024 / 1024}MB`);
    }

    if (process.env.R2_MIME_SNIFF_ENABLED === 'true') {
      const validation = await validateMimeAgainstSniff(
        input.fileBuffer,
        input.mimeType ?? 'application/octet-stream'
      );
      if (!validation.ok) {
        throw new Error(
          `MIME mismatch: declared ${input.mimeType ?? 'application/octet-stream'}, detected ${validation.detected}`
        );
      }
    }

    const checksumSha256 = createHash('sha256').update(input.fileBuffer).digest('hex');
    const { safe: fileName, original: fileNameOriginal } = sanitizeFilenameForStorage(
      input.fileName
    );
    const ext = extFromMime(input.mimeType);

    return this.session.withTenant(
      { tenantId: input.tenantId, userId: input.userId },
      async (tx) => {
        const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);
        const linkRepo = new DrizzleDocumentLinkRepo(tx);

        const result = await attachmentRepo.insertOnConflictDoNothing({
          tenantId: input.tenantId,
          keyVersion: KEY_VERSION,
          bucket: BUCKET,
          storageKey: `v${KEY_VERSION}/${input.tenantId}/temp`,
          provider: 'R2',
          fileName,
          fileNameOriginal: fileNameOriginal.slice(0, 255),
          declaredSize: input.fileBuffer.length,
          declaredMime: input.mimeType ?? null,
          checksumSha256,
          status: 'PENDING_UPLOAD',
          integrityStatus: 'PENDING',
          scanStatus: 'NOT_SCANNED',
          category: input.category ?? null,
          description: input.description ?? null,
          createdBy: input.userId,
        });

        let doc: Awaited<ReturnType<typeof attachmentRepo.findById>>;
        let dedupHit: boolean;

        if (result.inserted && result.row) {
          dedupHit = false;
          doc = result.row;
          const storageKey = buildStorageKey(input.tenantId, doc.documentId, ext);
          await attachmentRepo.updateStorageKey(doc.documentId, storageKey);

          await this.objectStore.putObject(
            { tenantId: input.tenantId, userId: input.userId },
            storageKey,
            input.fileBuffer,
            {
              contentType: input.mimeType ?? 'application/octet-stream',
              contentLength: input.fileBuffer.length,
            }
          );

          await attachmentRepo.updateObserved(
            doc.documentId,
            input.fileBuffer.length,
            input.mimeType ?? 'application/octet-stream'
          );
          await attachmentRepo.updateStatus(doc.documentId, 'STORED');
          await attachmentRepo.updateIntegrity(doc.documentId, checksumSha256, 'VERIFIED');

          await this.auditDocument(
            input.tenantId,
            input.userId,
            'document_init',
            doc.documentId,
            {
              documentId: doc.documentId,
              entityType: input.entityType,
              entityId: input.entityId,
              traceId: input.auditContext?.traceId,
            },
            input.auditContext,
            tx
          );
        } else {
          dedupHit = true;
          const existing = await attachmentRepo.findByChecksum(input.tenantId, checksumSha256);
          if (!existing) throw new Error('Dedup conflict but existing row not found');
          doc = existing;

          await this.auditDocument(
            input.tenantId,
            input.userId,
            'document_dedup_hit',
            doc.documentId,
            {
              documentId: doc.documentId,
              entityType: input.entityType,
              entityId: input.entityId,
              traceId: input.auditContext?.traceId,
            },
            input.auditContext,
            tx
          );
        }

        const exists = await linkRepo.exists(
          input.tenantId,
          input.entityType,
          input.entityId,
          doc.documentId
        );
        if (!exists) {
          await linkRepo.insert({
            documentId: doc.documentId,
            tenantId: input.tenantId,
            entityType: input.entityType,
            entityId: input.entityId,
            linkedBy: input.userId,
            linkedCompanyId: input.linkedCompanyId ?? null,
          });
        }

        return {
          documentId: doc.documentId,
          linked: !exists,
          dedupHit,
        };
      }
    );
  }

  async remove(
    tenantId: string,
    userId: string,
    documentId: string,
    auditContext?: DocumentAuditContext
  ): Promise<void> {
    await this.session.withTenant({ tenantId, userId }, async (tx) => {
      const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);
      const outboxWriter = new DrizzleOutboxWriter(tx);

      const doc = await attachmentRepo.findById(tenantId, documentId);
      if (!doc) throw new Error('Document not found');
      if (doc.deletedAt) return; // Idempotent

      await attachmentRepo.softDelete(documentId, userId);
      await outboxWriter.write({
        tenantId,
        eventType: 'DOCUMENT_R2_DELETE',
        payload: { documentId, storageKey: doc.storageKey, bucket: doc.bucket },
      });
      await this.auditDocument(
        tenantId,
        userId,
        'document_delete',
        documentId,
        {
          documentId,
          traceId: auditContext?.traceId,
        },
        auditContext,
        tx
      );
    });
  }

  private async auditDocument(
    tenantId: string,
    userId: string,
    action: string,
    recordId: string,
    newData: Record<string, unknown>,
    ctx?: DocumentAuditContext,
    tx?: TenantTx
  ): Promise<void> {
    if (!tx) return;
    await tx.insert(auditLogs).values({
      tenantId,
      userId,
      action,
      tableName: 'erp.document_attachment',
      recordId,
      newData,
      ipAddress: ctx?.ip,
      userAgent: ctx?.userAgent,
    });
  }
}
