/**
 * GAP-E2: Document Attachment / Source Document Linkage port.
 * Pure types and validation — defines the IDocumentStore port interface
 * and attachment metadata types for linking source documents to
 * financial entities (journals, invoices, assets, etc.).
 *
 * Essential for paperless audit and remote audit engagement.
 * Shared across document and reporting slices (E16 slice isolation).
 */
import type { CalculatorResult } from '../types.js';

export type DocumentCategory =
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
  | 'OTHER';

export type LinkedEntityType =
  | 'JOURNAL'
  | 'AP_INVOICE'
  | 'AR_INVOICE'
  | 'FIXED_ASSET'
  | 'LEASE_CONTRACT'
  | 'EXPENSE_CLAIM'
  | 'BANK_RECONCILIATION'
  | 'TAX_RETURN'
  | 'PROVISION'
  | 'IC_TRANSACTION';

export interface DocumentAttachment {
  readonly documentId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly category: DocumentCategory;
  readonly description: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly storageRef: string;
  readonly checksum: string;
}

export interface DocumentLink {
  readonly documentId: string;
  readonly entityType: LinkedEntityType;
  readonly entityId: string;
  readonly linkedBy: string;
  readonly linkedAt: string;
}

export interface DocumentTraceInput {
  readonly entityType: LinkedEntityType;
  readonly entityId: string;
  readonly attachments: readonly DocumentAttachment[];
  readonly links: readonly DocumentLink[];
}

export interface DocumentTraceResult {
  readonly entityType: LinkedEntityType;
  readonly entityId: string;
  readonly documentCount: number;
  readonly totalFileSize: number;
  readonly categories: readonly string[];
  readonly hasInvoice: boolean;
  readonly hasReceipt: boolean;
  readonly hasContract: boolean;
  readonly missingCategories: readonly string[];
  readonly auditTrailComplete: boolean;
}

/**
 * IDocumentStore port — adapter interface for document storage backends
 * (S3, Azure Blob, GCS, local filesystem, etc.).
 */
export interface IDocumentStore {
  attach(
    entityType: LinkedEntityType,
    entityId: string,
    meta: Omit<DocumentAttachment, 'documentId'>
  ): Promise<DocumentAttachment>;
  link(
    documentId: string,
    entityType: LinkedEntityType,
    entityId: string,
    userId: string
  ): Promise<DocumentLink>;
  findByEntity(
    entityType: LinkedEntityType,
    entityId: string
  ): Promise<readonly DocumentAttachment[]>;
  getDownloadUrl(documentId: string): Promise<string>;
  remove(documentId: string): Promise<void>;
}

/** Required document categories for a complete audit trail per entity type. */
const REQUIRED_CATEGORIES: Record<LinkedEntityType, readonly DocumentCategory[]> = {
  JOURNAL: ['INVOICE', 'RECEIPT'],
  AP_INVOICE: ['INVOICE'],
  AR_INVOICE: ['INVOICE', 'CONTRACT'],
  FIXED_ASSET: ['INVOICE', 'VALUATION_REPORT'],
  LEASE_CONTRACT: ['CONTRACT'],
  EXPENSE_CLAIM: ['RECEIPT'],
  BANK_RECONCILIATION: ['BANK_STATEMENT'],
  TAX_RETURN: ['TAX_NOTICE'],
  PROVISION: ['LEGAL_OPINION'],
  IC_TRANSACTION: ['INVOICE', 'CONTRACT'],
};

/**
 * Evaluates document completeness for an entity's audit trail.
 */
export function evaluateDocumentCompleteness(
  input: DocumentTraceInput
): CalculatorResult<DocumentTraceResult> {
  const categories = [...new Set(input.attachments.map((a) => a.category))];
  const totalFileSize = input.attachments.reduce((s, a) => s + a.fileSize, 0);
  const hasInvoice = categories.includes('INVOICE');
  const hasReceipt = categories.includes('RECEIPT');
  const hasContract = categories.includes('CONTRACT');

  const required = REQUIRED_CATEGORIES[input.entityType] ?? [];
  const missingCategories = required.filter((c) => !categories.includes(c));
  const auditTrailComplete = missingCategories.length === 0 && input.attachments.length > 0;

  return {
    result: {
      entityType: input.entityType,
      entityId: input.entityId,
      documentCount: input.attachments.length,
      totalFileSize,
      categories,
      hasInvoice,
      hasReceipt,
      hasContract,
      missingCategories,
      auditTrailComplete,
    },
    inputs: {
      entityType: input.entityType,
      entityId: input.entityId,
      documentCount: input.attachments.length,
    },
    explanation:
      `Document trace: ${input.entityType}/${input.entityId} — ` +
      `${input.attachments.length} documents, ` +
      `${auditTrailComplete ? 'audit trail COMPLETE' : `INCOMPLETE (missing: ${missingCategories.join(', ')})`}`,
  };
}
