/**
 * Document attachment and link repository port.
 */
import type { LinkedEntityType } from '../../../shared/ports/document-attachment.js';

export type DocumentStatus = 'PENDING_UPLOAD' | 'STORED' | 'DELETED';
export type IntegrityStatus = 'PENDING' | 'VERIFIED' | 'FAILED';
export type ScanStatus = 'NOT_SCANNED' | 'CLEAN' | 'SUSPECT' | 'FAILED';

export interface DocumentAttachmentRow {
  documentId: string;
  tenantId: string;
  keyVersion: number;
  bucket: string;
  storageKey: string;
  provider: string;
  fileName: string;
  fileNameOriginal: string | null;
  declaredSize: number | null;
  declaredMime: string | null;
  observedSize: number | null;
  observedMime: string | null;
  checksumSha256: string | null;
  status: DocumentStatus;
  integrityStatus: IntegrityStatus;
  scanStatus: ScanStatus;
  category: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  storageDeletedAt: Date | null;
}

export interface DocumentLinkRow {
  documentId: string;
  tenantId: string;
  entityType: LinkedEntityType;
  entityId: string;
  linkedBy: string;
  linkedAt: Date;
  linkedCompanyId: string | null;
}

export interface InsertDocumentAttachmentInput {
  documentId?: string;
  tenantId: string;
  keyVersion?: number;
  bucket: string;
  storageKey: string;
  provider?: string;
  fileName: string;
  fileNameOriginal?: string | null;
  declaredSize?: number | null;
  declaredMime?: string | null;
  checksumSha256?: string | null;
  status: DocumentStatus;
  integrityStatus: IntegrityStatus;
  scanStatus?: ScanStatus;
  category?: string | null;
  description?: string | null;
  createdBy?: string | null;
}

export interface InsertDocumentLinkInput {
  documentId: string;
  tenantId: string;
  entityType: LinkedEntityType;
  entityId: string;
  linkedBy: string;
  linkedCompanyId?: string | null;
}

export interface IDocumentAttachmentRepo {
  insert(input: InsertDocumentAttachmentInput): Promise<DocumentAttachmentRow>;
  insertOnConflictDoNothing(
    input: InsertDocumentAttachmentInput
  ): Promise<{ inserted: boolean; row?: DocumentAttachmentRow }>;
  findById(tenantId: string, documentId: string): Promise<DocumentAttachmentRow | null>;
  findByChecksumVerified(
    tenantId: string,
    checksumSha256: string,
    excludeDocumentId?: string
  ): Promise<DocumentAttachmentRow | null>;
  /** Find any non-deleted row with checksum (for insert-first dedup conflict resolution) */
  findByChecksum(tenantId: string, checksumSha256: string): Promise<DocumentAttachmentRow | null>;
  updateStatus(documentId: string, status: DocumentStatus): Promise<void>;
  updateIntegrity(
    documentId: string,
    checksumSha256: string,
    integrityStatus: IntegrityStatus
  ): Promise<void>;
  updateIntegrityFailed(documentId: string): Promise<void>;
  updateObserved(documentId: string, observedSize: number, observedMime: string): Promise<void>;
  softDelete(documentId: string, deletedBy: string): Promise<void>;
  updateStorageDeleted(documentId: string): Promise<void>;
  updateStorageKey(documentId: string, storageKey: string): Promise<void>;
}

export interface DocumentLinkCursor {
  linkedAt: string;
  documentId: string;
}

export interface FindByEntityPaginatedResult {
  links: DocumentLinkRow[];
  nextCursor?: string;
}

export interface IDocumentLinkRepo {
  insert(input: InsertDocumentLinkInput): Promise<DocumentLinkRow>;
  findByEntity(
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string
  ): Promise<DocumentLinkRow[]>;
  findByEntityPaginated(
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<FindByEntityPaginatedResult>;
  findByDocument(tenantId: string, documentId: string): Promise<DocumentLinkRow[]>;
  deleteByDocumentId(tenantId: string, documentId: string): Promise<void>;
  exists(
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string,
    documentId: string
  ): Promise<boolean>;
}
