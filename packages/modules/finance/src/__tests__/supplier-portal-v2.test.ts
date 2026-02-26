/**
 * Supplier Portal v2 (N7–N11) unit tests.
 *
 * N7:  Statement upload + reconciliation
 * N8:  Document vault with SHA-256 integrity
 * N9:  Dispute / query management
 * N10: Notification preferences
 * N11: Compliance status tracking
 */
import { describe, it, expect } from 'vitest';
import { ok, err, NotFoundError, money, companyId, ledgerId } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { Supplier, SupplierBankAccount } from '../slices/ap/entities/supplier.js';
import type { ApInvoice } from '../slices/ap/entities/ap-invoice.js';
import type {
  ISupplierRepo,
  UpdateSupplierInput,
  CreateSupplierBankAccountInput,
} from '../slices/ap/ports/supplier-repo.js';
import type { IApInvoiceRepo } from '../slices/ap/ports/ap-invoice-repo.js';
import type { IOutboxWriter, OutboxEvent } from '../shared/ports/outbox-writer.js';

import { supplierStatementRecon } from '../slices/ap/services/supplier-portal-statement-recon.js';
import {
  supplierUploadDocument,
  supplierListDocuments,
  supplierVerifyDocumentIntegrity,
  type SupplierDocument,
  type ISupplierDocumentRepo,
} from '../slices/ap/services/supplier-portal-document-vault.js';
import {
  supplierCreateDispute,
  supplierListDisputes,
  supplierGetDisputeById,
  type SupplierDispute,
  type ISupplierDisputeRepo,
} from '../slices/ap/services/supplier-portal-dispute.js';
import {
  supplierGetNotificationPrefs,
  supplierUpdateNotificationPrefs,
  type SupplierNotificationPref,
  type ISupplierNotificationPrefRepo,
} from '../slices/ap/services/supplier-portal-notifications.js';
import {
  supplierGetComplianceSummary,
  type SupplierComplianceItem,
  type ISupplierComplianceRepo,
} from '../slices/ap/services/supplier-portal-compliance.js';

// ─── Fixed IDs ──────────────────────────────────────────────────────────────

