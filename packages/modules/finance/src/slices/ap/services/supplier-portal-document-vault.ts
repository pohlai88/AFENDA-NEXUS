import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import { createHash } from 'node:crypto';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N8: Supplier document vault — contracts, agreements, compliance docs.
 *
 * Allows suppliers to upload documents (contracts, tax clearances,
 * insurance certificates, agreements) and links them to the supplier
 * entity with SHA-256 integrity stamps. Documents are stored via the
 * existing document-attachment service; this service handles the
 * supplier-scoped metadata, validation, and audit trail.
 *
 * Document categories for supplier vault:
 *   - CONTRACT — supplier agreements, service contracts
 *   - TAX_NOTICE — tax clearance certificates
 *   - INSURANCE_POLICY — insurance/liability certificates
 *   - CORRESPONDENCE — general supplier correspondence
 *   - OTHER — catch-all for uncategorized
 */

export type SupplierDocumentCategory =
  | 'CONTRACT'
  | 'TAX_NOTICE'
  | 'INSURANCE_POLICY'
  | 'CORRESPONDENCE'
  | 'OTHER';

export interface SupplierDocument {
  readonly id: string;
  readonly supplierId: string;
  readonly tenantId: string;
  readonly category: SupplierDocumentCategory;
  readonly title: string;
  readonly description: string | null;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly checksumSha256: string;
  readonly expiresAt: Date | null;
  readonly uploadedBy: string;
  readonly createdAt: Date;
}

export interface SupplierDocumentUploadInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly category: SupplierDocumentCategory;
  readonly title: string;
  readonly description: string | null;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileContent: Buffer;
  readonly expiresAt: string | null;
}

export interface SupplierDocumentListInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly category?: SupplierDocumentCategory;
}

/** In-memory store port — real implementation backed by document_attachment + document_link tables */
export interface ISupplierDocumentRepo {
  create(doc: SupplierDocument): Promise<SupplierDocument>;
  findBySupplierId(
    supplierId: string,
    category?: SupplierDocumentCategory
  ): Promise<readonly SupplierDocument[]>;
  findById(id: string): Promise<SupplierDocument | null>;
}

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'CONTRACT',
  'TAX_NOTICE',
  'INSURANCE_POLICY',
  'CORRESPONDENCE',
  'OTHER',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Upload a supplier document with SHA-256 integrity stamp.
 */
export async function supplierUploadDocument(
  input: SupplierDocumentUploadInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierDocumentRepo: ISupplierDocumentRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<SupplierDocument>> {
  // Validate supplier exists and is active
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status === 'INACTIVE') {
    return err(new AppError('VALIDATION', 'Supplier is inactive'));
  }

  // Validate category
  if (!VALID_CATEGORIES.has(input.category)) {
    return err(new AppError('VALIDATION', `Invalid document category: ${input.category}`));
  }

  // Validate title
  if (!input.title || input.title.trim().length === 0) {
    return err(new AppError('VALIDATION', 'Document title is required'));
  }

  // Validate file size
  if (input.fileContent.length === 0) {
    return err(new AppError('VALIDATION', 'File content cannot be empty'));
  }
  if (input.fileContent.length > MAX_FILE_SIZE) {
    return err(new AppError('VALIDATION', 'File exceeds maximum size of 50MB'));
  }

  // Compute SHA-256 checksum for integrity
  const checksumSha256 = createHash('sha256').update(input.fileContent).digest('hex');

  const doc: SupplierDocument = {
    id: `sdoc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    supplierId: input.supplierId,
    tenantId: input.tenantId,
    category: input.category,
    title: input.title.trim(),
    description: input.description,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileContent.length,
    checksumSha256,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    uploadedBy: input.userId,
    createdAt: new Date(),
  };

  const created = await deps.supplierDocumentRepo.create(doc);

  // Emit audit event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_DOCUMENT_UPLOADED,
    payload: {
      supplierId: input.supplierId,
      documentId: created.id,
      category: created.category,
      title: created.title,
      checksumSha256: created.checksumSha256,
      fileSizeBytes: created.fileSizeBytes,
      userId: input.userId,
    },
  });

  return ok(created);
}

/**
 * List supplier documents, optionally filtered by category.
 */
export async function supplierListDocuments(
  input: SupplierDocumentListInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierDocumentRepo: ISupplierDocumentRepo;
  }
): Promise<Result<readonly SupplierDocument[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }

  const docs = await deps.supplierDocumentRepo.findBySupplierId(input.supplierId, input.category);
  return ok(docs);
}

/**
 * Verify the SHA-256 integrity of a previously uploaded document.
 * Returns ok(true) if checksum matches, ok(false) if mismatch.
 */
export async function supplierVerifyDocumentIntegrity(
  input: {
    readonly tenantId: string;
    readonly supplierId: string;
    readonly documentId: string;
    readonly fileContent: Buffer;
  },
  deps: {
    supplierDocumentRepo: ISupplierDocumentRepo;
  }
): Promise<Result<{ verified: boolean; expectedChecksum: string; actualChecksum: string }>> {
  const doc = await deps.supplierDocumentRepo.findById(input.documentId);
  if (!doc) {
    return err(new AppError('NOT_FOUND', 'Document not found'));
  }

  if (doc.supplierId !== input.supplierId) {
    return err(new AppError('VALIDATION', 'Document does not belong to this supplier'));
  }

  const actualChecksum = createHash('sha256').update(input.fileContent).digest('hex');
  return ok({
    verified: actualChecksum === doc.checksumSha256,
    expectedChecksum: doc.checksumSha256,
    actualChecksum,
  });
}
