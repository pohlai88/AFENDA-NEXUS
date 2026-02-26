import { describe, it, expect } from 'vitest';
import { evaluateDocumentCompleteness, type DocumentTraceInput } from '../document-attachment.js';

describe('evaluateDocumentCompleteness', () => {
  it('returns complete when all required categories present', () => {
    const input: DocumentTraceInput = {
      entityType: 'AP_INVOICE',
      entityId: 'inv-001',
      attachments: [
        {
          documentId: 'doc-1',
          fileName: 'invoice.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          category: 'INVOICE',
          description: 'Supplier invoice',
          uploadedBy: 'user-1',
          uploadedAt: '2025-12-01',
          storageRef: 's3://bucket/invoice.pdf',
          checksum: 'abc123',
        },
      ],
      links: [],
    };

    const { result } = evaluateDocumentCompleteness(input);

    expect(result.auditTrailComplete).toBe(true);
    expect(result.missingCategories).toHaveLength(0);
    expect(result.hasInvoice).toBe(true);
    expect(result.documentCount).toBe(1);
  });

  it('identifies missing required categories', () => {
    const input: DocumentTraceInput = {
      entityType: 'AR_INVOICE',
      entityId: 'inv-002',
      attachments: [
        {
          documentId: 'doc-1',
          fileName: 'invoice.pdf',
          fileSize: 512,
          mimeType: 'application/pdf',
          category: 'INVOICE',
          description: 'Customer invoice',
          uploadedBy: 'user-1',
          uploadedAt: '2025-12-01',
          storageRef: 's3://bucket/invoice.pdf',
          checksum: 'def456',
        },
      ],
      links: [],
    };

    const { result } = evaluateDocumentCompleteness(input);

    // AR_INVOICE requires INVOICE + CONTRACT
    expect(result.auditTrailComplete).toBe(false);
    expect(result.missingCategories).toContain('CONTRACT');
    expect(result.hasContract).toBe(false);
  });

  it('returns incomplete when no attachments', () => {
    const input: DocumentTraceInput = {
      entityType: 'JOURNAL',
      entityId: 'je-001',
      attachments: [],
      links: [],
    };

    const { result } = evaluateDocumentCompleteness(input);

    expect(result.auditTrailComplete).toBe(false);
    expect(result.documentCount).toBe(0);
  });

  it('computes total file size', () => {
    const input: DocumentTraceInput = {
      entityType: 'EXPENSE_CLAIM',
      entityId: 'exp-001',
      attachments: [
        {
          documentId: 'doc-1',
          fileName: 'receipt1.jpg',
          fileSize: 2048,
          mimeType: 'image/jpeg',
          category: 'RECEIPT',
          description: 'Taxi receipt',
          uploadedBy: 'user-1',
          uploadedAt: '2025-12-01',
          storageRef: 's3://bucket/r1.jpg',
          checksum: 'ghi789',
        },
        {
          documentId: 'doc-2',
          fileName: 'receipt2.jpg',
          fileSize: 3072,
          mimeType: 'image/jpeg',
          category: 'RECEIPT',
          description: 'Meal receipt',
          uploadedBy: 'user-1',
          uploadedAt: '2025-12-01',
          storageRef: 's3://bucket/r2.jpg',
          checksum: 'jkl012',
        },
      ],
      links: [],
    };

    const { result } = evaluateDocumentCompleteness(input);

    expect(result.totalFileSize).toBe(5120);
    expect(result.hasReceipt).toBe(true);
    expect(result.auditTrailComplete).toBe(true);
  });

  it('deduplicates category list', () => {
    const input: DocumentTraceInput = {
      entityType: 'LEASE_CONTRACT',
      entityId: 'lease-001',
      attachments: [
        {
          documentId: 'doc-1',
          fileName: 'contract-v1.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
          category: 'CONTRACT',
          description: 'Original lease',
          uploadedBy: 'user-1',
          uploadedAt: '2025-01-01',
          storageRef: 's3://bucket/c1.pdf',
          checksum: 'mno345',
        },
        {
          documentId: 'doc-2',
          fileName: 'contract-v2.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
          category: 'CONTRACT',
          description: 'Amended lease',
          uploadedBy: 'user-1',
          uploadedAt: '2025-06-01',
          storageRef: 's3://bucket/c2.pdf',
          checksum: 'pqr678',
        },
      ],
      links: [],
    };

    const { result } = evaluateDocumentCompleteness(input);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toBe('CONTRACT');
    expect(result.documentCount).toBe(2);
  });

  it('provides audit explanation', () => {
    const calc = evaluateDocumentCompleteness({
      entityType: 'BANK_RECONCILIATION',
      entityId: 'recon-001',
      attachments: [],
      links: [],
    });

    expect(calc.explanation).toContain('Document trace');
    expect(calc.explanation).toContain('BANK_RECONCILIATION');
    expect(calc.explanation).toContain('INCOMPLETE');
  });
});