const SUPPLIER_ID = '00000000-0000-4000-8000-000000000d10';
const TENANT_ID = 't1';
const USER_ID = 'u1';
const COMPANY_ID = '00000000-0000-4000-8000-000000000030';
const LEDGER_ID = '00000000-0000-4000-8000-000000000040';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    tenantId: TENANT_ID,
    companyId: COMPANY_ID,
    code: 'SUP-001',
    name: 'Test Supplier',
    taxId: '123456789',
    currencyCode: 'USD',
    defaultPaymentTermsId: null,
    defaultPaymentMethod: 'BANK_TRANSFER',
    whtRateId: null,
    remittanceEmail: 'supplier@example.com',
    status: 'ACTIVE',
    sites: [],
    bankAccounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeApInvoice(overrides: Partial<ApInvoice> = {}): ApInvoice {
  return {
    id: 'inv-1',
    tenantId: TENANT_ID,
    companyId: companyId(COMPANY_ID),
    supplierId: SUPPLIER_ID,
    ledgerId: ledgerId(LEDGER_ID),
    invoiceNumber: 'INV-001',
    supplierRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(10000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'POSTED',
    invoiceType: 'STANDARD',
    description: 'Test invoice',
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    originalInvoiceId: null,
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Mock Helpers ───────────────────────────────────────────────────────────

function mockSupplierRepo(supplier: Supplier | null = makeSupplier()): ISupplierRepo {
  const suppliers = supplier ? new Map([[supplier.id, supplier]]) : new Map<string, Supplier>();
  return {
    async findById(id: string): Promise<Result<Supplier>> {
      const s = suppliers.get(id);
      return s ? ok(s) : err(new NotFoundError('Supplier', id));
    },
    async findByCode(code: string): Promise<Result<Supplier>> {
      const s = [...suppliers.values()].find((sup) => sup.code === code);
      return s ? ok(s) : err(new NotFoundError('Supplier', code));
    },
    async findAll() {
      return { data: [...suppliers.values()], total: suppliers.size, page: 1, limit: 20 };
    },
    async findByStatus() {
      return { data: [...suppliers.values()], total: suppliers.size, page: 1, limit: 20 };
    },
    async create() {
      return ok(makeSupplier());
    },
    async update(id: string, input: UpdateSupplierInput): Promise<Result<Supplier>> {
      const s = suppliers.get(id);
      if (!s) return err(new NotFoundError('Supplier', id));
      return ok({ ...s, ...input, updatedAt: new Date() });
    },
    async addSite() {
      return ok({
        id: 'site-1',
        supplierId: SUPPLIER_ID,
        siteCode: 'S01',
        name: 'HQ',
        addressLine1: '123 Main',
        addressLine2: null,
        city: 'Cape Town',
        region: 'WC',
        postalCode: '8001',
        countryCode: 'ZAF',
        isPrimary: true,
        isActive: true,
      });
    },
    async addBankAccount(
      input: CreateSupplierBankAccountInput
    ): Promise<Result<SupplierBankAccount>> {
      return ok({
        id: `ba-${Date.now()}`,
        supplierId: input.supplierId,
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        iban: input.iban,
        swiftBic: input.swiftBic,
        localBankCode: input.localBankCode,
        currencyCode: input.currencyCode,
        isPrimary: input.isPrimary,
        isActive: true,
      });
    },
  };
}

function mockApInvoiceRepo(invoices: ApInvoice[] = [makeApInvoice()]): IApInvoiceRepo {
  return {
    async create() {
      return ok(makeApInvoice());
    },
    async findById(id: string) {
      const inv = invoices.find((i) => i.id === id);
      return inv ? ok(inv) : err(new NotFoundError('ApInvoice', id));
    },
    async findBySupplier(supplierId: string) {
      const filtered = invoices.filter((i) => i.supplierId === supplierId);
      return { data: filtered, total: filtered.length, page: 1, limit: 20 };
    },
    async findByStatus() {
      return { data: invoices, total: invoices.length, page: 1, limit: 20 };
    },
    async findAll() {
      return { data: invoices, total: invoices.length, page: 1, limit: 20 };
    },
    async findUnpaid() {
      return invoices.filter((i) => i.status !== 'PAID');
    },
    async updateStatus() {
      return ok(makeApInvoice());
    },
    async recordPayment() {
      return ok(makeApInvoice());
    },
    async recordPaymentWithTrace() {
      return ok({ invoice: makeApInvoice(), trace: {} as any });
    },
  };
}

function mockOutboxWriter(): IOutboxWriter & { events: OutboxEvent[] } {
  const events: OutboxEvent[] = [];
  return {
    events,
    async write(event: OutboxEvent) {
      events.push(event);
    },
  };
}

function mockSupplierDocumentRepo(docs: SupplierDocument[] = []): ISupplierDocumentRepo {
  return {
    async create(doc: SupplierDocument) {
      docs.push(doc);
      return doc;
    },
    async findBySupplierId(supplierId: string, category?) {
      let filtered = docs.filter((d) => d.supplierId === supplierId);
      if (category) filtered = filtered.filter((d) => d.category === category);
      return filtered;
    },
    async findById(id: string) {
      return docs.find((d) => d.id === id) ?? null;
    },
  };
}

function mockSupplierDisputeRepo(disputes: SupplierDispute[] = []): ISupplierDisputeRepo {
  return {
    async create(dispute: SupplierDispute) {
      disputes.push(dispute);
      return dispute;
    },
    async findById(id: string) {
      return disputes.find((d) => d.id === id) ?? null;
    },
    async findBySupplierId(supplierId: string) {
      return disputes.filter((d) => d.supplierId === supplierId);
    },
    async updateStatus(id: string, status, resolution?, resolvedBy?) {
      const d = disputes.find((x) => x.id === id);
      if (!d) return null;
      const updated = {
        ...d,
        status,
        resolution: resolution ?? null,
        resolvedBy: resolvedBy ?? null,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      };
      disputes.splice(disputes.indexOf(d), 1, updated);
      return updated;
    },
  };
}

function mockNotificationPrefRepo(
  prefs: SupplierNotificationPref[] = []
): ISupplierNotificationPrefRepo {
  return {
    async findBySupplierId(supplierId: string) {
      return prefs.filter((p) => p.supplierId === supplierId);
    },
    async upsert(pref: SupplierNotificationPref) {
      prefs.push(pref);
      return pref;
    },
    async bulkUpsert(newPrefs: readonly SupplierNotificationPref[]) {
      for (const p of newPrefs) prefs.push(p);
      return newPrefs;
    },
  };
}

function mockComplianceRepo(items: SupplierComplianceItem[] = []): ISupplierComplianceRepo {
  return {
    async findBySupplierId(supplierId: string) {
      return items.filter((i) => i.supplierId === supplierId);
    },
    async findById(id: string) {
      return items.find((i) => i.id === id) ?? null;
    },
    async upsert(item: SupplierComplianceItem) {
      items.push(item);
      return item;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// N7: Supplier Statement Reconciliation
// ═══════════════════════════════════════════════════════════════════════════

describe('N7: Supplier Statement Reconciliation', () => {
  it('reconciles statement lines against AP invoices', async () => {
    const inv = makeApInvoice({
      id: 'inv-1',
      supplierId: SUPPLIER_ID,
      invoiceDate: new Date('2025-01-15'),
      totalAmount: money(10000n, 'USD'),
    });
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo([inv]),
      outboxWriter: outbox,
    };

    const result = await supplierStatementRecon(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        asOfDate: '2025-06-01',
        statementLines: [
          {
            lineRef: 'SL-001',
            date: '2025-01-15',
            description: 'Invoice payment',
            amount: 10000n,
            currencyCode: 'USD',
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.matchedCount).toBe(1);
      expect(result.value.statementOnlyCount).toBe(0);
      expect(result.value.ledgerOnlyCount).toBe(0);
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('SUPPLIER_STATEMENT_UPLOADED');
  });

  it('identifies statement-only and ledger-only items', async () => {
    const inv = makeApInvoice({
      id: 'inv-1',
      supplierId: SUPPLIER_ID,
      invoiceDate: new Date('2025-01-15'),
      totalAmount: money(5000n, 'USD'),
    });
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo([inv]),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierStatementRecon(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        asOfDate: '2025-06-01',
        statementLines: [
          {
            lineRef: 'SL-001',
            date: '2025-01-15',
            description: 'Unknown charge',
            amount: 99999n,
            currencyCode: 'USD',
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.matchedCount).toBe(0);
      expect(result.value.statementOnlyCount).toBe(1);
      expect(result.value.ledgerOnlyCount).toBe(1);
    }
  });

  it('rejects empty statement lines', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierStatementRecon(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        asOfDate: '2025-06-01',
        statementLines: [],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('rejects inactive supplier', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(makeSupplier({ status: 'INACTIVE' })),
      apInvoiceRepo: mockApInvoiceRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierStatementRecon(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        asOfDate: '2025-06-01',
        statementLines: [
          {
            lineRef: 'SL-1',
            date: '2025-01-01',
            description: 'x',
            amount: 100n,
            currencyCode: 'USD',
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N8: Supplier Document Vault
// ═══════════════════════════════════════════════════════════════════════════

describe('N8: Supplier Document Vault', () => {
  it('uploads a document with SHA-256 checksum', async () => {
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierDocumentRepo: mockSupplierDocumentRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierUploadDocument(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        category: 'CONTRACT',
        title: 'Service Agreement 2025',
        description: 'Annual service contract',
        fileName: 'contract-2025.pdf',
        mimeType: 'application/pdf',
        fileContent: Buffer.from('fake pdf content for testing'),
        expiresAt: '2026-12-31',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.checksumSha256).toHaveLength(64);
      expect(result.value.category).toBe('CONTRACT');
      expect(result.value.title).toBe('Service Agreement 2025');
      expect(result.value.expiresAt).toBeInstanceOf(Date);
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('SUPPLIER_DOCUMENT_UPLOADED');
  });

  it('rejects empty title', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierDocumentRepo: mockSupplierDocumentRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierUploadDocument(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        category: 'CONTRACT',
        title: '   ',
        description: null,
        fileName: 'x.pdf',
        mimeType: 'application/pdf',
        fileContent: Buffer.from('content'),
        expiresAt: null,
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('rejects empty file content', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierDocumentRepo: mockSupplierDocumentRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierUploadDocument(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        category: 'TAX_NOTICE',
        title: 'Tax clearance',
        description: null,
        fileName: 'tax.pdf',
        mimeType: 'application/pdf',
        fileContent: Buffer.alloc(0),
        expiresAt: null,
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('lists documents filtered by category', async () => {
    const docs: SupplierDocument[] = [
      {
        id: 'd1',
        supplierId: SUPPLIER_ID,
        tenantId: TENANT_ID,
        category: 'CONTRACT',
        title: 'A',
        description: null,
        fileName: 'a.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 100,
        checksumSha256: 'abc',
        expiresAt: null,
        uploadedBy: USER_ID,
        createdAt: new Date(),
      },
      {
        id: 'd2',
        supplierId: SUPPLIER_ID,
        tenantId: TENANT_ID,
        category: 'TAX_NOTICE',
        title: 'B',
        description: null,
        fileName: 'b.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 200,
        checksumSha256: 'def',
        expiresAt: null,
        uploadedBy: USER_ID,
        createdAt: new Date(),
      },
    ];
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierDocumentRepo: mockSupplierDocumentRepo(docs),
    };

    const result = await supplierListDocuments(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, category: 'CONTRACT' },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.category).toBe('CONTRACT');
    }
  });

  it('verifies document integrity — matching checksum', async () => {
    const content = Buffer.from('original content');
    const { createHash } = await import('node:crypto');
    const expectedHash = createHash('sha256').update(content).digest('hex');

    const doc: SupplierDocument = {
      id: 'd1',
      supplierId: SUPPLIER_ID,
      tenantId: TENANT_ID,
      category: 'CONTRACT',
      title: 'Test',
      description: null,
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: content.length,
      checksumSha256: expectedHash,
      expiresAt: null,
      uploadedBy: USER_ID,
      createdAt: new Date(),
    };

    const result = await supplierVerifyDocumentIntegrity(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, documentId: 'd1', fileContent: content },
      { supplierDocumentRepo: mockSupplierDocumentRepo([doc]) }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verified).toBe(true);
    }
  });

  it('detects integrity mismatch', async () => {
    const doc: SupplierDocument = {
      id: 'd1',
      supplierId: SUPPLIER_ID,
      tenantId: TENANT_ID,
      category: 'CONTRACT',
      title: 'Test',
      description: null,
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 10,
      checksumSha256: 'deadbeef',
      expiresAt: null,
      uploadedBy: USER_ID,
      createdAt: new Date(),
    };

    const result = await supplierVerifyDocumentIntegrity(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        documentId: 'd1',
        fileContent: Buffer.from('tampered'),
      },
      { supplierDocumentRepo: mockSupplierDocumentRepo([doc]) }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verified).toBe(false);
    }
  });

  it('rejects integrity check for wrong supplier', async () => {
    const doc: SupplierDocument = {
      id: 'd1',
      supplierId: 'other-supplier',
      tenantId: TENANT_ID,
      category: 'CONTRACT',
      title: 'Test',
      description: null,
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 10,
      checksumSha256: 'abc',
      expiresAt: null,
      uploadedBy: USER_ID,
      createdAt: new Date(),
    };

    const result = await supplierVerifyDocumentIntegrity(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        documentId: 'd1',
        fileContent: Buffer.from('x'),
      },
      { supplierDocumentRepo: mockSupplierDocumentRepo([doc]) }
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N9: Supplier Disputes
// ═══════════════════════════════════════════════════════════════════════════

describe('N9: Supplier Disputes', () => {
  it('creates a dispute linked to an invoice', async () => {
    const inv = makeApInvoice({ id: 'inv-1', supplierId: SUPPLIER_ID });
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo([inv]),
      supplierDisputeRepo: mockSupplierDisputeRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierCreateDispute(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        invoiceId: 'inv-1',
        paymentRunId: null,
        category: 'INCORRECT_AMOUNT',
        subject: 'Invoice amount wrong',
        description: 'The invoice total should be 5000, not 10000.',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('OPEN');
      expect(result.value.category).toBe('INCORRECT_AMOUNT');
      expect(result.value.invoiceId).toBe('inv-1');
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('SUPPLIER_DISPUTE_CREATED');
  });

  it('rejects dispute for invoice belonging to another supplier', async () => {
    const inv = makeApInvoice({ id: 'inv-1', supplierId: 'other-supplier' });
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo([inv]),
      supplierDisputeRepo: mockSupplierDisputeRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierCreateDispute(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        invoiceId: 'inv-1',
        paymentRunId: null,
        category: 'INCORRECT_AMOUNT',
        subject: 'Wrong amount',
        description: 'Details here',
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('rejects dispute without invoice or payment run reference', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      apInvoiceRepo: mockApInvoiceRepo(),
      supplierDisputeRepo: mockSupplierDisputeRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierCreateDispute(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        invoiceId: null,
        paymentRunId: null,
        category: 'OTHER',
        subject: 'General query',
        description: 'Some description',
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('lists disputes for supplier', async () => {
    const disputes: SupplierDispute[] = [
      {
        id: 'disp-1',
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        invoiceId: 'inv-1',
        paymentRunId: null,
        category: 'INCORRECT_AMOUNT',
        subject: 'Test',
        description: 'Desc',
        status: 'OPEN',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        createdBy: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierDisputeRepo: mockSupplierDisputeRepo(disputes),
    };

    const result = await supplierListDisputes(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('gets dispute by ID with scope enforcement', async () => {
    const dispute: SupplierDispute = {
      id: 'disp-1',
      tenantId: TENANT_ID,
      supplierId: 'other-supplier',
      invoiceId: null,
      paymentRunId: 'pr-1',
      category: 'MISSING_PAYMENT',
      subject: 'Missing',
      description: 'Where is my payment',
      status: 'OPEN',
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
      createdBy: 'other-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const deps = {
      supplierDisputeRepo: mockSupplierDisputeRepo([dispute]),
    };

    const result = await supplierGetDisputeById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, disputeId: 'disp-1' },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N10: Supplier Notification Preferences
// ═══════════════════════════════════════════════════════════════════════════

describe('N10: Supplier Notification Preferences', () => {
  it('retrieves notification preferences', async () => {
    const prefs: SupplierNotificationPref[] = [
      {
        supplierId: SUPPLIER_ID,
        tenantId: TENANT_ID,
        eventType: 'PAYMENT_EXECUTED',
        channel: 'EMAIL',
        enabled: true,
        webhookUrl: null,
      },
    ];
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierNotificationPrefRepo: mockNotificationPrefRepo(prefs),
    };

    const result = await supplierGetNotificationPrefs(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.eventType).toBe('PAYMENT_EXECUTED');
    }
  });

  it('updates notification preferences', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierNotificationPrefRepo: mockNotificationPrefRepo(),
    };

    const result = await supplierUpdateNotificationPrefs(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        preferences: [
          { eventType: 'PAYMENT_EXECUTED', channel: 'EMAIL', enabled: true },
          {
            eventType: 'HOLD_PLACED',
            channel: 'WEBHOOK',
            enabled: true,
            webhookUrl: 'https://example.com/hook',
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });

  it('rejects webhook pref without HTTPS URL', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierNotificationPrefRepo: mockNotificationPrefRepo(),
    };

    const result = await supplierUpdateNotificationPrefs(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        preferences: [
          {
            eventType: 'PAYMENT_EXECUTED',
            channel: 'WEBHOOK',
            enabled: true,
            webhookUrl: 'http://insecure.com',
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('rejects invalid event type', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierNotificationPrefRepo: mockNotificationPrefRepo(),
    };

    const result = await supplierUpdateNotificationPrefs(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        preferences: [{ eventType: 'BOGUS_EVENT' as any, channel: 'EMAIL', enabled: true }],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N11: Supplier Compliance Status
// ═══════════════════════════════════════════════════════════════════════════

describe('N11: Supplier Compliance Status', () => {
  it('returns compliance summary with live status computation', async () => {
    const now = new Date();
    const items: SupplierComplianceItem[] = [
      {
        id: 'c1',
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        itemType: 'KYC',
        status: 'VALID',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        documentId: null,
        notes: null,
        lastVerifiedBy: null,
        lastVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'c2',
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        itemType: 'TAX_CLEARANCE',
        status: 'VALID',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date('2020-01-01'),
        documentId: null,
        notes: null,
        lastVerifiedBy: null,
        lastVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'c3',
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        itemType: 'INSURANCE_LIABILITY',
        status: 'VALID',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        documentId: null,
        notes: null,
        lastVerifiedBy: null,
        lastVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierComplianceRepo: mockComplianceRepo(items),
    };

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(3);
      expect(result.value.overallStatus).toBe('EXPIRED');
      expect(result.value.expiredCount).toBe(1);
      expect(result.value.expiringSoonCount).toBe(1);
    }
  });

  it('returns VALID when all items are current', async () => {
    const now = new Date();
    const items: SupplierComplianceItem[] = [
      {
        id: 'c1',
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        itemType: 'KYC',
        status: 'VALID',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        documentId: null,
        notes: null,
        lastVerifiedBy: null,
        lastVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const deps = {
      supplierRepo: mockSupplierRepo(),
      supplierComplianceRepo: mockComplianceRepo(items),
    };

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallStatus).toBe('VALID');
      expect(result.value.expiredCount).toBe(0);
    }
  });

  it('rejects unknown supplier', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(null),
      supplierComplianceRepo: mockComplianceRepo(),
    };

    const result = await supplierGetComplianceSummary(
      { tenantId: TENANT_ID, supplierId: 'unknown' },
      deps
    );

    expect(result.ok).toBe(false);
  });
});
